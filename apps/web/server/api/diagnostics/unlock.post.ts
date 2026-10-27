import { randomBytes } from "node:crypto";
import { diagnostics } from "@encre/db";
import { type DiagnosticUnlockPayload, DiagnosticUnlockSchema } from "@encre/shared";
import type { H3Event } from "h3";
import * as v from "valibot";
import type { DiagnosticContent } from "~/types/content";
// Import EXPLICITE (pas d'auto-import `utils/` côté Nitro).
import { diagnosticSummary } from "~/utils/diagnostic-summary";

/**
 * Déblocage du rapport d'un diagnostic — `POST /api/diagnostics/unlock`
 * (docs/11-diagnostics.md). Flux : honeypot → validation → Turnstile →
 * rate-limit → recalcul serveur (le client n'est jamais cru) → INSERT (sans la
 * réponse sensible, sans IP) → email du rapport, copie à Éléonore et newsletter
 * en best-effort.
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
  const summary = summarizeOrNull(payload, prepared, content);
  const token = await persist(event, payload, prepared, content, summary);
  const reportUrl = new URL(`/diagnostic/rapport/${token}`, useRuntimeConfig().public.baseUrl);

  // Même adresse servie il y a moins de 10 min : aucun nouvel email (rapport,
  // copie ni newsletter) — la boîte d'Éléonore ne doit pas pouvoir être inondée.
  if (!alreadySent) {
    await sendReportBestEffort(payload, reportUrl.toString(), prepared, content);
    if (summary) await sendOwnerCopyBestEffort(payload, reportUrl.toString(), summary);
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

/**
 * Le résumé lisible n'est qu'un confort pour Éléonore : s'il échoue, le
 * diagnostic s'enregistre quand même et la tâche nocturne le complétera.
 */
function summarizeOrNull(
  payload: DiagnosticUnlockPayload,
  prepared: PreparedDiagnostic,
  content: DiagnosticContent,
): string | null {
  try {
    return diagnosticSummary(payload.kind, content.texts, prepared.answers, prepared.result);
  } catch (err) {
    console.error("[diagnostic] résumé lisible impossible :", err);
    return null;
  }
}

/** Enregistre le diagnostic ; renvoie le jeton en clair (jamais stocké). */
async function persist(
  event: H3Event,
  payload: DiagnosticUnlockPayload,
  prepared: PreparedDiagnostic,
  content: DiagnosticContent,
  summary: string | null,
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
      summary,
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
  reportUrl: string,
  prepared: PreparedDiagnostic,
  content: DiagnosticContent,
): Promise<void> {
  try {
    const mail = renderDiagnosticEmail({
      kind: payload.kind,
      texts: content.texts,
      answers: prepared.answers,
      result: prepared.result,
      reportUrl,
      bookingUrl: content.bookingUrl,
      email: payload.email,
    });
    await sendDiagnosticReport({ to: payload.email, ...mail });
  } catch (err) {
    console.error("[diagnostic] envoi du rapport échoué :", err);
  }
}

/** Copie lisible pour Éléonore ; un échec ne touche pas la personne (tout est en base). */
async function sendOwnerCopyBestEffort(
  payload: DiagnosticUnlockPayload,
  reportUrl: string,
  summary: string,
): Promise<void> {
  try {
    const mail = renderDiagnosticOwnerEmail({
      kind: payload.kind,
      email: payload.email,
      summary,
      reportUrl,
      source: payload.source ?? null,
      consentNewsletter: payload.consentNewsletter,
    });
    await sendDiagnosticOwnerCopy({ replyTo: payload.email, ...mail });
  } catch (err) {
    console.error("[diagnostic] copie à Éléonore échouée :", err);
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
