// Injection du script analytics auto-hébergé (Umami, cookieless) — docs/06 §7.
// Cookieless → chargé SANS consentement (≠ embeds tiers Cal.com/Stripe qui, eux,
// passent par `useConsent`). `.client` : jamais au SSR. Non configuré (dev,
// preview, website id absent) → aucun script injecté (cf. `analyticsScript`).
export default defineNuxtPlugin(() => {
  const { analyticsScriptUrl, analyticsWebsiteId } = useRuntimeConfig().public;
  const script = analyticsScript(analyticsScriptUrl, analyticsWebsiteId);
  if (!script) return;
  useHead({ script: [script] });
});
