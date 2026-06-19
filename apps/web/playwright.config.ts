import { defineConfig } from "@playwright/test";

/**
 * Amorce Playwright — docs/07-deploy.md (parcours critiques).
 * Phase 0 : un seul smoke sur `/api/health` (l'app boote, l'env est validé).
 * Les vrais parcours (accueil, boutique, contact, newsletter) arriveront avec
 * les pages en Phase 1.
 *
 * `webServer` lance le serveur de dev avec un env SYNTHÉTIQUE mais valide : il
 * sert uniquement à passer la validation d'env au boot (docs/06 §5). Aucun
 * service tiers n'est contacté par /api/health → exécutable en CI sans secret.
 */
const PORT = 3030;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const bootEnv: Record<string, string> = {
  BASE_URL,
  APP_DATABASE_URL: "postgresql://app_user:test@127.0.0.1:5432/encre?search_path=app",
  DIRECTUS_PUBLIC_URL: "http://127.0.0.1:8055",
  DIRECTUS_READ_TOKEN: "test-read-token",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_dummy",
  STRIPE_SHIPPING_RATE_FR: "shr_dummy",
  VAT_ENABLED: "false",
  RESEND_API_KEY: "re_dummy",
  RESEND_AUDIENCE_ID: "aud_dummy",
  NEWSLETTER_FROM: "newsletter@example.com",
  CONTACT_NOTIFY_TO: "contact@example.com",
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  BOOKING_URL: "https://cal.com/encre-humaine/rdv",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: BASE_URL },
  webServer: {
    command: `nuxi dev --port ${PORT}`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ...bootEnv, PORT: String(PORT), NUXT_PORT: String(PORT) },
  },
});
