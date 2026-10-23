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

  // Déjà confirmé : idempotent, aucun nouveau mail (docs/03 §3.1). Réponse
  // VOLONTAIREMENT identique au cas nominal (`pending`) pour ne pas révéler
  // qu'un email est déjà inscrit (anti-énumération).
  try {
    await requestNewsletterOptIn({
      email: payload.email,
      firstName: payload.firstName,
      ip,
      userAgent: getHeader(event, "user-agent") ?? null,
    });
  } catch (err) {
    // Email de confirmation : essentiel au flow → un échec doit faire retenter.
    console.error(`[newsletter] demande d'inscription ${payload.email} échouée :`, err);
    throwApiError("internal_error", "Envoi de l'email de confirmation impossible.");
  }

  return { status: "pending" as const };
});
