import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { config as loadEnv } from "dotenv";

// Env en DEV LOCAL uniquement (docs/07 §5) : une seule source canonique
// `infra/env/.env` (socle partagé : Resend, Stripe, Directus token…) + une fine
// surcouche poste `apps/web/.env.local` (les ~quelques valeurs qui DOIVENT
// différer sur l'hôte : localhost, ports exposés, clés Turnstile de test, etc.)
// qui PRIME. → un seul fichier à maintenir, zéro duplication des secrets.
// En prod, rien de tout ça : le conteneur reçoit ses NUXT_* via le compose.
if (process.env.NODE_ENV !== "production") {
  const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
  loadEnv({ path: here("../../infra/env/.env") }); // socle (ne réécrit rien d'existant)
  loadEnv({ path: here(".env.local"), override: true }); // surcouche dev → prioritaire
}

// docs/00-global.md (SEO/perf/a11y) + docs/06 (sécurité) + docs/07 (env).
// FR uniquement, SSG/ISR par défaut, hydratation minimale.
export default defineNuxtConfig({
  compatibilityDate: "2025-05-01",
  future: { compatibilityVersion: 4 },

  // reka-ui/nuxt : auto-import des primitives headless (Dialog, Accordion…) —
  // docs/00-global.md §Composants (NavMobile, FaqAccordion). a11y native.
  // nuxt-security : CSP stricte à nonce + en-têtes sécurité (docs/06 §6) — owne
  // les en-têtes du site public (Caddy ne les pose plus que pour cms./stats.).
  modules: [
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@nuxtjs/seo",
    "reka-ui/nuxt",
    "nuxt-security",
  ],

  // @nuxt/icon : on **n'embarque QUE les icônes réellement utilisées** (clientBundle
  // explicite) au lieu de toute la collection material-symbols (~10k icônes) — sinon
  // le build Nitro sature la mémoire (OOM sur le runner CI ~2 Go). Ces icônes sont
  // inline (SSR + client), zéro appel à api.iconify.design (`serverBundle:false` +
  // `fallbackToApi:false`) → CSP-safe. ⚠️ Ajouter ici toute NOUVELLE clé d'icône
  // rendue (sinon elle n'apparaît pas). Source : `@iconify-json/material-symbols`.
  icon: {
    mode: "svg",
    serverBundle: false,
    fallbackToApi: false,
    clientBundle: {
      sizeLimitKb: 512,
      icons: [
        "material-symbols:arrow-forward",
        "material-symbols:cancel",
        "material-symbols:check-circle",
        "material-symbols:check-circle-rounded",
        "material-symbols:event",
        "material-symbols:format-quote",
        "material-symbols:payments",
        "material-symbols:lightbulb",
        "material-symbols:insights",
        "material-symbols:analytics",
        "material-symbols:description",
        "material-symbols:difference",
        "material-symbols:flag",
        "material-symbols:format-list-numbered",
        "material-symbols:forum",
        "material-symbols:group",
        "material-symbols:layers",
        "material-symbols:record-voice-over",
        "material-symbols:route",
        "material-symbols:schedule",
        "material-symbols:settings",
        "material-symbols:trending-up",
        "material-symbols:visibility",
      ],
    },
  },

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
          "https://app.cal.eu",
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
          "https://app.cal.eu",
        ],
        "font-src": ["'self'", "data:"],
        "connect-src": [
          "'self'",
          "https://api.stripe.com",
          "https://cms.encrehumaine.fr",
          "https://stats.encrehumaine.fr",
          "https://challenges.cloudflare.com",
          "https://app.cal.com",
          "https://app.cal.eu",
        ],
        "frame-src": [
          "https://js.stripe.com",
          "https://checkout.stripe.com",
          "https://challenges.cloudflare.com",
          "https://cal.com",
          "https://cal.eu",
          "https://app.cal.com",
          "https://app.cal.eu",
        ],
        // 'self' + admin Directus : autorise le Live Preview (iframe cms. → site).
        // Toute autre origine reste bloquée (protection clickjacking préservée).
        "frame-ancestors": ["'self'", "https://cms.encrehumaine.fr"],
        "base-uri": ["'self'"],
        "form-action": ["'self'", "https://checkout.stripe.com"],
        "object-src": ["'none'"],
        "upgrade-insecure-requests": true,
      },
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true, preload: true },
      referrerPolicy: "strict-origin-when-cross-origin",
      xContentTypeOptions: "nosniff",
      // Désactivé au profit de `frame-ancestors` (CSP) : X-Frame-Options ne sait
      // pas autoriser une origine tierce précise (cms.) et bloquerait le Live
      // Preview. Le contrôle d'embed est porté par frame-ancestors ci-dessus.
      xFrameOptions: false,
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
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#f5f2eb" },
      ],
      // Favicons générés depuis OctopusMark (public/, cf. assets). SVG scalable
      // d'abord, .ico en repli legacy, apple-touch + manifest pour iOS/PWA.
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
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

  // Redirections. La landing d'inscription `/newsletter` a fusionné dans la section
  // newsletter de `/ressources` (« Les Tentacules ») → 301. `/newsletter/confirmation`
  // (page inerte du double opt-in) reste une route à part (non redirigée).
  routeRules: {
    "/newsletter": { redirect: { to: "/ressources", statusCode: 301 } },
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
