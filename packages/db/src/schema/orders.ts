import { boolean, index, integer, jsonb, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, primaryId, updatedAt } from "./_helpers.ts";
import { app } from "./_schema.ts";
import { fulfillmentStatusEnum, orderStatusEnum } from "./enums.ts";

/**
 * Table `orders` — miroir des commandes Stripe. docs/01-data-model.md §5.
 * Créée UNIQUEMENT par le webhook `checkout.session.completed`.
 * Stripe reste la source de vérité du paiement ; idempotence via
 * `stripe_session_id` unique (+ ON CONFLICT DO NOTHING, cf. docs/03 §1).
 */
export const orders = app.table(
  "orders",
  {
    id: primaryId(),

    // Liens Stripe (source de vérité)
    stripeSessionId: text("stripe_session_id").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeCustomerId: text("stripe_customer_id"),

    // Client (snapshot)
    email: text("email").notNull(),
    name: text("name"),
    shipping: jsonb("shipping").$type<{
      name?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    }>(),

    // Contenu de la commande (snapshot immuable)
    items: jsonb("items")
      .$type<
        Array<{
          stripeProductId?: string;
          name: string;
          quantity: number;
          unitAmount: number;
          currency: string;
        }>
      >()
      .notNull(),

    amountTotal: integer("amount_total").notNull(), // centimes
    amountShipping: integer("amount_shipping").default(0),
    currency: text("currency").notNull().default("eur"),

    // TVA : false en franchise en base ; passera true au basculement (ADR #4)
    vatApplied: boolean("vat_applied").notNull().default(false),
    amountVat: integer("amount_vat").default(0),

    status: orderStatusEnum("status").notNull().default("paid"),

    // Suivi logistique : colonnes prêtes dès maintenant (évite une migration phase 2)
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("pending"),
    trackingNumber: text("tracking_number"),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_stripe_session_ux").on(t.stripeSessionId), // idempotence webhook
    index("orders_email_ix").on(t.email),
    index("orders_fulfillment_ix").on(t.fulfillmentStatus),
    index("orders_created_ix").on(t.createdAt),
  ],
);
