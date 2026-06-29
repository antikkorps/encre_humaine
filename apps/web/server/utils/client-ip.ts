import type { H3Event } from "h3";

/**
 * IP réelle du client derrière Caddy — docs/06-security.md §2.
 *
 * On NE fait confiance qu'à l'`X-Forwarded-For` posé par notre reverse proxy
 * (Caddy), seul hop de confiance : Caddy l'ÉCRASE avec l'IP cliente qu'il a
 * lui-même résolue (`trusted_proxies` + `client_ip` côté Caddyfile), de sorte
 * que la valeur n'est PAS forgeable par le client — même si l'origine est
 * joignable en direct. On ne lit donc PLUS `CF-Connecting-IP` ici : ce header
 * est client-contrôlable dès que l'origine est atteignable sans passer par
 * Cloudflare (audit sécu #1) ; c'est Caddy qui tranche l'IP cliente.
 *
 * L'IP sert uniquement en mémoire (rate-limit) — jamais persistée sur les leads
 * (docs/01 §6).
 */
export function getClientIp(event: H3Event): string {
  const xff = getHeader(event, "x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  // Pas de proxy (dev local `nuxi dev`) : adresse de socket directe.
  return event.node.req.socket.remoteAddress ?? "unknown";
}
