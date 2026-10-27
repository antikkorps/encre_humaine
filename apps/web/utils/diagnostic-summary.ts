import {
  type Answers,
  type B2bResult,
  type B2cResult,
  type DiagnosticTexts,
  questionLabel,
  SENSITIVE_ANSWERS,
} from "@encre/shared/diagnostics";
import type { DiagnosticKind } from "~/types/content";
// Import EXPLICITE (pas d'auto-import `utils/` côté Nitro).
import { answerLabel, diagnosticQuestions, themeScores } from "~/utils/diagnostic-flow";

/**
 * Version lisible d'un diagnostic pour Éléonore (retour du 2026-10-27 : les
 * réponses brutes de l'admin « c'est du chinois »). Même texte dans la copie
 * qu'elle reçoit par email et dans le champ « Réponses en clair » de l'admin.
 */

/** Lignes « thème : score/100 (niveau) », global en tête pour le B2B. */
export function scoreLines(
  kind: DiagnosticKind,
  texts: DiagnosticTexts,
  result: B2bResult | B2cResult,
): string[] {
  const themes = themeScores(kind, texts, result).map(
    (t) => `${t.label} : ${t.score}/100 (${t.level})`,
  );
  if (kind === "b2c") return themes;
  const r = result as B2bResult;
  return [
    `${texts.messages.global_label} : ${r.global}/100 (${texts.levels[r.globalLevel]})`,
    ...themes,
  ];
}

/** Clés des offres recommandées, dans l'ordre du rapport. */
export function recommendedOffers(kind: DiagnosticKind, result: B2bResult | B2cResult): string[] {
  return kind === "b2c"
    ? [(result as B2cResult).offer]
    : (result as B2bResult).cards.map((c) => c.offer);
}

const SENSITIVE = new Set<string>(SENSITIVE_ANSWERS);
const SENSITIVE_NOTE = "(réponse non conservée : question sensible, jamais enregistrée)";

/** « 1. Question » puis « → Réponse », dans l'ordre du parcours suivi. */
function answerBlocks(kind: DiagnosticKind, texts: DiagnosticTexts, answers: Answers): string[] {
  const profile = String(answers.profile ?? "");
  return diagnosticQuestions(kind, answers).map((q, i) => {
    const answer = SENSITIVE.has(q.id) ? SENSITIVE_NOTE : answerLabel(texts, q, answers[q.id]);
    return `${i + 1}. ${questionLabel(texts, q.id, profile)}\n   → ${answer || "—"}`;
  });
}

export function diagnosticSummary(
  kind: DiagnosticKind,
  texts: DiagnosticTexts,
  answers: Answers,
  result: B2bResult | B2cResult,
): string {
  const offers = recommendedOffers(kind, result).map((k) => texts.offers[k]?.name ?? k);
  return [
    kind === "b2b" ? "Diagnostic RH (organisation)" : "Diagnostic projet (particulier)",
    "",
    ...scoreLines(kind, texts, result),
    `Offre(s) recommandée(s) : ${offers.join(", ")}`,
    "",
    "Réponses",
    ...answerBlocks(kind, texts, answers),
  ].join("\n");
}
