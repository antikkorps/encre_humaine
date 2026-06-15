import Stripe from "stripe";

/**
 * Client Stripe côté serveur — docs/03-api-contracts.md §1, docs/05-shop.md.
 * Mémoïsé. La clé secrète vient du runtimeConfig (jamais exposée au client).
 * `apiVersion` non figée ici : on suit la version par défaut du compte Stripe,
 * pinnée par la version du SDK (dépendance verrouillée).
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;
  const { stripeSecretKey } = useRuntimeConfig();
  if (!stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe non configuré (STRIPE_SECRET_KEY).",
    });
  }
  client = new Stripe(stripeSecretKey);
  return client;
}
