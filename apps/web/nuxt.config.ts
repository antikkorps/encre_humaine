import tailwindcss from "@tailwindcss/vite";

// docs/00-global.md (SEO/perf/a11y) + docs/06 (sécurité) + docs/07 (env).
// FR uniquement, SSG/ISR par défaut, hydratation minimale.
export default defineNuxtConfig({
  compatibilityDate: "2025-05-01",
  future: { compatibilityVersion: 4 },

  // reka-ui/nuxt : auto-import des primitives headless (Dialog, Accordion…) —
  // docs/00-global.md §Composants (NavMobile, FaqAccordion). a11y native.
  // nuxt-security : CSP stricte à nonce + en-têtes sécurité (docs/06 §6) — owne
  // les en-têtes du site public (Caddy ne les pose plus que pour cms./stats.).
  modules: ["@nuxt/image", "@nuxt/fonts", "@nuxtjs/seo", "reka-ui/nuxt", "nuxt-security"],

  // Sécurité — docs/06-security.md §6/§7. CSP **à nonce** (script-src sans
  // 'unsafe-inline') : Nuxt émet un <script> inline de config qui DOIT porter le
  // nonce — sinon l'app casse sous CSP stricte. Les styles gardent 'unsafe-inline'
  // (Nuxt inline les styles SSR + attributs style= non nonçables). Allow-list
  // alignée sur les tiers : Stripe / Cal.com / Turnstile / Umami / R2 / Directus.
  security: {
    nonce: true,
    // Middlewares mutateurs DÉSACTIVÉS : ils liraient/altéreraient le body et
    // casseraient des chemins testés (webhook Stripe = body BRUT signé ; contact
    // accepte des caractères spéciaux). Rate-limit & anti-bot = déjà maison.
    rateLimiter: false,
    xssValidator: false,
    requestSizeLimiter: false,
    corsHandler: false,
    headers: {
      contentSecurityPolicy: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'nonce-{{nonce}}'",
          "https://js.stripe.com",
          "https://challenges.cloudflare.com",
          "https://app.cal.com",
          "https://stats.encrehumaine.fr",
        ],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://cms.encrehumaine.fr",
          "https://*.r2.cloudflarestorage.com",
          "https://*.stripe.com",
          "https://app.cal.com",
        ],
        "font-src": ["'self'", "data:"],
        "connect-src": [
          "'self'",
          "https://api.stripe.com",
          "https://cms.encrehumaine.fr",
          "https://stats.encrehumaine.fr",
          "https://challenges.cloudflare.com",
          "https://app.cal.com",
        ],
        "frame-src": [
          "https://js.stripe.com",
          "https://checkout.stripe.com",
          "https://challenges.cloudflare.com",
          "https://cal.com",
          "https://app.cal.com",
        ],
        "frame-ancestors": ["'self'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'", "https://checkout.stripe.com"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": true,
      },
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true, preload: true },
      referrerPolicy: "strict-origin-when-cross-origin",
      xContentTypeOptions: "nosniff",
      xFrameOptions: "SAMEORIGIN",
      crossOriginOpenerPolicy: "same-origin",
      // COEP désactivé : 'require-corp'/'credentialless' casserait les iframes
      // tierces (Cal.com, Stripe) qui n'envoient pas les en-têtes CORP attendus.
      crossOriginEmbedderPolicy: false,
      permissionsPolicy: { geolocation: [], microphone: [], camera: [] },
    },
  },

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
      bookingUrl: process.env.BOOKING_URL ?? "",
      // Analytics auto-hébergé (Umami, cookieless) — agnostique du provider,
      // optionnel (vide → aucun script injecté, cf. plugins/analytics.client.ts).
      analyticsScriptUrl: process.env.ANALYTICS_SCRIPT_URL ?? "",
      analyticsWebsiteId: process.env.ANALYTICS_WEBSITE_ID ?? "",
      vatEnabled: process.env.VAT_ENABLED === "true",
    },
  },

  // Nitro : tâches planifiées (purges RGPD newsletter + contact). Quotidien 03h.
  nitro: {
    experimental: { tasks: true },
    scheduledTasks: { "0 3 * * *": ["newsletter:purge", "contact:purge"] },
  },

  // @nuxtjs/seo : robots/sitemap/canonical/OG. `site.url` est lu au BUILD ; en
  // prod (build Docker sans .env) il est vide → l'URL réelle est injectée au
  // RUNTIME via `NUXT_PUBLIC_SITE_URL` (mappé depuis BASE_URL dans le compose).
  site: { url: process.env.BASE_URL, name: "L'Encre Humaine" },

  // Sitemap : routes statiques auto-découvertes + source dynamique pour les
  // pages CMS (articles, offres, produits) — sinon absentes du sitemap.
  sitemap: { sources: ["/api/__sitemap__/urls"] },

  // Identité schema.org globale (Organization + WebSite + WebPage auto-injectés
  // sur chaque page). Person (Eléonore) ajoutée sur /a-propos.
  schemaOrg: {
    identity: {
      type: "Organization",
      name: "L'Encre Humaine",
      sameAs: ["https://www.linkedin.com/in/eleonore-moree"],
    },
  },

  // @nuxt/image : provider Directus custom (transformations côté Directus, pas
  // d'IPX/sharp dans le runtime slim). cf. providers/directus.ts.
  image: {
    provider: "directus",
    providers: {
      directus: { name: "directus", provider: "~/providers/directus.ts" },
    },
  },

  typescript: { strict: true },
});
