/**
 * Consentement maison (gate des embeds tiers) — docs/06-security.md §7.
 * Deux catégories : *nécessaire* (toujours) / *tiers* (embed RDV, Stripe embeds…).
 * Umami est cookieless → exempté, ne dépend pas de ce consentement.
 *
 * Stocké dans un cookie strictement nécessaire (pas de tracking), lisible au SSR
 * pour éviter le flash du bandeau. `useCookie` est auto-importé par Nuxt.
 */
export interface ConsentState {
  /** L'utilisateur a accepté le chargement des contenus tiers. */
  thirdParty: boolean;
  /** Un choix explicite a été fait (sinon : afficher le bandeau). */
  decided: boolean;
}

const COOKIE_NAME = "eh_consent";
const SIX_MONTHS = 60 * 60 * 24 * 180;

export function useConsent() {
  const state = useCookie<ConsentState>(COOKIE_NAME, {
    default: () => ({ thirdParty: false, decided: false }),
    maxAge: SIX_MONTHS,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  const thirdParty = computed(() => state.value.thirdParty);
  const decided = computed(() => state.value.decided);

  /** Accepte les contenus tiers (clôt le bandeau). */
  function acceptThirdParty() {
    state.value = { thirdParty: true, decided: true };
  }

  /** Refuse les contenus tiers tout en clôturant le bandeau. */
  function refuseThirdParty() {
    state.value = { thirdParty: false, decided: true };
  }

  return { thirdParty, decided, acceptThirdParty, refuseThirdParty };
}
