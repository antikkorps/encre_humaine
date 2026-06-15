import { contactLeads, eq } from "@encre/db";
import { ContactPayloadSchema } from "@encre/shared";
import * as v from "valibot";

/**
 * Contact — `POST /api/contact` (docs/03-api-contracts.md §2).
 * Flux : honeypot → validation valibot (partagée) → Turnstile serveur →
 * rate-limit IP → INSERT lead → email best-effort à Eléonore.
 * Aucune IP persistée (docs/01 §6) ; l'IP ne sert qu'au rate-limit en mémoire.
 */
export default defineEventHandler(async (event) => {
  const raw = await readBody<Record<string, unknown>>(event);

  // Honeypot : un bot remplit `website`. On simule un succès (ne pas renseigner).
  if (typeof raw?.website === "string" && raw.website.trim() !== "") {
    return { ok: true };
  }

  const parsed = v.safeParse(ContactPayloadSchema, raw);
  if (!parsed.success) {
    throwApiError("validation_error", "Formulaire invalide.");
  }
  const payload = parsed.output;

  const ip = getClientIp(event);
  if (!(await verifyTurnstile(payload.turnstileToken, ip))) {
    throwApiError("turnstile_failed", "Vérification anti-robot échouée.");
  }

  // 5 req/min/IP (docs/06 §2).
  enforceRateLimit(event, "contact", { limit: 5, windowMs: 60_000 });

  const db = serverDb();
  const [lead] = await db
    .insert(contactLeads)
    .values({
      firstName: payload.firstName,
      email: payload.email,
      audience: payload.audience,
      message: payload.message,
      sourcePage: payload.sourcePage ?? null,
    })
    .returning();

  // Email best-effort : un échec d'envoi ne doit pas perdre le lead (déjà persisté).
  if (lead) {
    try {
      await sendContactNotification(lead);
      await db
        .update(contactLeads)
        .set({ notificationSent: true })
        .where(eq(contactLeads.id, lead.id));
    } catch (err) {
      console.error(`[contact] notification lead ${lead.id} échouée :`, err);
    }
  }

  return { ok: true };
});
