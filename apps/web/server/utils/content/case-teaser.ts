import type { CaseStudyTeaser } from "~/types/content";

/**
 * Carte résumée d'un cas sur l'accueil (mail d'Éléonore du 2026-10-26) : quatre
 * champs saisis à part du récit complet, pour que la carte se lise en entier
 * sans rien couper.
 */
export interface RawCaseTeaser {
  teaser_label?: string | null;
  teaser_situation?: string | null;
  teaser_result?: string | null;
  teaser_button?: string | null;
}

const clean = (val: unknown): string => (typeof val === "string" ? val.trim() : "");

// La carte affiche déjà « Résultat : » et la flèche : saisis aussi dans l'admin
// (c'est ainsi qu'Éléonore les a rédigés), ils apparaîtraient en double.
const RESULT_PREFIX = /^(?:résultat\s*:\s*)+/i;
const TRAILING_ARROW = /\s*→\s*$/;

/** `undefined` tant qu'aucun des quatre champs n'est rempli : la carte garde le résumé. */
export function mapCaseTeaser(raw: RawCaseTeaser): CaseStudyTeaser | undefined {
  const teaser = {
    label: clean(raw.teaser_label),
    situation: clean(raw.teaser_situation),
    result: clean(raw.teaser_result).replace(RESULT_PREFIX, ""),
    button: clean(raw.teaser_button).replace(TRAILING_ARROW, ""),
  };
  return Object.values(teaser).some(Boolean) ? teaser : undefined;
}
