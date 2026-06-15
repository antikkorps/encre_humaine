import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, type Database, eq, lt, newsletterSubscribers } from "@encre/db";

/**
 * Primitives du double opt-in newsletter — docs/03-api-contracts.md §3.
 * Le token en clair n'est JAMAIS stocké : seul son hash SHA-256 l'est ; la
 * comparaison se fait à temps constant (docs/03 §5.6). Sans globals Nitro →
 * testable hors runtime.
 */

/** Durée de validité d'un lien de confirmation (purge des `pending` au-delà). */
export const CONFIRMATION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Hash hex SHA-256 d'un token (forme stockée en base). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Génère un token opaque (32 octets, base64url) + son hash de stockage. */
export function generateConfirmationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

/** Compare un token en clair au hash stocké, à temps constant. */
export function tokenMatchesHash(token: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const candidate = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/**
 * Purge RGPD des inscriptions non confirmées expirées — docs/03 §3.4.
 * Pour chaque `pending` dont `expires_at < now` : supprime le contact Resend
 * (best-effort via `removeContact`) puis la ligne DB. La preuve de consentement
 * des `confirmed` est conservée (docs/01 §8). Renvoie le nombre purgé.
 * `removeContact` est injecté → fonction testable hors runtime Resend.
 */
export async function purgeExpiredPending(
  db: Database,
  removeContact: (email: string) => Promise<void>,
  now: Date = new Date(),
): Promise<number> {
  const expired = await db
    .select()
    .from(newsletterSubscribers)
    .where(
      and(eq(newsletterSubscribers.status, "pending"), lt(newsletterSubscribers.expiresAt, now)),
    );

  for (const sub of expired) {
    if (sub.resendContactId) {
      try {
        await removeContact(sub.email);
      } catch (err) {
        console.error(`[newsletter:purge] suppression contact Resend ${sub.email} échouée :`, err);
      }
    }
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, sub.id));
  }

  return expired.length;
}
