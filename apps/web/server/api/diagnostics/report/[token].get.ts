import { diagnostics, eq } from "@encre/db";

/**
 * Rapport retrouvé par son lien — `GET /api/diagnostics/report/:token`
 * (docs/11-diagnostics.md). Le jeton n'est jamais stocké en clair : on cherche
 * son empreinte. Jeton inconnu (ou purgé) → 404, sans rien révéler de plus.
 * L'email n'est PAS renvoyé : le lien se transfère (dirigeant → DRH), l'adresse
 * de la personne n'a pas à suivre.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token") ?? "";
  enforceRateLimit(event, "diagnostic-report", { limit: 30, windowMs: 60_000 });
  if (!/^[\w-]{20,128}$/.test(token)) throw createError({ statusCode: 404 });

  const [row] = await serverDb()
    .select({
      kind: diagnostics.kind,
      answers: diagnostics.answers,
      result: diagnostics.result,
    })
    .from(diagnostics)
    .where(eq(diagnostics.reportTokenHash, hashToken(token)))
    .limit(1);
  if (!row) throw createError({ statusCode: 404, statusMessage: "Rapport introuvable" });
  return row;
});
