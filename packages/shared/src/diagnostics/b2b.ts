import { assertComplete, level, pickTips, themeScore } from "./scoring.ts";
import type { Answers, Level, Question, Theme } from "./types.ts";

/**
 * Diagnostic B2B « Où en sont vos RH, vraiment ? » — cahier des charges §4-5.
 * Thèmes : A Structuration RH, B Compétences et GEPP, C Management.
 */
export const B2B_QUESTIONS = [
  { id: "profile", kind: "select", options: ["leader", "hr", "other"] },
  {
    id: "size",
    kind: "select",
    options: ["lt10", "10-19", "20-49", "50-149", "150-300", "gt300"],
  },
  { id: "a_practices", kind: "yes_no", theme: "A" },
  { id: "a_onboarding", kind: "situation", theme: "A" },
  { id: "a_indicators", kind: "yes_no", theme: "A" },
  { id: "b_key_person", kind: "situation", theme: "B" },
  { id: "b_reviews", kind: "yes_no", theme: "B" },
  { id: "b_training_plan", kind: "situation", theme: "B" },
  { id: "c_support", kind: "yes_no", theme: "C" },
  { id: "c_tension", kind: "situation", theme: "C" },
  { id: "c_consistency", kind: "yes_no", theme: "C" },
  {
    id: "priority",
    kind: "select",
    options: ["growth", "departures", "tensions", "training", "unknown"],
  },
] as const satisfies readonly Question[];

/**
 * Libellé de question adapté au profil (Q1) : la variante « dirigeant » ou « DRH »
 * remplace la formulation de base ; « Autre » garde la base.
 */
export const B2B_VARIANTS: Partial<Record<string, "leader" | "hr">> = {
  a_practices: "hr",
  a_indicators: "leader",
  b_reviews: "leader",
  c_support: "leader",
};

export type B2bOffer = "audit" | "talents" | "managers";
const OFFER_BY_THEME: Record<Theme, B2bOffer> = { A: "audit", B: "talents", C: "managers" };
const THEME_BY_OFFER: Record<B2bOffer, Theme> = { audit: "A", talents: "B", managers: "C" };
const OFFER_BY_PRIORITY: Record<string, B2bOffer | null> = {
  growth: "audit",
  departures: "talents",
  tensions: "managers",
  training: "talents",
  unknown: null,
};
const THEMES: Theme[] = ["A", "B", "C"];

export interface B2bCard {
  offer: B2bOffer;
  /** `score` : ce que montre le diagnostic ; `need` : la priorité exprimée. */
  role: "score" | "need";
}

export interface B2bResult {
  scores: Record<Theme, number>;
  levels: Record<Theme, Level>;
  global: number;
  globalLevel: Level;
  cards: B2bCard[];
  /** Score et priorité désignent la même offre (une carte + phrase dédiée). */
  sameDirection: boolean;
  /** Score global ≥ 70 : l'échange portera sur l'optimisation. */
  solidBase: boolean;
  sizeNote: "small" | "large" | null;
  tips: string[];
}

/** Offre du score : thème le plus faible ; tous sous 40 → Audit RH (cahier §5.2). */
function scoreOffer(scores: Record<Theme, number>, need: B2bOffer | null): B2bOffer {
  if (THEMES.every((t) => scores[t] < 40)) return "audit";
  const lowest = Math.min(...THEMES.map((t) => scores[t]));
  const tied = THEMES.filter((t) => scores[t] === lowest);
  const needTheme = need ? THEME_BY_OFFER[need] : null;
  return OFFER_BY_THEME[needTheme && tied.includes(needTheme) ? needTheme : (tied[0] as Theme)];
}

/** Cartes affichées : règles d'affichage du cahier §5.2, deux au plus. */
function pickCards(fromScore: B2bOffer, need: B2bOffer | null, solidBase: boolean): B2bCard[] {
  if (solidBase)
    return [need ? { offer: need, role: "need" } : { offer: fromScore, role: "score" }];
  if (!need || need === fromScore) return [{ offer: fromScore, role: "score" }];
  return [
    { offer: fromScore, role: "score" },
    { offer: need, role: "need" },
  ];
}

function sizeNote(size: string): B2bResult["sizeNote"] {
  if (size === "lt10" || size === "10-19") return "small";
  return size === "gt300" ? "large" : null;
}

export function computeB2b(answers: Answers): B2bResult {
  assertComplete(B2B_QUESTIONS, answers);
  const scores = { A: 0, B: 0, C: 0 };
  for (const t of THEMES) scores[t] = themeScore(B2B_QUESTIONS, answers, t);
  const global = Math.round((scores.A + scores.B + scores.C) / 3);
  const need = OFFER_BY_PRIORITY[String(answers.priority)] ?? null;
  const fromScore = scoreOffer(scores, need);
  const solidBase = global >= 70;
  return {
    scores,
    levels: { A: level(scores.A), B: level(scores.B), C: level(scores.C) },
    global,
    globalLevel: level(global),
    cards: pickCards(fromScore, need, solidBase),
    sameDirection: !solidBase && need === fromScore,
    solidBase,
    sizeNote: sizeNote(String(answers.size)),
    tips: pickTips(B2B_QUESTIONS, answers, scores),
  };
}
