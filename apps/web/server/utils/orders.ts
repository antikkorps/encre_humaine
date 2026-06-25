import { type Database, eq, type NewOrder, type Order, orders } from "@encre/db";
import type Stripe from "stripe";

/**
 * Logique « dure » de la boutique — docs/03-api-contracts.md §1.
 * Volontairement SANS globals Nitro (createError/useRuntimeConfig) : ce module
 * est du pur métier + accès DB, donc testable hors runtime (cf. test
 * d'idempotence sous PGlite). Le handler webhook l'orchestre.
 */

/** Émetteur des emails de commande, injecté pour découpler l'envoi du 2xx. */
export interface OrderEmailer {
  /** Confirmation au client (best-effort, ne doit pas bloquer le 2xx). */
  sendCustomerConfirmation(order: Order): Promise<void>;
  /** Notification à Eléonore (best-effort). */
  sendOwnerNotification(order: Order): Promise<void>;
}

/** Récupère l'id d'un champ Stripe qui peut être l'objet étendu ou son id. */
function refId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** Mappe une session Checkout (line_items étendus) → ligne `orders` (snapshot). */
export function sessionToOrder(session: Stripe.Checkout.Session): NewOrder {
  const lineItems = session.line_items?.data ?? [];
  const items: NewOrder["items"] = lineItems.map((li) => ({
    stripeProductId: refId(li.price?.product as string | { id: string } | null) ?? undefined,
    name: li.description ?? "Article",
    quantity: li.quantity ?? 1,
    unitAmount: li.price?.unit_amount ?? 0,
    currency: li.price?.currency ?? session.currency ?? "eur",
  }));

  // L'adresse de livraison vit sous `collected_information` (API récente).
  const shippingDetails = session.collected_information?.shipping_details ?? null;
  const addr = shippingDetails?.address ?? null;
  const shipping = addr
    ? {
        name: shippingDetails?.name ?? undefined,
        line1: addr.line1 ?? undefined,
        line2: addr.line2 ?? undefined,
        postalCode: addr.postal_code ?? undefined,
        city: addr.city ?? undefined,
        country: addr.country ?? undefined,
      }
    : null;

  return {
    stripeSessionId: session.id,
    stripePaymentIntentId: refId(session.payment_intent),
    stripeCustomerId: refId(session.customer),
    email: session.customer_details?.email ?? session.customer_email ?? "",
    name: session.customer_details?.name ?? null,
    shipping,
    items,
    amountTotal: session.amount_total ?? 0,
    amountShipping: session.total_details?.amount_shipping ?? 0,
    currency: session.currency ?? "eur",
    // Franchise en base (ADR #4) : pas de TVA tant que VAT_ENABLED n'est pas câblé.
    vatApplied: false,
    amountVat: 0,
    status: "paid",
  };
}

/**
 * Enregistre la commande issue d'un `checkout.session.completed`, de façon
 * idempotente (docs/03 §1.5) : `ON CONFLICT (stripe_session_id) DO NOTHING`.
 * - Première fois : insère, envoie les emails (best-effort), renvoie created=true.
 * - Rejeu Stripe : aucune insertion, aucun email, renvoie created=false.
 *
 * L'envoi d'email ne fait jamais échouer la persistance (découplage du 2xx).
 */
export async function recordCheckoutSession(
  db: Database,
  session: Stripe.Checkout.Session,
  emailer: OrderEmailer,
): Promise<{ created: boolean; order: Order | null }> {
  const inserted = await db
    .insert(orders)
    .values(sessionToOrder(session))
    .onConflictDoNothing({ target: orders.stripeSessionId })
    .returning();

  const order = inserted[0] ?? null;
  if (!order) return { created: false, order: null }; // rejeu : déjà traité

  // Best-effort : un échec d'email ne crée pas de doublon ni de 5xx (docs/03 §1).
  try {
    await emailer.sendCustomerConfirmation(order);
    await emailer.sendOwnerNotification(order);
  } catch (err) {
    console.error(`[stripe/webhook] envoi email commande ${order.id} échoué :`, err);
  }

  return { created: true, order };
}

/**
 * Applique un remboursement Stripe (`charge.refunded`) — docs/03 §1.
 * Met `orders.status` à `refunded` (total) ou `partially_refunded` (partiel).
 * Rapproche la commande par `payment_intent`. No-op si commande inconnue.
 */
export async function applyRefund(db: Database, charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = refId(charge.payment_intent);
  if (!paymentIntentId) return;

  const fullyRefunded = charge.amount_refunded >= charge.amount;
  const updated = await db
    .update(orders)
    .set({ status: fullyRefunded ? "refunded" : "partially_refunded" })
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .returning({ id: orders.id });

  // Aucune commande rapprochée : désync potentielle Stripe↔DB → on alerte
  // (best-effort, pas d'échec : un refund orphelin ne doit pas faire rejouer).
  if (updated.length === 0) {
    console.warn(
      `[stripe/webhook] charge.refunded sans commande correspondante (payment_intent ${paymentIntentId})`,
    );
  }
}
