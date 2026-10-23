/**
 * Événements de mesure (Umami, sans cookie — docs/06 §7). Nommage agnostique du
 * provider, comme `utils/analytics.ts`. Sans script Umami (dev, bloqueur), l'appel
 * ne fait rien : la mesure ne doit jamais gêner le parcours.
 */
declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void };
  }
}

export function useTrack() {
  return (event: string, data?: Record<string, string | number>) => {
    if (import.meta.client) window.umami?.track(event, data);
  };
}
