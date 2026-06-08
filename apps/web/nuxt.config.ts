import tailwindcss from "@tailwindcss/vite";

// docs/00-global.md (SEO/perf/a11y) + docs/06 (sécurité) + docs/07 (env).
// FR uniquement, SSG/ISR par défaut, hydratation minimale.
export default defineNuxtConfig({
  compatibilityDate: "2025-05-01",
  future: { compatibilityVersion: 4 },

  modules: ["@nuxt/image", "@nuxt/fonts", "@nuxtjs/seo"],

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
  runtimeConfig: {
    appDatabaseUrl: "",
    directusReadToken: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    stripeShippingRateFr: "",
    resendApiKey: "",
    resendAudienceId: "",
    newsletterFrom: "",
    contactNotifyTo: "",
    turnstileSecretKey: "",
    public: {
      baseUrl: process.env.BASE_URL ?? "",
      directusPublicUrl: process.env.DIRECTUS_PUBLIC_URL ?? "",
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ?? "",
      calendlyUrl: process.env.CALENDLY_URL ?? "",
      vatEnabled: process.env.VAT_ENABLED === "true",
    },
  },

  // @nuxtjs/seo : robots/sitemap/canonical/OG. Site renseigné via env au build.
  site: { url: process.env.BASE_URL, name: "L'Encre Humaine" },

  typescript: { strict: true },
});
