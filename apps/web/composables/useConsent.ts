/**
 * Consentement maison (gate des embeds tiers) — docs/06-security.md §7.
 * Deux catégories : *nécessaire* (toujours) / *optionnel* (embed RDV, Stripe embeds…).
 * Umami est cookieless → exempté, ne dépend pas de ce consentement.
 *
 * Stocké dans un cookie strictement nécessaire (pas de tracking), lisible au SSR
 * pour éviter le flash du bandeau. `useCookie` est auto-importé par Nuxt.
 *
 * Le bandeau reste *rappelable* après un premier choix (bouton flottant en bas à
 * gauche) : `reopened` (état éphémère, non persisté) force son réaffichage sans
 * réécrire le cookie tant que l'utilisateur n'a pas re-tranché.
 */
export interface ConsentState {
  /** L'utilisateur a accepté le chargement des contenus tiers / optionnels. */
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

  // Réouverture manuelle du bandeau (éphémère, partagée entre le widget flottant
  // et le bandeau via useState). Non persistée : un rechargement la remet à false.
  const reopened = useState<boolean>("eh_consent_reopened", () => false);

  const thirdParty = computed(() => state.value.thirdParty);
  const decided = computed(() => state.value.decided);
  /** Le bandeau est visible tant qu'aucun choix n'a été fait, ou s'il est rappelé. */
  const visible = computed(() => !state.value.decided || reopened.value);

  /** Accepte les contenus optionnels (clôt le bandeau). */
  function acceptThirdParty() {
    state.value = { thirdParty: true, decided: true };
    reopened.value = false;
  }

  /** Refuse les contenus optionnels tout en clôturant le bandeau. */
  function refuseThirdParty() {
    state.value = { thirdParty: false, decided: true };
    reopened.value = false;
  }

  /** Enregistre un choix fin depuis le panneau de réglages. */
  function savePreferences(allowThirdParty: boolean) {
    state.value = { thirdParty: allowThirdParty, decided: true };
    reopened.value = false;
  }

  /** Rappelle le bandeau (widget flottant « Je règle les tentacules »). */
  function openPreferences() {
    reopened.value = true;
  }

  return {
    thirdParty,
    decided,
    visible,
    acceptThirdParty,
    refuseThirdParty,
    savePreferences,
    openPreferences,
  };
}
