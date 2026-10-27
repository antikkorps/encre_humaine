import type { B2bResult, B2cResult } from "@encre/shared/diagnostics";
import { diagnosticSummary } from "~/utils/diagnostic-summary";
import { serverDb } from "~~/server/utils/db";
import { fillMissingSummaries } from "~~/server/utils/diagnostics";

/**
 * Tâche planifiée — remplit « Réponses en clair » des diagnostics reçus avant ce
 * champ (retour d'Éléonore du 2026-10-27). Sans ligne vide, elle ne fait rien.
 */
export default defineTask({
  meta: {
    name: "diagnostics:summarize",
    description: "Réponses en clair des diagnostics qui n'en ont pas encore.",
  },
  async run() {
    const texts = {
      b2b: (await loadDiagnosticContent("b2b")).texts,
      b2c: (await loadDiagnosticContent("b2c")).texts,
    };
    const filled = await fillMissingSummaries(serverDb(), (row) =>
      diagnosticSummary(
        row.kind,
        texts[row.kind],
        row.answers,
        row.result as unknown as B2bResult | B2cResult,
      ),
    );
    console.info(`[diagnostics:summarize] ${filled} diagnostic(s) complété(s).`);
    return { result: { filled } };
  },
});
