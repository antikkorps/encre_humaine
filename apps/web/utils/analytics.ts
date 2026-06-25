/**
 * Analytics auto-hébergé (Umami) — docs/06-security.md §7.
 * Nommage **agnostique du provider** (comme `booking_url`) : seul ce module
 * connaît la forme du tag ; le reste du code ne manipule qu'une URL + un id.
 * Umami est **cookieless** → EXEMPTÉ de consentement (pas de cross-site, IP
 * anonymisée). Le script suit les pages vues, navigation SPA comprise (il
 * s'accroche à l'API History) — aucun appel manuel à faire.
 */
export interface AnalyticsScript {
  src: string;
  defer: true;
  // Signature d'index `data-*` requise par le type `script` d'unhead/useHead.
  [key: `data-${string}`]: string;
}

/**
 * Descripteur de balise `<script>` analytics, ou `null` si non configuré
 * (dev, preview, ou website id pas encore créé dans le dashboard). Dans ce cas
 * aucun script n'est injecté → l'app fonctionne sans analytics.
 */
export function analyticsScript(
  scriptUrl: string | null | undefined,
  websiteId: string | null | undefined,
): AnalyticsScript | null {
  if (!scriptUrl || !websiteId) return null;
  return { src: scriptUrl, defer: true, "data-website-id": websiteId };
}
