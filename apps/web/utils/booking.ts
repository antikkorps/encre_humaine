/**
 * Prise de RDV — helpers agnostiques du provider. Le reste de l'app ne manipule
 * qu'une URL de réservation ; seul `BookingEmbed` connaît le provider (Cal.com).
 * `parseBookingUrl` décompose l'URL en `origin` (init de l'embed, supporte le
 * self-hosting) + `calLink` (chemin `compte/évènement`).
 */
export interface BookingTarget {
  origin: string;
  calLink: string;
  /** URL du script d'embed à charger (dépend de l'instance Cal.com). */
  embedSrc: string;
}

/** Décompose une URL de réservation, ou `null` si invalide. */
export function parseBookingUrl(raw: string | null | undefined): BookingTarget | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const calLink = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!calLink) return null;
    // Cal.com cloud sert l'embed depuis `app.<domaine>` (cal.com → app.cal.com,
    // cal.eu → app.cal.eu, instance UE/RGPD). Le self-hosting sert tout depuis le
    // même origin → on ne préfixe `app.` que pour les domaines cloud connus.
    const isCalCloud = u.host === "cal.com" || u.host === "cal.eu";
    const embedOrigin = isCalCloud ? `https://app.${u.host}` : u.origin;
    return { origin: u.origin, calLink, embedSrc: `${embedOrigin}/embed/embed.js` };
  } catch {
    return null;
  }
}
