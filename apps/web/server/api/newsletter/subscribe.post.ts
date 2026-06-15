import { eq, newsletterSubscribers } from "@encre/db";
import { NewsletterSubscribeSchema } from "@encre/shared";
import * as v from "valibot";

/**
 * Inscription newsletter (double opt-in) — `POST /api/newsletter/subscribe`
 * (docs/03-api-contracts.md §3.1).
 * Flux : honeypot → validation → Turnstile → rate-limit → UPSERT `pending`
 * (token hashé + expiration) → contact Resend en UNSUBSCRIBED → email de
 * confirmation tokenisé. Un `confirmed` existant renvoie un 200 idempotent
 * sans nouveau mail. Le token en clair n'est jamais stocké (docs/03 §5.6).
 */
export default defineEventHandler(async (event) => {
  const raw = await readBody<Record<string, unknown>>(event);

  if (typeof raw?.website === "string" && raw.website.trim() !== "") {
    return { status: "pending" as const }; // honeypot → faux succès
  }

  const parsed = v.safeParse(NewsletterSubscribeSchema, raw);
  if (!parsed.success) {
    throwApiError("validation_error", "Inscription invalide.");
  }
  const payload = parsed.output;

  const ip = getClientIp(event);
  if (!(await verifyTurnstile(payload.turnstileToken, ip))) {
    throwApiError("turnstile_failed", "Vérification anti-robot échouée.");
  }
  enforceRateLimit(event, "newsletter", { limit: 5, windowMs: 60_000 });

  const db = serverDb();
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, payload.email))
    .limit(1);

  // Déjà confirmé : idempotent, aucun nouveau mail (docs/03 §3.1).
  if (existing?.status === "confirmed") {
    return { status: "already_subscribed" as const };
  }

  const { token, tokenHash } = generateConfirmationToken();
  const expiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);
  const firstName = payload.firstName ?? null;
  const userAgent = getHeader(event, "user-agent") ?? null;

  if (!existing) {
    await db.insert(newsletterSubscribers).values({
      email: payload.email,
      firstName,
      status: "pending",
      tokenHash,
      expiresAt,
      consentIp: ip, // preuve de consentement (légitime ici, docs/01 §7)
      consentUserAgent: userAgent,
    });
  } else {
    // pending (renvoi du mail) ou unsubscribed (ré-opt-in) → régénère + repousse.
    await db
      .update(newsletterSubscribers)
      .set({
        status: "pending",
        firstName,
        tokenHash,
        expiresAt,
        consentIp: ip,
        consentUserAgent: userAgent,
        requestedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, existing.id));
  }

  // Contact Resend en UNSUBSCRIBED : un pending ne reçoit aucun broadcast (best-effort).
  try {
    const contactId = await upsertNewsletterContact({
      email: payload.email,
      firstName: payload.firstName,
      unsubscribed: true,
    });
    if (contactId) {
      await db
        .update(newsletterSubscribers)
        .set({ resendContactId: contactId })
        .where(eq(newsletterSubscribers.email, payload.email));
    }
  } catch (err) {
    console.error(`[newsletter] sync contact Resend ${payload.email} échouée :`, err);
  }

  // Email de confirmation : essentiel au flow → un échec doit faire retenter.
  try {
    await sendNewsletterConfirmation({ email: payload.email, firstName, token });
  } catch (err) {
    console.error(`[newsletter] envoi confirmation ${payload.email} échoué :`, err);
    throwApiError("internal_error", "Envoi de l'email de confirmation impossible.");
  }

  return { status: "pending" as const };
});
