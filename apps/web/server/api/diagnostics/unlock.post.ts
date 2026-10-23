import { diagnostics } from "@encre/db";
import { DiagnosticUnlockSchema } from "@encre/shared";
import * as v from "valibot";

/**
 * Déblocage du rapport d'un diagnostic — `POST /api/diagnostics/unlock`
 * (docs/11-diagnostics.md). Flux : honeypot → validation → Turnstile →
 * rate-limit → recalcul serveur (le client n'est jamais cru) → INSERT (sans la
 * réponse sensible, sans IP) → email du rapport et newsletter en best-effort.
 * Renvoie le jeton du lien de rapport ; seule son empreinte est stockée.
 */
export default defineEventHandler(async (event) => {
  const raw = await readBody<Record<string, unknown>>(event);
  if (typeof raw?.website === "string" && raw.website.trim() !== "") {
    throwApiError("validation_error", "Formulaire invalide."); // honeypot : pas de faux rapport
  }

  const parsed = v.safeParse(DiagnosticUnlockSchema, raw);
  if (!parsed.success) throwApiError("validation_error", "Formulaire invalide.");
  const payload = parsed.output;

  const ip = getClientIp(event);
  if (!(await verifyTurnstile(payload.turnstileToken, ip))) {
    throwApiError("turnstile_failed", "Vérification anti-robot échouée.");
  }
  enforceRateLimit(event, "diagnostic", { limit: 5, windowMs: 60_000 });

  let prepared: PreparedDiagnostic;
  try {
    prepared = prepareDiagnostic(payload.kind, payload.answers);
  } catch {
    throwApiError("validation_error", "Questionnaire incomplet.");
  }

  const content = await loadDiagnosticContent(payload.kind);
  const userAgent = getHeader(event, "user-agent");
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
      device: deviceFromUserAgent(userAgent),
      reportTokenHash: tokenHash,
    });

  await sendReportBestEffort(payload.kind, payload.email, token, prepared, content);
  if (payload.consentNewsletter) {
    await requestNewsletterOptIn({ email: payload.email, ip, userAgent: userAgent ?? null }).catch(
      (err) => console.error("[diagnostic] demande newsletter échouée :", err),
    );
  }
  return { token };
});

/** L'email est un plus : le rapport est déjà enregistré et affiché à l'écran. */
async function sendReportBestEffort(
  kind: "b2b" | "b2c",
  email: string,
  token: string,
  prepared: PreparedDiagnostic,
  content: Awaited<ReturnType<typeof loadDiagnosticContent>>,
): Promise<void> {
  try {
    const reportUrl = new URL(`/diagnostic/rapport/${token}`, useRuntimeConfig().public.baseUrl);
    const mail = renderDiagnosticEmail({
      kind,
      texts: content.texts,
      answers: prepared.answers,
      result: prepared.result,
      reportUrl: reportUrl.toString(),
      bookingUrl: content.bookingUrl,
      email,
    });
    await sendDiagnosticReport({ to: email, ...mail });
  } catch (err) {
    console.error("[diagnostic] envoi du rapport échoué :", err);
  }
}
