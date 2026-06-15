import { CheckoutPayloadSchema } from "@encre/shared";
import * as v from "valibot";

/**
 * Tunnel d'achat — `POST /api/shop/checkout` (docs/05-shop.md §3).
 * Crée une Checkout Session Stripe (hébergée, FR, port forfait, franchise en
 * base) et renvoie l'URL de redirection. Aucun prix client n'est fait confiance :
 * on revalide chaque `priceId` contre le catalogue actif (docs/05 §8.1-8.2),
 * Stripe calcule les montants.
 */
export default defineEventHandler(async (event) => {
  // Rate-limit endpoint public (docs/06 §2). Pas de Turnstile (intention d'achat).
  enforceRateLimit(event, "checkout", { limit: 10, windowMs: 60_000 });

  const parsed = v.safeParse(CheckoutPayloadSchema, await readBody(event));
  if (!parsed.success) {
    throwApiError("validation_error", "Panier invalide.");
  }
  const { items, customerEmail } = parsed.output;

  // Seuls les produits published + prix actifs sont achetables.
  const catalog = await loadCatalog();
  const purchasable = new Set(catalog.map((p) => p.priceId));
  if (items.some((it) => !purchasable.has(it.priceId))) {
    throwApiError("validation_error", "Un article n'est plus disponible.");
  }

  // Fusionne les quantités d'un même prix (Stripe refuse les doublons de price).
  const quantities = new Map<string, number>();
  for (const it of items) {
    quantities.set(it.priceId, (quantities.get(it.priceId) ?? 0) + it.quantity);
  }

  const config = useRuntimeConfig();
  const base = config.public.baseUrl;
  const vatEnabled = config.public.vatEnabled;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [...quantities].map(([price, quantity]) => ({ price, quantity })),
    locale: "fr",
    customer_creation: "if_required",
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    shipping_address_collection: { allowed_countries: ["FR"] },
    shipping_options: [{ shipping_rate: config.stripeShippingRateFr }],
    automatic_tax: { enabled: vatEnabled }, // false en franchise en base (ADR #4)
    invoice_creation: { enabled: true },
    ...(vatEnabled
      ? {}
      : { custom_text: { submit: { message: "TVA non applicable, art. 293 B du CGI" } } }),
    success_url: `${base}/boutique/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/boutique`,
  });

  if (!session.url) {
    throwApiError("internal_error", "Création de la session de paiement impossible.");
  }
  return { url: session.url };
});
