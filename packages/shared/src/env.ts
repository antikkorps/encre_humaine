import * as v from "valibot";

/**
 * Schéma d'environnement consommé par l'app web (Nuxt/Nitro).
 * docs/06-security.md §5 + docs/07-deploy.md §5 : l'app refuse de démarrer
 * si une variable requise manque ou est malformée.
 *
 * NB : ne couvre que ce dont `web` a besoin côté serveur. Les variables
 * propres à directus/umami/caddy sont validées par leurs conteneurs.
 */

const url = () => v.pipe(v.string(), v.url());
const nonEmpty = () => v.pipe(v.string(), v.nonEmpty());

/** "true"/"false" (chaînes d'env) → boolean. */
const boolFromEnv = v.pipe(
  v.optional(v.picklist(["true", "false"]), "false"),
  v.transform((s) => s === "true"),
);

/** Entier non négatif depuis une chaîne d'env. */
const intFromEnv = (fallback: number) =>
  v.pipe(
    v.optional(v.string(), String(fallback)),
    v.transform((s) => Number.parseInt(s, 10)),
    v.number(),
    v.integer(),
    v.minValue(0),
  );

export const ServerEnvSchema = v.object({
  // Domaine
  BASE_URL: url(),

  // Postgres (schéma app uniquement)
  APP_DATABASE_URL: nonEmpty(),

  // Directus (lecture seule, server-side)
  DIRECTUS_PUBLIC_URL: url(),
  DIRECTUS_READ_TOKEN: nonEmpty(),

  // Stripe
  STRIPE_SECRET_KEY: nonEmpty(),
  STRIPE_WEBHOOK_SECRET: nonEmpty(),
  STRIPE_SHIPPING_RATE_FR: nonEmpty(),
  VAT_ENABLED: boolFromEnv,
  VAT_RATE: intFromEnv(0),

  // Resend
  RESEND_API_KEY: nonEmpty(),
  RESEND_AUDIENCE_ID: nonEmpty(),
  NEWSLETTER_FROM: nonEmpty(),
  CONTACT_NOTIFY_TO: v.pipe(v.string(), v.email()),

  // Turnstile (SITE_KEY exposable au client ; SECRET strictement serveur)
  TURNSTILE_SITE_KEY: nonEmpty(),
  TURNSTILE_SECRET_KEY: nonEmpty(),

  // Prise de RDV (embed public — Cal.com, Calendly… ; nom agnostique du provider)
  BOOKING_URL: url(),
});

export type ServerEnv = v.InferOutput<typeof ServerEnvSchema>;

/**
 * Parse + valide `process.env`. Lève une erreur lisible au boot si invalide.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = v.safeParse(ServerEnvSchema, source);
  if (!result.success) {
    const issues = result.issues
      .map((i) => `  - ${i.path?.map((p) => p.key).join(".") ?? "(racine)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuration d'environnement invalide :\n${issues}`);
  }
  return result.output;
}
