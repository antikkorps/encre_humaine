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

export function diagnosticScreens(kind: DiagnosticKind, answers: Answers): string[] {
  return diagnosticQuestions(kind, answers).map((q) => q.id);
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
  if (!baseUrl) return "";
  const url = new URL(baseUrl);
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

/** Résumé du diagnostic pour la note du rendez-vous (jamais la réponse sensible B2C). */
export function bookingNote(
  kind: DiagnosticKind,
  answers: Answers,
  result: B2bResult | B2cResult,
  texts: DiagnosticTexts,
): string {
  const offers = (keys: string[]) => keys.map((k) => texts.offers[k]?.name ?? k).join(", ");
  if (kind === "b2b") {
    const r = result as B2bResult;
    const themes = (["A", "B", "C"] as const).map((t) => `${texts.themes[t]} ${r.scores[t]}`);
    return [
      `Diagnostic RH — Profil : ${answerLabelFor(texts, kind, answers, "profile")}`,
      `Taille : ${answerLabelFor(texts, kind, answers, "size")}`,
      `Score global ${r.global}/100 (${themes.join(", ")})`,
      `Offres : ${offers(r.cards.map((c) => c.offer))}`,
      `Priorité : ${answerLabelFor(texts, kind, answers, "priority")}`,
    ].join(" ; ");
  }
  const r = result as B2cResult;
  const themes = (["A", "B"] as const).map(
    (t) => `${texts.themes[`${r.path}_${t}`]} ${r.scores[t]}`,
  );
  return [
    `Diagnostic projet — Situation : ${answerLabelFor(texts, kind, answers, "situation")}`,
    `Scores : ${themes.join(", ")}`,
    `Offre : ${offers([r.offer])}`,
  ].join(" ; ");
}
