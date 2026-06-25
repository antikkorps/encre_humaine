import { defineVitestConfig } from "@nuxt/test-utils/config";

/**
 * Tests de composants Nuxt — environnement `nuxt` (@nuxt/test-utils) :
 * auto-imports, composables (useConsent/useTurnstile), reka-ui résolus comme
 * en runtime. DOM via happy-dom.
 *
 * Les tests unitaires/composants vivent dans `test/` ; les parcours Playwright
 * (`e2e/`) sont exclus — ils tournent via `pnpm test:e2e`.
 */
export default defineVitestConfig({
  test: {
    name: "web",
    include: ["test/**/*.spec.ts"],
    // Les suites PGlite (webhook Stripe, newsletter) ont un `beforeAll` lourd
    // (démarrage Postgres-wasm à froid) qui peut dépasser 10s en CI/WSL.
    hookTimeout: 60_000,
    environment: "nuxt",
    environmentOptions: {
      nuxt: { domEnvironment: "happy-dom" },
    },
  },
});
