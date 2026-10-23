/**
 * Diagnostics B2B / B2C — docs/11-diagnostics.md. Ce module ne porte AUCUN
 * texte : questions, réponses et offres sont désignées par des identifiants
 * stables ; leurs libellés vivent dans Directus. Le même moteur tourne dans le
 * navigateur (affichage immédiat) et sur le serveur (recalcul de référence).
 */

/** Oui / En partie / Non, ou 1re / 2e / 3e situation : 2 / 1 / 0 points. */
export type ScoredKind = "yes_no" | "situation";

export interface ScoredQuestion {
  id: string;
  kind: ScoredKind;
  theme: Theme;
}

export interface SelectQuestion {
  id: string;
  kind: "select";
  /** Clés stables des options, dans l'ordre d'affichage. */
  options: readonly string[];
}

export type Question = ScoredQuestion | SelectQuestion;

export type Theme = "A" | "B" | "C";

/** Réponse : index 0..2 pour une question scorée, clé d'option pour un menu. */
export type Answers = Record<string, number | string>;

export type Level = "low" | "mid" | "high";
