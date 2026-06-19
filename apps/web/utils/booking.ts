/**
 * Prise de RDV — helpers agnostiques du provider. Le reste de l'app ne manipule
 * qu'une URL de réservation ; seul `BookingEmbed` connaît le provider (Cal.com).
 * `parseBookingUrl` décompose l'URL en `origin` (init de l'embed, supporte le
 * self-hosting) + `calLink` (chemin `compte/évènement`).
 */
export interface BookingTarget {
  origin: string;
  calLink: string;
}

/** Décompose une URL de réservation, ou `null` si invalide. */
export function parseBookingUrl(raw: string | null | undefined): BookingTarget | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const calLink = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!calLink) return null;
    return { origin: u.origin, calLink };
  } catch {
    return null;
  }
}
