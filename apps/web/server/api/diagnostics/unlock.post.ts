import { randomBytes } from "node:crypto";
import { diagnostics } from "@encre/db";
import { type DiagnosticUnlockPayload, DiagnosticUnlockSchema } from "@encre/shared";
import type { H3Event } from "h3";
import * as v from "valibot";
import type { DiagnosticContent } from "~/types/content";

/**
 * Déblocage du rapport d'un diagnostic — `POST /api/diagnostics/unlock`
 * (docs/11-diagnostics.md). Flux : honeypot → validation → Turnstile →
 * rate-limit → recalcul serveur (le client n'est jamais cru) → INSERT (sans la
 * réponse sensible, sans IP) → email du rapport et newsletter en best-effort.
 * Renvoie le jeton du lien de rapport ; seule son empreinte est stockée.
 */
export default defineEventHandler(async (event) => {
  const raw = await readBody<Record<string, unknown>>(event);
  // Honeypot : faux succès, comme la newsletter (un bot n'apprend pas qu'il est repéré).
  if (typeof raw?.website === "string" && raw.website.trim() !== "") {
    return { token: randomBytes(32).toString("base64url") };
  }
  const payload = await guard(event, raw);
  const prepared = prepare(payload);
  const content = await loadDiagnosticContent(payload.kind);
  const db = serverDb();
  // Lu AVANT l'insertion : sinon la ligne qu'on écrit compterait comme « récente ».
  const alreadySent = await recentReportExists(db, payload.email, payload.kind);
  const token = await persist(event, payload, prepared, content);

  // Même adresse servie il y a moins de 10 min : aucun nouvel email (rapport ni newsletter).
  if (!alreadySent) {
    await sendReportBestEffort(payload, token, prepared, content);
    if (payload.consentNewsletter) await newsletterBestEffort(event, payload.email);
  }
  return { token };
});

/** Validation, anti-robot, limite de débit. */
async function guard(event: H3Event, raw: unknown): Promise<DiagnosticUnlockPayload> {
  const parsed = v.safeParse(DiagnosticUnlockSchema, raw);
  if (!parsed.success) throwApiError("validation_error", "Formulaire invalide.");
  if (!(await verifyTurnstile(parsed.output.turnstileToken, getClientIp(event)))) {
    throwApiError("turnstile_failed", "Vérification anti-robot échouée.");
  }
  enforceRateLimit(event, "diagnostic", { limit: 5, windowMs: 60_000 });
  return parsed.output;
}

function prepare(payload: DiagnosticUnlockPayload): PreparedDiagnostic {
  try {
    return prepareDiagnostic(payload.kind, payload.answers);
  } catch {
    return throwApiError("validation_error", "Questionnaire incomplet.");
  }
}

/** Enregistre le diagnostic ; renvoie le jeton en clair (jamais stocké). */
async function persist(
  event: H3Event,
  payload: DiagnosticUnlockPayload,
  prepared: PreparedDiagnostic,
  content: DiagnosticContent,
): Promise<string> {
  const { token, tokenHash } = generateConfirmationToken();
  await serverDb()
    .insert(diagnostics)
    .values({
      kind: payload.kind,
      email: payload.email,
      consentReport: true,
      consentNewsletter: payload.consentNewsletter,
      consentTextVersion: consentVersion(content.texts.unlock.consent),
      answers: prepared.answers,
      result: prepared.result as unknown as Record<string, unknown>,
      source: payload.source ?? null,
      device: deviceFromUserAgent(getHeader(event, "user-agent")),
      reportTokenHash: tokenHash,
    });
  return token;
}

/** L'email est un plus : le rapport est déjà enregistré et affiché à l'écran. */
async function sendReportBestEffort(
  payload: DiagnosticUnlockPayload,
  token: string,
  prepared: PreparedDiagnostic,
  content: DiagnosticContent,
): Promise<void> {
  try {
    const reportUrl = new URL(`/diagnostic/rapport/${token}`, useRuntimeConfig().public.baseUrl);
    const mail = renderDiagnosticEmail({
      kind: payload.kind,
      texts: content.texts,
      answers: prepared.answers,
      result: prepared.result,
      reportUrl: reportUrl.toString(),
      bookingUrl: content.bookingUrl,
      email: payload.email,
    });
    await sendDiagnosticReport({ to: payload.email, ...mail });
  } catch (err) {
    console.error("[diagnostic] envoi du rapport échoué :", err);
  }
}

/** Case newsletter cochée → double opt-in existant, jamais d'inscription directe. */
async function newsletterBestEffort(event: H3Event, email: string): Promise<void> {
  try {
    await requestNewsletterOptIn({
      email,
      ip: getClientIp(event),
      userAgent: getHeader(event, "user-agent") ?? null,
    });
  } catch (err) {
    console.error("[diagnostic] demande newsletter échouée :", err);
  }
}
