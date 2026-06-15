import type { H3Event } from "h3";

/**
 * IP réelle du client derrière Caddy/Cloudflare — docs/06-security.md §2.
 * Priorité à `CF-Connecting-IP` (posée par Cloudflare), puis premier hop de
 * `X-Forwarded-For`, enfin l'adresse de socket. Ne jamais rate-limiter sur
 * l'IP du proxy. L'IP sert uniquement en mémoire (rate-limit) — jamais persistée
 * sur les leads (docs/01 §6).
 */
export function getClientIp(event: H3Event): string {
  const cf = getHeader(event, "cf-connecting-ip");
  if (cf) return cf.trim();

  const xff = getHeader(event, "x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  return event.node.req.socket.remoteAddress ?? "unknown";
}
