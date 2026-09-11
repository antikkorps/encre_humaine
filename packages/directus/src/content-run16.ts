// Contenu du run 16 (mails d'Éléonore du 2026-09-11) — source unique, consommée
// par le seed complet (`seed.ts`) et par le seed ciblé `seed-run16.ts` (instance
// déjà remplie, typiquement la prod).
//
// Convention `**…**` : gras doré à l'affichage (cf. apps/web/utils/accent.ts).

/**
 * Hub Organisations — les trois cartes d'enjeu gagnent un 2e encadré et la ligne
 * « Investissement · Format ». Éléonore n'a donné QUE les intitulés des encadrés :
 * le texte, elle le rédige depuis l'admin (elle y réinjecte ce qui vivait dans les
 * deux blocs retirés). On ne seede donc pas de corps — un encadré sans texte reste
 * masqué, la page ne montre jamais un intitulé orphelin.
 *
 * Prix et format sont saisis ICI plutôt que laissés vides : les valeurs annoncées
 * sur le hub sont celles de son mail, qui ne correspondent pas forcément à ce que
 * portent aujourd'hui les fiches d'offre. Vidés un jour dans l'admin, ils
 * retomberont automatiquement sur la fiche d'offre liée.
 */
export const run16OrgHub = {
  situation_a_takeaway_label: "Ce que ça vous évite",
  situation_a_price: "à partir de 2 000 €",
  situation_a_duration: "à partir de 2 semaines",
  situation_b_takeaway_label: "Pourquoi ça compte",
  situation_b_price: "à partir de 4 000 €",
  situation_b_duration: "à partir de 4 semaines",
  situation_c_takeaway_label: "Ce que vous y gagnez",
  situation_c_price: "sur devis",
  situation_c_duration: "minimum 2 jours",
  audience_body:
    "Vous connaissez probablement déjà ces sujets en théorie : la difficulté, c'est de trouver le temps et le recul pour les structurer en plus du quotidien. Un renfort ponctuel et expert sur un sujet précis (GEPP, cartographie des compétences, accompagnement managérial) permet d'avancer sans tout porter seul, en appui de votre équipe RH interne. On peut se prendre 30 minutes pour en parler.",
} as const;

/**
 * Remplacements ciblés du hub : un champ n'est réécrit que s'il porte ENCORE la
 * valeur d'avant (sinon Éléonore l'a retouché entre-temps et on n'y touche pas).
 * C'est le seul endroit où le lot écrase du texte existant — cf. seed-run16.ts.
 */
export const run16OrgHubRewrites: Record<string, { from: string; to: string }> = {
  audience_title: {
    from: "Vous vous reconnaîtrez probablement dans l'une de ces situations.",
    to: "**Vous êtes RH ou dirigeant ?**",
  },
  audience_conclusion: {
    from: "Que vous soyez dirigeant, DRH, responsable RH ou manager, l'objectif reste le même : créer davantage de clarté pour permettre aux équipes d'avancer dans la même direction.",
    to: "Que vous soyez dirigeant, DRH, responsable RH ou manager, l'objectif reste le même : créer davantage de clarté pour permettre à vos équipes d'avancer dans la même direction.",
  },
};

/** Habillage de la section « Preuve par l'exemple » sur la page Carte des Talents. */
export const run16OfferProof = {
  slug: "carte-des-talents",
  values: {
    proof_eyebrow: "Preuve par l'exemple",
    proof_title: "Ce que ça donne, **concrètement**.",
  },
} as const;

/**
 * Cas concrets ajoutés au run 16 (mail du 2026-09-11). Ils rejoignent celui du
 * run 15 sur l'accueil et, tous les trois, la page Carte des Talents via
 * `offer_scopes`. Comme au run 15, ils s'appuient sur l'expérience vérifiable
 * d'Éléonore en attendant des références L'Encre Humaine.
 */
export const run16CaseStudies = [
  {
    title: "Aligner le plan de formation sur les postes qui vont évoluer",
    summary:
      "Un budget confortable, un catalogue ouvert à tous mais aucun lien avec les compétences dont l'entreprise allait avoir besoin.",
    situation:
      "30 000 € de formation dépensés sur l'année, des sessions bien réalisées, mais aucun lien avec les évolutions prévues sur les postes : le cabinet préparait une nouvelle offre de missions data, et les 3 consultants pressentis n'avaient reçu aucune formation sur le sujet.",
    actions:
      "Reprise du plan de développement des compétences en partant des postes (quels postes évoluent, quelles compétences deviennent nécessaires, qui doit les acquérir, à quel moment) plutôt que du catalogue existant.",
    result:
      "Les 3 consultants concernés formés **avant le démarrage des missions data**, pas après. Un budget formation enfin aligné sur ce qui arrivait, pas sur ce qui avait toujours été fait.",
    sector: "Conseil & formation",
    period_label: "2 ans",
    offer_scopes: ["carte-des-talents"],
  },
  {
    title: "Faire des entretiens un vrai outil de pilotage, pas une formalité",
    summary: "Des trames inadaptées, des managers démunis, aucun lien avec le plan de formation.",
    situation:
      "Des trames d'entretien (annuel, semestriel, parcours professionnel) peu différenciées, sans intérêt perçu ni par les collaborateurs ni par les managers. Les entretiens ne remontaient aucun besoin exploitable pour alimenter le plan de formation, et les managers menaient ces échanges sans brief ni repères.",
    actions:
      "Refonte complète des 3 trames, différenciées selon leur objectif, accompagnement des managers dans la durée, et connexion directe entre les besoins remontés en entretien et la construction du plan de formation via des diagnostics collaborateurs en aval.",
    result:
      "Taux de complétude des entretiens à **100 %**, retours largement positifs des équipes et des managers, et des besoins de formation désormais alimentés par ce qui remonte vraiment du terrain plutôt que par un catalogue générique.",
    sector: "Conseil & formation",
    period_label: "2 ans",
    offer_scopes: ["carte-des-talents"],
  },
] as const;

/**
 * Cas du run 15 : il reste le 2e des trois cartes demandées par Éléonore, donc il
 * doit désormais cocher la page Carte des Talents lui aussi.
 */
export const run16ExistingCaseScopes = {
  title: "Structurer les compétences d'une entreprise de conseil en croissance",
  offer_scopes: ["carte-des-talents"],
} as const;

/**
 * Ordre des cartes du carrousel, dans l'ordre du mail d'Éléonore (le cas du run 15
 * est sa carte n° 2). Sans ça, c'est l'ordre de création qui gagne — le plus ancien
 * en tête. N'est posé que sur un cas dont le tri n'a jamais été fixé : son
 * glisser-déposer dans l'admin reste souverain.
 */
export const run16CaseOrder = [
  "Aligner le plan de formation sur les postes qui vont évoluer",
  "Structurer les compétences d'une entreprise de conseil en croissance",
  "Faire des entretiens un vrai outil de pilotage, pas une formalité",
] as const;

/**
 * Blocs retirés des pages au run 16. Le CMS garde les champs (le bootstrap ne
 * supprime jamais rien) mais la page ne les lit plus ; le script les affiche en
 * clair au passage, pour qu'Éléonore récupère son texte si elle veut le réinjecter
 * ailleurs.
 */
export const run16RetiredBlocks = {
  orgHub: [
    "observe_title",
    "observe_intro",
    "observe_items",
    "observe_conclusion",
    "audience_items",
  ],
  /** Page Carte des Talents : le constat cède la place à la preuve par l'exemple. */
  offerContext: {
    slug: "carte-des-talents",
    fields: ["context_title", "context_items", "context_conclusion"],
  },
} as const;
