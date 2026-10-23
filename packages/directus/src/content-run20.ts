// Contenu du run 20 (mails d'Éléonore du 2026-10-22, travail SEO) — source unique,
// consommée par le seed complet (`seed.ts`) et par le seed ciblé `seed-run20.ts`
// (instance déjà remplie, typiquement la prod).
//
// Le reste des retours (liens dans les FAQ et les paragraphes) est entre les
// mains d'Éléonore : bouton lien du WYSIWYG dans les FAQ, convention
// `[texte](/lien)` dans les champs texte simple.

/** Sur-titre de la section « Preuve par l'exemple » de l'accueil (champ existant). */
export const run20HomeRewrites = {
  proof_eyebrow: {
    from: "Preuve par l'exemple",
    to: "Cas : GEPP, plan de formation, entretiens professionnels",
  },
};

/** Texte du lien de chaque carte « Ce que je vous aide à construire », par URL. */
export const run20BuildLinkLabels: Record<string, string> = {
  "/organisations/audit-rh": "Découvrir l'audit RH",
  "/organisations/carte-des-talents": "Découvrir la carte des talents",
  "/organisations/de-l-expert-au-manager": "Découvrir la formation De l'expert au manager",
};

/** Fiche autrice (E-E-A-T) — la photo reprend le portrait de l'accueil. */
export const run20Author = {
  author_name: "Eléonore Morée",
  author_title: "Consultante RH · PME, ETI et transitions professionnelles",
  linkedin_url: "https://www.linkedin.com/in/eleonore-moree",
};

/** FAQ de l'accueil, dans l'ordre du mail. */
export const run20HomeFaq = [
  {
    question: "Qu'est-ce que la GEPP ?",
    answer:
      "<p>La GEPP (gestion des emplois et des parcours professionnels) consiste à anticiper les compétences dont l'entreprise aura besoin et à organiser les évolutions de ses salariés. Elle n'est obligatoire que pour les entreprises d'au moins 300 salariés, mais elle sert à toute PME/ETI qui veut anticiper ses recrutements et ses formations.</p>",
  },
  {
    question: "Quand faut-il faire un audit RH ?",
    answer:
      "<p>Quand l'entreprise a grandi plus vite que ses pratiques RH : compétences mal identifiées, entretiens sans suite, décisions prises au fil de l'eau. L'audit débouche sur une feuille de route priorisée, avec un plan d'action sur 6 à 12 mois.</p>",
  },
  {
    question: "Intervenez-vous en dehors des Bouches-du-Rhône ?",
    answer:
      "<p>Oui. Je suis basée dans les Bouches-du-Rhône et j'interviens à Marseille, Aix-en-Provence, Avignon, Arles, ainsi qu'en France entière, sur place ou à distance.</p>",
  },
  {
    question: "Comment se passe le premier échange ?",
    answer:
      "<p>Un rendez-vous de 30 minutes, gratuit et sans engagement, pour comprendre votre situation et voir si je suis la bonne personne pour vous aider.</p>",
  },
].map((faq) => ({ ...faq, scope: "home" }));

const PDC_ARTICLE = {
  title: "Le Plan de Développement des Compétences : de l'obligation à l'outil stratégique",
  body: "Comment faire du PDC un vrai levier, au-delà de l'obligation légale.",
  url: "/ressources/plan-de-developpement-des-competences-pdc-entreprise-gepp-formation-professionnelle-strategie-rh-developpement-competences-pme-opco",
};

/**
 * « Pour aller plus loin » par offre. `caseTitle` désigne un cas concret dont
 * l'URL (page d'offre + ancre `#cas-<id>`) n'est connue qu'à l'exécution.
 */
export const run20FurtherLinks: Record<
  string,
  { title: string; body: string; url?: string; caseTitle?: string; caseOffer?: string }[]
> = {
  "audit-rh": [PDC_ARTICLE],
  "carte-des-talents": [PDC_ARTICLE],
  "de-l-expert-au-manager": [
    {
      title: "Cas : faire des entretiens un vrai outil de pilotage",
      body: "Des managers accompagnés, des trames refondues : 100 % de complétude des entretiens.",
      caseTitle: "Faire des entretiens un vrai outil de pilotage",
      caseOffer: "carte-des-talents",
    },
  ],
};
