// Contenu du run 15 (audit du 2026-09-08) — source unique, consommée par le seed
// complet (`seed.ts`) et par le seed ciblé `seed-run15.ts` (instance déjà remplie).
//
// Convention `**…**` : gras doré à l'affichage (cf. apps/web/utils/accent.ts).

/**
 * Renommage des offres : ancien slug → nouveau slug + nouveau titre.
 * Partagé par le script de migration (`rename-offers.ts`) et par le seed complet,
 * qui doit renommer une offre existante plutôt que d'en créer une deuxième — sans
 * ça, un `pnpm seed` laisse les cinq anciennes offres à côté des cinq nouvelles.
 * Les anciennes URLs restent servies : `routeRules` les redirige en 301.
 */
export const OFFER_RENAMES: Record<string, { slug: string; title: string }> = {
  "competences-parcours": { slug: "carte-des-talents", title: "Carte des Talents" },
  "managers-equipes": { slug: "de-l-expert-au-manager", title: "De l'Expert au Manager" },
  "clarifier-avancer": { slug: "clarifier-son-projet", title: "Clarifier son projet" },
  "booster-recherche": { slug: "se-repositionner", title: "Se (re)positionner" },
};

/** Nouveaux champs de `home_page`. Rien ici ne doit écraser du contenu existant. */
export const run15Home = {
  hero_eyebrow: "Conseil RH pour dirigeants de PME et ETI",
  proof_eyebrow: "Preuve par l'exemple",
  proof_title: "Ce que ça donne, **concrètement**.",
  sectors_eyebrow: "Secteurs d'intervention",
  sectors_title: "J'ai travaillé avec…",
  sectors_items: [
    {
      icon: "school",
      title: "Le conseil et la formation professionnelle",
      body: "Pilotage RH, qualité Qualiopi, développement des compétences.",
    },
    {
      icon: "handshake",
      title: "L'insertion et l'accompagnement professionnel",
      body: "France Travail, Mission Locale, structures d'insertion.",
    },
    {
      icon: "person-search",
      title: "Le recrutement et la relation client",
      body: "Évaluation de compétences, structuration de process.",
    },
  ],
  why_eyebrow: "Ma conviction",
} as const;

/** Nouveaux champs de `about_page` : les « trois expertises » quittent l'accueil. */
export const run15About = {
  expertises_title: "Une approche à la croisée de trois expertises.",
  expertises_items: [
    {
      icon: "handshake",
      title: "Insertion professionnelle",
      body: "Comprendre les parcours, les transitions et les dynamiques humaines.",
    },
    {
      icon: "school",
      title: "Formation",
      body: "Concevoir des dispositifs qui développent réellement les compétences.",
    },
    {
      icon: "settings",
      title: "Conseil RH",
      body: "Structurer les organisations avec des outils adaptés au terrain.",
    },
  ],
  expertises_conclusion:
    "Cette double vision des organisations et des parcours me permet d'agir à la fois sur les systèmes et sur les personnes qui les font vivre.",
} as const;

/**
 * Premier cas concret. Il s'appuie sur l'expérience vérifiable d'Éléonore en
 * attendant des références L'Encre Humaine — c'est explicitement la consigne :
 * « en attendant d'avoir des cas clients, on s'appuie sur mon expérience ».
 */
export const run15CaseStudy = {
  title: "Structurer les compétences d'une entreprise de conseil en croissance",
  summary:
    "Une entreprise de conseil et formation, 60 collaborateurs, deux ans de transformation RH.",
  situation:
    "Une entreprise de conseil et formation en pleine croissance, 60 collaborateurs, des compétences critiques mal identifiées et des entretiens professionnels vécus comme une formalité.",
  actions:
    "Cartographie des compétences clés, structuration d'une démarche GEPP, refonte des entretiens professionnels en véritables leviers de dialogue managérial, dashboards de pilotage pour suivre l'impact.",
  result:
    "**96 % de satisfaction** sur les parcours de formation, **NPS +42**, **+18 % d'actions de formation** réalisées à budget constant et une organisation reconnue **médaille d'or EcoVadis** (top 3 %) sur ses pratiques RSE et RH.",
  sector: "Conseil & formation",
  period_label: "2 ans",
} as const;
