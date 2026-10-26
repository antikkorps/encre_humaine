import type { DiagnosticKind, DiagnosticPromo } from "~/types/content";

/**
 * Invitation au diagnostic d'un public (bas des offres, hubs). Une erreur laisse
 * `promo` vide : l'encart disparaît, la page reste servie.
 */
export function useDiagnosticPromo(kind: MaybeRefOrGetter<DiagnosticKind>) {
  const { data } = useFetch<DiagnosticPromo>(
    () => `/api/content/diagnostic/${toValue(kind)}/promo`,
    { query: usePreviewQuery() },
  );
  return data;
}
