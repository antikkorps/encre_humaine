import type { H3Event } from "h3";

/**
 * Rate-limiting par IP, fenêtre glissante, en mémoire — docs/06-security.md §2.
 * Suffisant pour un nœud unique (phase 1) ; à remplacer par un store partagé
 * si l'app passe multi-instances. Aucune IP n'est persistée (RGPD).
 */

export interface RateLimitOptions {
  /** Nombre max de requêtes autorisées dans la fenêtre. */
  limit: number;
  /** Largeur de la fenêtre glissante, en millisecondes. */
  windowMs: number;
}

/** clé (ex. `contact:1.2.3.4`) → timestamps des requêtes retenues. */
const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Délai conseillé avant retry (ms) quand bloqué, 0 sinon. */
  retryAfterMs: number;
}

/**
 * Cœur testable : enregistre un hit pour `key` et indique s'il est autorisé.
 * `now` est injectable pour les tests (pas d'horloge cachée).
 */
export function consumeRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit) {
    hits.set(key, recent);
    const retryAfterMs = recent[0] !== undefined ? recent[0] + windowMs - now : windowMs;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, retryAfterMs: 0 };
}

/** Vide le registre (tests uniquement). */
export function resetRateLimits(): void {
  hits.clear();
}

/**
 * Applique le rate-limit sur un endpoint Nitro : lève `429` (enveloppe uniforme)
 * et pose l'en-tête `Retry-After` si la limite est dépassée.
 */
export function enforceRateLimit(event: H3Event, scope: string, options: RateLimitOptions): void {
  const ip = getClientIp(event);
  const result = consumeRateLimit(`${scope}:${ip}`, options);
  if (!result.allowed) {
    setHeader(event, "Retry-After", Math.ceil(result.retryAfterMs / 1000));
    throwApiError("rate_limited", "Trop de requêtes. Réessayez dans un instant.");
  }
}
