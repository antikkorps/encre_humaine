import type { Answers, Level, Question, ScoredQuestion, Theme } from "./types.ts";

/** Points d'une réponse scorée : 1re réponse 2, 2e 1, 3e 0 (cahier des charges §3.2). */
export function points(answer: number | string | undefined): number {
  return typeof answer === "number" && answer >= 0 && answer <= 2 ? 2 - answer : 0;
}

/** Niveaux appliqués à chaque score : < 40, 40 à 69, 70 et plus. */
export function level(score: number): Level {
  if (score < 40) return "low";
  return score < 70 ? "mid" : "high";
}

export const isScored = (q: Question): q is ScoredQuestion => q.kind !== "select";

/** Score d'un thème ramené sur 100, arrondi : points ÷ maximum × 100. */
export function themeScore(questions: readonly Question[], answers: Answers, theme: Theme): number {
  const scored = questions.filter(isScored).filter((q) => q.theme === theme);
  const total = scored.reduce((sum, q) => sum + points(answers[q.id]), 0);
  return scored.length ? Math.round((total / (scored.length * 2)) * 100) : 0;
}

/**
 * Lève une erreur si une question attendue est sans réponse valide : le serveur
 * ne calcule jamais un rapport sur un questionnaire tronqué ou trafiqué.
 */
export function assertComplete(questions: readonly Question[], answers: Answers): void {
  for (const q of questions) {
    const a = answers[q.id];
    const valid = isScored(q)
      ? typeof a === "number" && Number.isInteger(a) && a >= 0 && a <= 2
      : typeof a === "string" && q.options.includes(a);
    if (!valid) throw new Error(`Réponse manquante ou invalide : ${q.id}`);
  }
}

/**
 * Conseils : au plus 3, pris sur les réponses à moins de 2 points, thème le plus
 * faible d'abord puis réponse la plus faible (ordre des questions en dernier).
 */
export function pickTips(
  questions: readonly Question[],
  answers: Answers,
  scores: Partial<Record<Theme, number>>,
): string[] {
  return questions
    .filter(isScored)
    .map((q, order) => ({ q, order, pts: points(answers[q.id]) }))
    .filter((t) => t.pts < 2)
    .sort(
      (a, b) =>
        (scores[a.q.theme] ?? 0) - (scores[b.q.theme] ?? 0) || a.pts - b.pts || a.order - b.order,
    )
    .slice(0, 3)
    .map((t) => t.q.id);
}
