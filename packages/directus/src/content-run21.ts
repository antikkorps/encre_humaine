// Contenu du run 21 (mail d'Éléonore du 2026-10-26) — cartes résumées des cas
// concrets sur l'accueil. Source unique du seed complet (`seed.ts`) et du seed
// ciblé `seed-run21.ts` (instance déjà remplie, typiquement la prod).
//
// « Résultat : » et la flèche du bouton sont ajoutés à l'affichage : ils ne sont
// pas dans les textes.

/** Titre du cas Qualiopi (page Audit RH), repris de la carte d'Éléonore. */
export const run21QualiopiTitle = {
  from: "Sécuriser une structure avant que l'audit ne devienne une source de stress",
  to: "Qualiopi : passer d’un suivi dispersé à des audits sans non-conformité",
};

/**
 * Carte résumée par cas, retrouvé par le début de son titre (`match`). Le plan de
 * formation garde sa carte, prête si Éléonore le remet sur l'accueil.
 */
export const run21CaseTeasers = [
  {
    match: ["Aligner le plan de formation"],
    teaser_label: "Plan de formation",
    teaser_situation:
      "30 000 € de formation dépensés dans l’année, sans lien avec les évolutions de postes prévues.",
    teaser_result:
      "les 3 consultants concernés formés avant le démarrage des missions data, pas après.",
    teaser_button: "Lire le cas : plan de formation",
  },
  {
    match: ["Structurer les compétences d"],
    teaser_label: "GEPP et compétences",
    teaser_situation:
      "60 collaborateurs, des compétences critiques mal identifiées, des entretiens vécus comme une formalité.",
    teaser_result: "96 % de satisfaction, NPS +42, +18 % d’actions de formation à budget constant.",
    teaser_button: "Lire le cas : GEPP et compétences",
  },
  {
    match: ["Faire des entretiens un vrai outil de pilotage"],
    teaser_label: "Entretiens professionnels",
    teaser_situation:
      "Des trames d’entretien peu différenciées, des managers sans repères, aucun lien avec le plan de formation.",
    teaser_result:
      "100 % de complétude des entretiens et des besoins de formation issus du terrain.",
    teaser_button: "Lire le cas : entretiens professionnels",
  },
  {
    match: [run21QualiopiTitle.from, run21QualiopiTitle.to],
    teaser_label: "Audit RH",
    teaser_situation: "Un référentiel qualité suivi de façon dispersée, sans process formalisé.",
    teaser_result:
      "audits de surveillance et de renouvellement réussis sans aucune non-conformité, mineure ou majeure.",
    teaser_button: "Lire le cas : Qualiopi",
  },
];

/**
 * Accueil : Qualiopi remplace la carte 1 (plan de formation) pour que les cas
 * couvrent les trois offres et pas seulement la Carte des Talents.
 */
export const run21HomeSwap = {
  show: run21QualiopiTitle.to,
  hide: "Aligner le plan de formation",
};
