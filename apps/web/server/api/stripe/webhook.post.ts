import type Stripe from "stripe";

/**
 * Webhook Stripe — `POST /api/stripe/webhook` (docs/03-api-contracts.md §1).
 *
 * Contraintes critiques :
 *  - body BRUT pour la vérification de signature (pas de body-parser) ;
 *  - signature invalide → 400, aucun traitement ;
 *  - idempotence : `ON CONFLICT DO NOTHING` (cf. `recordCheckoutSession`) ;
 *  - 2xx uniquement après persistance réussie ; erreur transitoire → 5xx
 *    (createError relancée → Stripe réessaie).
 */
export default defineEventHandler(async (event) => {
  const { stripeWebhookSecret } = useRuntimeConfig();
  const signature = getHeader(event, "stripe-signature");
  const rawBody = await readRawBody(event, false); // Buffer : signature exacte

  if (!signature || !rawBody) {
    throwApiError("invalid_signature", "Signature Stripe manquante.");
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe().webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch {
    throwApiError("invalid_signature", "Signature Stripe invalide.");
  }

  const db = serverDb();

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      if (session.payment_status !== "paid") return { received: true }; // rien à faire

      // Le payload webhook ne contient pas les line_items : on récupère la
      // session complète (snapshot fidèle de la commande) avant persistance.
      const full = await stripe().checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "customer_details", "shipping_details"],
      });
      await recordCheckoutSession(db, full, resendOrderEmailer());
      return { received: true };
    }

    case "charge.refunded": {
      await applyRefund(db, stripeEvent.data.object);
      return { received: true };
    }

    default:
      // Événement non géré : accusé de réception (docs/03 §1). On le trace pour
      // repérer un signal Stripe inattendu (ex. litige) sans le faire rejouer.
      console.warn(`[stripe/webhook] événement non géré : ${stripeEvent.type}`);
      return { received: true };
  }
});
