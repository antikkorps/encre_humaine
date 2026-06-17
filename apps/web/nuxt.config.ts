import tailwindcss from "@tailwindcss/vite";

// docs/00-global.md (SEO/perf/a11y) + docs/06 (sécurité) + docs/07 (env).
// FR uniquement, SSG/ISR par défaut, hydratation minimale.
export default defineNuxtConfig({
  compatibilityDate: "2025-05-01",
  future: { compatibilityVersion: 4 },

  // reka-ui/nuxt : auto-import des primitives headless (Dialog, Accordion…) —
  // docs/00-global.md §Composants (NavMobile, FaqAccordion). a11y native.
  modules: ["@nuxt/image", "@nuxt/fonts", "@nuxtjs/seo", "reka-ui/nuxt"],

  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },

  app: {
    head: {
      htmlAttrs: { lang: "fr-FR" },
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
    },
  },

  // Valeurs exposées au client = publiques uniquement (docs/06 §5).
  // Les secrets restent côté serveur (runtimeConfig racine, non préfixé `public`).
  // Pontés depuis `process.env` (noms simples du `.env`/compose env_file) : sans
  // ce pont, Nuxt n'overriderait que des clés `NUXT_*`, et les secrets seraient
  // vides au runtime (les utils serveur lèveraient « non configuré »).
  runtimeConfig: {
    appDatabaseUrl: process.env.APP_DATABASE_URL ?? "",
    directusReadToken: process.env.DIRECTUS_READ_TOKEN ?? "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    stripeShippingRateFr: process.env.STRIPE_SHIPPING_RATE_FR ?? "",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    resendAudienceId: process.env.RESEND_AUDIENCE_ID ?? "",
    newsletterFrom: process.env.NEWSLETTER_FROM ?? "",
    contactNotifyTo: process.env.CONTACT_NOTIFY_TO ?? "",
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
    public: {
      baseUrl: process.env.BASE_URL ?? "",
      directusPublicUrl: process.env.DIRECTUS_PUBLIC_URL ?? "",
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ?? "",
      calendlyUrl: process.env.CALENDLY_URL ?? "",
      vatEnabled: process.env.VAT_ENABLED === "true",
    },
  },

  // Nitro : tâches planifiées (purge RGPD newsletter, docs/03 §3.4). Quotidien 03h.
  nitro: {
    experimental: { tasks: true },
    scheduledTasks: { "0 3 * * *": ["newsletter:purge"] },
  },

  // @nuxtjs/seo : robots/sitemap/canonical/OG. Site renseigné via env au build.
  site: { url: process.env.BASE_URL, name: "L'Encre Humaine" },

  typescript: { strict: true },
});
