import {
  type Answers,
  B2B_QUESTIONS,
  type B2bResult,
  B2C_PATHS,
  type B2cResult,
  type DiagnosticTexts,
  type Question,
} from "@encre/shared/diagnostics";
import type { DiagnosticKind } from "~/types/content";

/**
 * Parcours des diagnostics — docs/11-diagnostics.md. Fonctions pures partagées
 * par le questionnaire, le rapport et l'email : quels écrans, quels libellés,
 * quel lien de rendez-vous. Aucune règle de calcul ici (→ @encre/shared).
 */

/** Questions du parcours, dans l'ordre. B2C : Direction tant que la Q2 n'est pas répondue. */
export function diagnosticQuestions(kind: DiagnosticKind, answers: Answers): readonly Question[] {
  if (kind === "b2b") return B2B_QUESTIONS;
  return B2C_PATHS[answers.orientation === "position" ? "position" : "direction"];
}

/** Libellé de la réponse donnée à une question (menu : par clé ; scorée : par index). */
export function answerLabel(
  texts: DiagnosticTexts,
  question: Question,
  answer: number | string | undefined,
): string {
  const options = texts.questions[question.id]?.options ?? [];
  const index =
    question.kind === "select" ? question.options.indexOf(String(answer)) : Number(answer);
  return options[index] ?? "";
}

/** Remplace `{repère}` par sa valeur ; un repère inconnu reste tel quel. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/**
 * Lien d'agenda pré-rempli (paramètres d'URL de la page de réservation Cal.com) :
 * Éléonore arrive au rendez-vous avec le résumé du diagnostic, sans reposer
 * les questions. Sans agenda configuré, pas de lien.
 */
export function bookingHref(
  baseUrl: string,
  prefill: { email?: string; name?: string; notes?: string },
): string {
  let url: URL;
  try {
    url = new URL(baseUrl); // vide ou relatif (erreur de saisie) : pas un agenda
  } catch {
    return "";
  }
  for (const [key, value] of Object.entries(prefill)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Libellé de la réponse donnée à la question `id` du parcours ("" si sans objet). */
export function answerLabelFor(
  texts: DiagnosticTexts,
  kind: DiagnosticKind,
  answers: Answers,
  id: string,
): string {
  const question = diagnosticQuestions(kind, answers).find((q) => q.id === id);
  return question ? answerLabel(texts, question, answers[id]) : "";
}

export interface ThemeScore {
  label: string;
  score: number;
  level: string;
}

/** Scores par thème, nommés et qualifiés — une seule mise en forme pour page, email et note. */
export function themeScores(
  kind: DiagnosticKind,
  texts: DiagnosticTexts,
  result: B2bResult | B2cResult,
): ThemeScore[] {
  const themes = kind === "b2b" ? (["A", "B", "C"] as const) : (["A", "B"] as const);
  const prefix = kind === "b2b" ? "" : `${(result as B2cResult).path}_`;
  const scores = result.scores as Record<string, number>;
  const levels = result.levels as Record<string, "low" | "mid" | "high">;
  return themes.map((t) => ({
    label: texts.themes[`${prefix}${t}`] ?? t,
    score: scores[t] ?? 0,
    level: texts.levels[levels[t] ?? "low"],
  }));
}

/** Repli quand aucun agenda n'est configuré : la page Contact du bon public. */
export const contactFallbackPath = (kind: DiagnosticKind) =>
  `/contact?pour=${kind === "b2b" ? "organisation" : "particulier"}`;

/** Résumé du diagnostic pour la note du rendez-vous (jamais la réponse sensible B2C). */
export function bookingNote(
  kind: DiagnosticKind,
  answers: Answers,
  result: B2bResult | B2cResult,
  texts: DiagnosticTexts,
): string {
  const offers = (keys: string[]) => keys.map((k) => texts.offers[k]?.name ?? k).join(", ");
  const themes = themeScores(kind, texts, result)
    .map((t) => `${t.label} ${t.score}`)
    .join(", ");
  const label = (id: string) => answerLabelFor(texts, kind, answers, id);
  if (kind === "b2b") {
    const r = result as B2bResult;
    return [
      `Diagnostic RH — Profil : ${label("profile")}`,
      `Taille : ${label("size")}`,
      `Score global ${r.global}/100 (${themes})`,
      `Offres : ${offers(r.cards.map((c) => c.offer))}`,
      `Priorité : ${label("priority")}`,
    ].join(" ; ");
  }
  return [
    `Diagnostic projet — Situation : ${label("situation")}`,
    `Scores : ${themes}`,
    `Offre : ${offers([(result as B2cResult).offer])}`,
  ].join(" ; ");
}
