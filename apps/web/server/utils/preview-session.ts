import { createHash } from "node:crypto";
import type { H3Event } from "h3";

/**
 * Laissez-passer « prévisualisation » du mode page d'attente
 * (server/middleware/coming-soon.ts) : une session Directus valide ouvre l'accès
 * au vrai site (contenus réels) pendant que le public voit la page d'attente.
 * Permet à l'éditrice / l'admin de relire et corriger le rendu AVANT l'ouverture,
 * sans jamais rien exposer aux robots (qui n'ont pas de session).
 *
 * Le cookie de session Directus (`directus_session_token`) n'atteint
 * `encrehumaine.fr` que s'il est posé sur le domaine parent — réglage Directus
 * `SESSION_COOKIE_DOMAIN=.encrehumaine.fr` (cf. infra/docker-compose.yml).
 *
 * La validité est déléguée à Directus (`GET /users/me`) puis mise en cache
 * mémoire court (empreinte du token → expiration) : un éditeur navigue sans
 * marteler Directus, et le public — sans cookie — ne déclenche jamais d'appel.
 */

const SESSION_COOKIE = "directus_session_token";
const CACHE_TTL_MS = 5 * 60_000;

/** sha256(token) → expiration (epoch ms). On ne stocke jamais le token en clair. */
const cache = new Map<string, number>();

function fingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * `true` si la requête porte une session Directus valide (→ laissez-passer).
 * Tolérant aux pannes : si Directus est injoignable, renvoie `false` (la porte
 * reste fermée — on ne « fail-open » jamais vers le public).
 */
export async function hasValidDirectusSession(event: H3Event): Promise<boolean> {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return false;

  const fp = fingerprint(token);
  const now = Date.now();
  const expiresAt = cache.get(fp);
  if (expiresAt !== undefined) {
    if (expiresAt > now) return true;
    cache.delete(fp); // entrée expirée
  }

  const url = useRuntimeConfig(event).public.directusPublicUrl;
  if (!url) return false;

  try {
    const me = await $fetch<{ data?: { id?: string } }>(`${url}/users/me`, {
      query: { fields: "id" },
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      retry: 0,
      timeout: 3000,
    });
    if (!me?.data?.id) return false;
    cache.set(fp, now + CACHE_TTL_MS);
    return true;
  } catch {
    return false;
  }
}
