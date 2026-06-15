import { eq, newsletterSubscribers } from "@encre/db";
import { NewsletterConfirmSchema } from "@encre/shared";
import type { H3Event } from "h3";
import * as v from "valibot";

/**
 * Confirmation double opt-in — `GET /api/newsletter/confirm?token&email`
 * (docs/03-api-contracts.md §3.2). Valide le token (comparaison à temps constant,
 * expiration) puis redirige (302) vers la page d'état `/newsletter/confirmation`.
 * Aucune écriture sur token invalide/expiré.
 */
type ConfirmStatus = "success" | "expired" | "invalid" | "already";

function redirectToPage(event: H3Event, status: ConfirmStatus) {
  const { baseUrl } = useRuntimeConfig().public;
  const url = new URL("/newsletter/confirmation", baseUrl);
  url.searchParams.set("status", status);
  return sendRedirect(event, url.toString(), 302);
}

export default defineEventHandler(async (event) => {
  const parsed = v.safeParse(NewsletterConfirmSchema, getQuery(event));
  if (!parsed.success) return redirectToPage(event, "invalid");
  const { token, email } = parsed.output;

  const db = serverDb();
  const [sub] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (!sub) return redirectToPage(event, "invalid");
  if (sub.status === "confirmed") return redirectToPage(event, "already");
  if (!sub.expiresAt || sub.expiresAt.getTime() < Date.now()) {
    return redirectToPage(event, "expired");
  }
  if (!tokenMatchesHash(token, sub.tokenHash)) return redirectToPage(event, "invalid");

  // Confirmé : on efface le token (preuve de consentement conservée par ailleurs).
  await db
    .update(newsletterSubscribers)
    .set({ status: "confirmed", confirmedAt: new Date(), tokenHash: null, expiresAt: null })
    .where(eq(newsletterSubscribers.id, sub.id));

  // Passe le contact Resend en SUBSCRIBED (best-effort).
  try {
    await upsertNewsletterContact({
      email,
      firstName: sub.firstName ?? undefined,
      unsubscribed: false,
    });
  } catch (err) {
    console.error(`[newsletter] passage SUBSCRIBED ${email} échoué :`, err);
  }

  return redirectToPage(event, "success");
});
