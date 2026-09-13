// Contenu du run 17 (3 mails d'Éléonore du 2026-09-13) — source unique, consommée
// par le seed complet (`seed.ts`) et par le seed ciblé `seed-run17.ts` (instance
// déjà remplie, typiquement la prod).
//
// Le lot applique aux pages Audit RH et De l'Expert au Manager ce que le run 16 a
// fait sur Carte des Talents : le bloc « constat » saute, la preuve par l'exemple
// prend sa place. Côté particuliers, les deux cartes situation gagnent le même
// pied de carte que les enjeux du hub organisations.
//
// Convention `**…**` : gras doré à l'affichage (cf. apps/web/utils/accent.ts).

/**
 * Cas concrets de la page **Audit RH** (mail n° 1). Comme aux runs 15 et 16, ils
 * s'appuient sur l'expérience vérifiable d'Éléonore en attendant des références
 * L'Encre Humaine.
 *
 * `show_on_home: false` : ces cas sont écrits POUR une page d'offre. Sans ça, les
 * sept nouveaux s'empilaient aussi dans le carrousel de l'accueil, qui serait passé
 * de 3 à 10 cartes. Éléonore peut en promouvoir un depuis l'admin (case « Afficher
 * aussi sur l'accueil »).
 */
export const run17AuditCaseStudies = [
  {
    title: "Sécuriser une structure avant que l'audit ne devienne une source de stress",
    summary: "Un référentiel qualité suivi de façon dispersée, sans process formalisé.",
    situation:
      "Un organisme de formation où les exigences qualité (Qualiopi) étaient suivies, mais de façon dispersée : pas de process formalisé, pas de suivi structuré des écarts, chaque audit vécu comme une source de stress plutôt que comme un point de contrôle serein.",
    actions:
      "Formalisation des processus et des modes opératoires (MODOP), structuration du suivi des indicateurs qualité, mise en place de plans d'action correctifs en amont de chaque échéance d'audit.",
    result:
      "Audits de surveillance et de renouvellement réussis **sans aucune non-conformité**, mineure ou majeure. C'est cette même logique — remettre de la structure avant que l'urgence ne s'impose — qui s'applique à un audit RH.",
    sector: "Organisme de formation • Fonction qualité",
    period_label: "1 an",
    offer_scopes: ["audit-rh"],
    show_on_home: false,
  },
  {
    title: "Redonner envie de rejoindre l'entreprise, dès la première offre",
    summary:
      "Des offres qui ne donnaient pas envie, des recrutements longs, une entreprise peu visible.",
    situation:
      "Les offres d'emploi ne donnaient pas envie, les recrutements s'éternisaient, l'entreprise manquait de visibilité candidat. Les messages envoyés étaient les réponses automatiques par défaut du logiciel de recrutement, impersonnelles et peu engageantes. Les managers, mal formés à l'outil, n'avaient aucun suivi réel de leurs recrutements.",
    actions:
      "Structuration complète du process de recrutement sur Welcome to the Jungle : refonte des offres, des messages candidats à chaque étape (accusé de réception compris), et accompagnement des managers sur la prise en main de l'outil et le suivi de leurs recrutements.",
    result:
      "Une **expérience candidat cohérente** du premier message à la signature, une entreprise enfin visible et attractive, et des managers autonomes et actifs dans le suivi de leurs recrutements.",
    sector: "Conseil & formation • Recrutement",
    period_label: "2 ans",
    offer_scopes: ["audit-rh"],
    show_on_home: false,
  },
  {
    title: "Remplacer le badge-PC-pizza par un vrai parcours d'intégration",
    summary: "Des arrivées non préparées, un onboarding réduit à sa plus simple expression.",
    situation:
      "L'intégration se résumait à la remise d'un badge, d'un PC et d'une pizza le premier midi. Les arrivées n'étaient préparées ni côté RH ni côté manager, ce qui provoquait des pertes de repères, voire des départs précoces.",
    actions:
      "Refonte complète du parcours : préparation de l'arrivée en amont côté RH et côté manager, une heure de présentation de l'entreprise et de l'intranet (entièrement conçu sur SharePoint/Viva Connections), puis une journée d'intégration avec des ateliers créés sur mesure et des interventions de collaborateurs, pas seulement de dirigeants, pour partager leur vision du poste et de l'entreprise.",
    result:
      "Des nouveaux arrivants **réellement préparés et accueillis**, moins de sentiment d'être livrés à eux-mêmes, et une intégration qui donne à voir l'entreprise dès le premier jour plutôt que de se limiter à l'administratif.",
    sector: "Conseil & formation • Intégration",
    period_label: "2 ans",
    offer_scopes: ["audit-rh"],
    show_on_home: false,
  },
  {
    title: "Donner du sens aux entretiens avant de demander aux managers de les mener",
    summary: "Des managers jamais formés à l'outil ni au sens des entretiens.",
    situation:
      "Les managers n'avaient jamais reçu d'explication sur le logiciel d'entretiens, ce qui générait des erreurs de saisie. Personne ne leur avait expliqué l'intérêt de chaque type d'entretien ni comment les adapter aux situations. Résultat : des entretiens sans sens pour les collaborateurs comme pour les managers, jamais exploités, sans lien avec le plan de développement des compétences ni les évolutions de poste. Aucune pratique de feedback ni de suivi régulier.",
    actions:
      "Accompagnement complet de la ligne managériale : prise en main de l'outil, explication du sens et de l'usage de chaque type d'entretien, méthodes de feedback et de suivi, et connexion directe entre ce qui remonte en entretien et le plan de développement des compétences.",
    result:
      "Des managers qui comprennent enfin **pourquoi** ils mènent chaque entretien et savent l'adapter à la situation, et des entretiens qui redeviennent exploitables plutôt que classés sans suite.",
    sector: "Conseil & formation • Management",
    period_label: "1 an",
    offer_scopes: ["audit-rh"],
    show_on_home: false,
  },
] as const;

/** Cas concrets de la page **De l'Expert au Manager** (mail n° 2). Même règle. */
export const run17ManagerCaseStudies = [
  {
    title: "Accompagner du conseiller au directeur général, avec la même exigence",
    summary:
      "Des profils très différents, un même besoin : progresser avec des mises en situation réelles.",
    situation:
      "En tant que formatrice coach experte (niveaux 1 et 2) pendant plusieurs années dans le secteur bancaire, j'ai accompagné des profils très variés : conseillers, responsables conseillers pro, directeurs d'agence, directeurs généraux, formateurs et formateurs de formateurs. Des enjeux différents à chaque niveau, mais un même besoin : passer de la théorie à une vraie pratique.",
    actions:
      "Des formations suivies de coaching individuel : mise en situation, débriefing à chaud, et remise d'une cartographie des compétences par rapport à celles à atteindre, pour que chacun voie précisément son point de départ et son objectif.",
    result:
      "Des professionnels qui repartent avec un **plan d'action concret** plutôt qu'une méthode théorique, et une légitimité à intervenir à tous les niveaux d'une organisation, du conseiller au comité de direction.",
    sector: "Secteur client : banque • Formatrice coach experte",
    period_label: "3 ans",
    offer_scopes: ["de-l-expert-au-manager"],
    show_on_home: false,
  },
  {
    title:
      "Construire des parcours managers pensés pour changer une pratique, pas remplir un catalogue",
    summary:
      "Concevoir un parcours de A à Z, objectifs à l'appui, plutôt que d'acheter une formation sur étagère.",
    situation:
      "En tant que Responsable Développement RH, j'ai eu la responsabilité de concevoir l'ingénierie pédagogique complète des parcours internes destinés aux managers, sur plusieurs thématiques, dont un parcours dédié au feedback.",
    actions:
      "Pour chaque parcours : définition des objectifs opérationnels et pédagogiques, construction d'un canevas de cohérence pédagogique, création de personas représentatifs des participants, et rédaction d'un synopsis détaillé du déroulé.",
    result:
      "Des parcours **conçus sur mesure** pour répondre à un enjeu métier précis, plutôt que des formations génériques choisies dans un catalogue.",
    sector: "Conseil & formation • Responsable développement RH",
    period_label: "2 ans",
    offer_scopes: ["de-l-expert-au-manager"],
    show_on_home: false,
  },
  {
    title: "Ne pas s'arrêter à la satisfaction à chaud",
    summary:
      "Mesurer ce qu'une formation change vraiment dans les pratiques, pas seulement si elle a plu.",
    situation:
      "La plupart des dispositifs de formation s'arrêtent à un questionnaire de satisfaction à chaud : les participants ont-ils apprécié la session ? Cette mesure ne dit rien de ce qui change réellement dans leurs pratiques au quotidien.",
    actions:
      "Structuration qualité (Qualiopi) des actions du plan de développement des compétences, avec un suivi qui va au-delà du « à chaud » : évaluation des mises en pratique réelles, dans la durée.",
    result:
      "Une vision claire de ce qu'une formation **change concrètement sur le terrain**, pas seulement si elle a été appréciée le jour J.",
    sector: "Conseil & formation • Responsable développement RH",
    period_label: "",
    offer_scopes: ["de-l-expert-au-manager"],
    show_on_home: false,
  },
] as const;

/** Les sept cas du lot, dans l'ordre des deux mails (= ordre du carrousel). */
export const run17CaseStudies = [...run17AuditCaseStudies, ...run17ManagerCaseStudies];

/**
 * Hub Particuliers (mail n° 3) — les deux cartes situation reçoivent le pied de
 * carte du hub organisations : 2e encadré au libellé libre, puis investissement et
 * format juste au-dessus du bouton.
 *
 * Le corps de l'encadré suit son intitulé à l'affichage (« Ce que ça vous évite :
 * vous arrêtez de… ») : d'où la minuscule initiale, voulue.
 *
 * Prix et format sont saisis ICI parce que les montants du mail ne sont pas ceux
 * des fiches d'offre (« Sur demande », « À partir de 600 € TTC »). Vidés un jour
 * dans l'admin, ils retomberont automatiquement sur la fiche d'offre liée.
 */
export const run17B2cHub = {
  situation_a_takeaway_label: "Ce que ça vous évite",
  situation_a_takeaway_body:
    "vous arrêtez de tourner en rond entre plusieurs options qui se ressemblent toutes de loin, et vous arrêtez de risquer une reconversion qui reproduirait le même problème sous une autre forme. J'ai accompagné Aurélie, cadre depuis 15 ans, qui arrivait en disant « je ne me reconnais plus dans mon poste, mais je ne sais pas si c'est le métier ou l'entreprise le problème ». Trois séances plus tard, elle avait compris que ce n'était ni l'un ni l'autre : c'était l'absence de lien direct avec le terrain dans son quotidien. Elle est repartie avec un projet de reconversion vers un métier d'accompagnement et un plan de formation ciblé.",
  situation_a_price: "900 €",
  situation_a_duration: "6 séances d'1h — accompagnement sur 1 à 3 mois",
  situation_b_takeaway_label: "Ce que ça vous évite",
  situation_b_takeaway_body:
    "vous arrêtez d'envoyer des dizaines de candidatures sans retour et de douter de votre valeur à chaque silence radio. J'ai accompagné Thomas, en recherche depuis 8 mois, qui envoyait 15 candidatures par semaine sans retour. Le problème n'était pas son profil : son CV parlait de ses missions, jamais de ses résultats, et il visait des postes trop larges pour se démarquer. En 4 séances, CV et LinkedIn retravaillés, ciblage resserré sur 3 types de postes précis, entretiens préparés : premier entretien décroché en 3 semaines.",
  situation_b_price: "600 €",
  situation_b_duration: "4 séances d'1h — accompagnement sur 1 à 2 mois",
} as const;

/**
 * Blocs « constat » retirés au run 17, au profit de la preuve par l'exemple. Le CMS
 * garde les champs (le bootstrap ne supprime jamais rien) mais la page ne les lit
 * plus dès qu'ils sont vides ; le script affiche leur texte en clair avant de les
 * vider, pour qu'Éléonore le récupère si elle veut le réinjecter ailleurs.
 */
export const run17RetiredOfferContext = {
  slugs: ["audit-rh", "de-l-expert-au-manager"],
  fields: ["context_title", "context_items", "context_conclusion"],
} as const;
