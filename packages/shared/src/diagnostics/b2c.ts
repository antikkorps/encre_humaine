import { assertComplete, level, pickTips, points, themeScore } from "./scoring.ts";
import type { Answers, Level, Question } from "./types.ts";

/**
 * Diagnostic B2C « Où en est votre projet professionnel ? » — cahier §6-7.
 * Trois questions communes non scorées, puis neuf questions selon le parcours
 * choisi en Q2 : on ne fait pas répondre sur ses candidatures quelqu'un qui
 * cherche encore sa direction, ni l'inverse.
 */
const COMMON = [
  {
    id: "situation",
    kind: "select",
    options: ["employed", "job_seeking", "after_break", "pause", "reconversion"],
  },
  { id: "orientation", kind: "select", options: ["direction", "position"] },
  // « hard » déclenche l'écran bienveillant ; la réponse n'est jamais conservée.
  { id: "difficulty", kind: "select", options: ["pro", "mixed", "hard"] },
] as const satisfies readonly Question[];

/** Parcours Direction : A Clarté du projet (Q4-9), B Mise en mouvement (Q10-12). */
const DIRECTION = [
  { id: "d_one_sentence", kind: "yes_no", theme: "A" },
  { id: "d_drivers", kind: "situation", theme: "A" },
  { id: "d_skills", kind: "yes_no", theme: "A" },
  { id: "d_values", kind: "yes_no", theme: "A" },
  { id: "d_constraints", kind: "yes_no", theme: "A" },
  { id: "d_options", kind: "situation", theme: "A" },
  { id: "d_tested", kind: "situation", theme: "B" },
  { id: "d_support", kind: "yes_no", theme: "B" },
  { id: "d_funding", kind: "yes_no", theme: "B" },
] as const satisfies readonly Question[];

/** Parcours Poste : A Clarté du poste visé (Q4-6), B Lisibilité de la recherche (Q7-12). */
const POSITION = [
  { id: "p_target", kind: "yes_no", theme: "A" },
  { id: "p_proof", kind: "yes_no", theme: "A" },
  { id: "p_constraints", kind: "yes_no", theme: "A" },
  { id: "p_cv", kind: "yes_no", theme: "B" },
  { id: "p_pitch", kind: "situation", theme: "B" },
  { id: "p_linkedin", kind: "yes_no", theme: "B" },
  { id: "p_targeting", kind: "situation", theme: "B" },
  { id: "p_followup", kind: "situation", theme: "B" },
  { id: "p_network", kind: "yes_no", theme: "B" },
] as const satisfies readonly Question[];

export type B2cPath = "direction" | "position";
export const B2C_PATHS: Record<B2cPath, readonly Question[]> = {
  direction: [...COMMON, ...DIRECTION],
  position: [...COMMON, ...POSITION],
};
export const B2C_SEQUENCE_LENGTH = 12;

/** Identifiants des 12 écrans d'un parcours, dans l'ordre. */
export function b2cSequence(path: B2cPath): string[] {
  return B2C_PATHS[path].map((q) => q.id);
}

/**
 * Enregistre une réponse. Changer d'orientation (Q2) efface les réponses du
 * parcours abandonné : elles fausseraient les scores du nouveau.
 */
export function setB2cAnswer(answers: Answers, id: string, value: number | string): Answers {
  const next = { ...answers, [id]: value };
  if (id !== "orientation" || answers.orientation === value) return next;
  const kept = new Set<string>(COMMON.map((q) => q.id));
  return Object.fromEntries(Object.entries(next).filter(([k]) => kept.has(k)));
}

export type B2cOffer = "clarify" | "reposition";
export type B2cMessage = "need_direction" | "direction_emerging" | "course_set" | "well_advanced";

export interface B2cResult {
  path: B2cPath;
  scores: { A: number; B: number };
  levels: { A: Level; B: Level };
  offer: B2cOffer;
  message: B2cMessage;
  /** Situation « après un licenciement ou une rupture » : phrase ajoutée. */
  ruptureNote: boolean;
  tips: string[];
}

/** Table de recommandation du cahier §7. */
function recommend(
  path: B2cPath,
  answers: Answers,
  scores: B2cResult["scores"],
): Pick<B2cResult, "offer" | "message"> {
  if (path === "direction") {
    return scores.A < 70
      ? { offer: "clarify", message: "need_direction" }
      : { offer: "reposition", message: "direction_emerging" };
  }
  // Question clé : sans poste formulable en une phrase, la direction passe avant tout.
  if (points(answers.p_target) === 0) return { offer: "clarify", message: "need_direction" };
  return { offer: "reposition", message: scores.B < 70 ? "course_set" : "well_advanced" };
}

export function computeB2c(answers: Answers): B2cResult {
  const path: B2cPath = answers.orientation === "position" ? "position" : "direction";
  const questions = B2C_PATHS[path];
  assertComplete(questions, answers);
  const scores = { A: themeScore(questions, answers, "A"), B: themeScore(questions, answers, "B") };
  return {
    path,
    scores,
    levels: { A: level(scores.A), B: level(scores.B) },
    ...recommend(path, answers, scores),
    ruptureNote: answers.situation === "after_break",
    tips: pickTips(questions, answers, scores),
  };
}
