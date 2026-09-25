// Contenu du run 18 (2 mails d'Éléonore du 2026-09-25) — source unique, consommée
// par le seed complet (`seed.ts`) et par le seed ciblé `seed-run18.ts` (instance
// déjà remplie, typiquement la prod).
//
// Le lot étend aux deux offres particuliers la « Preuve par l'exemple » des pages
// organisations (runs 16-17) : même carte, même carrousel, 3 cas par offre.
//
// Convention `**…**` : gras doré à l'affichage (cf. apps/web/utils/accent.ts).

/**
 * Cas concrets de la page **Clarifier son projet** (mail n° 1). La 1re ligne du
 * mail (« Reconversion • 6 séances ») se répartit entre `sector` et
 * `period_label`, comme pour les cas organisations.
 *
 * `show_on_home: false` : écrits pour une page d'offre, ils ne s'invitent pas
 * dans le carrousel de l'accueil (cf. run 17).
 */
export const run18ClarifierCaseStudies = [
  {
    title: "Sortir d'un poste qui n'a plus de sens sans se tromper de cible",
    summary:
      "Vingt ans de carrière RH, une réussite visible de l'extérieur, et une usure quotidienne qu'elle n'arrivait pas à nommer.",
    situation:
      "Responsable RH depuis deux décennies, elle ne se reconnaissait plus dans son poste sans savoir si le problème venait de la fonction, de l'entreprise, ou d'elle-même. Elle avait déjà envisagé de démissionner « pour voir », sans direction précise derrière.",
    actions:
      "Diagnostic approfondi du parcours : ce qui avait motivé chaque choix professionnel, ce qui l'épuisait réellement au quotidien, ce qu'elle voulait retrouver. Mise en évidence que ce n'était pas la fonction RH qui posait problème, mais l'absence de contact direct avec les personnes accompagnées. Exploration de 2 pistes concrètes de métiers de l'accompagnement à partir de ce constat.",
    result:
      "Un **projet de reconversion clair**, formulé et assumé en 6 séances, avec un plan de formation ciblé pour l'engager — plutôt qu'une démission « pour voir » sans filet.",
    sector: "Reconversion",
    period_label: "6 séances",
    offer_scopes: ["clarifier-son-projet"],
    show_on_home: false,
  },
  {
    title: "Rebondir après un licenciement sans reproduire la même erreur",
    summary:
      "Douze ans dans la même entreprise, un licenciement économique, et le réflexe de repartir vite sur « la même chose » par peur du trou dans le CV.",
    situation:
      "Après une rupture professionnelle, l'urgence ressentie poussait à retourner rapidement vers un poste identique, sans avoir vérifié si ce poste avait vraiment été le bon choix les douze années précédentes ou simplement une option jamais remise en question.",
    actions:
      "Diagnostic du parcours pour distinguer ce qui relevait de la fonction et ce qui relevait de l'environnement de travail. Identification des compétences réellement transférables et des contraintes concrètes (financières, familiales, géographiques). Construction de 3 scénarios réalistes avant de relancer la recherche.",
    result:
      "Une recherche relancée sur un **poste choisi, pas subi** par défaut — avec une direction assumée, construite en 2 mois plutôt qu'imposée par l'urgence financière.",
    sector: "Rupture professionnelle",
    period_label: "2 mois",
    offer_scopes: ["clarifier-son-projet"],
    show_on_home: false,
  },
  {
    title: "Poser une direction avant de multiplier les faux départs",
    summary:
      "Trois ans d'expérience, un premier poste qui ne correspondait déjà plus à ses envies, et la peur de « se tromper encore ».",
    situation:
      "Après un premier poste choisi un peu par défaut en sortie d'études, l'envie de changer était là depuis plusieurs mois, mais chaque piste envisagée (formation courte, VAE, changement de secteur) était abandonnée aussi vite qu'envisagée, par peur de se tromper une deuxième fois.",
    actions:
      "Relecture du parcours pour identifier ce qui avait réellement motivé l'orientation initiale et ce qui avait changé depuis. Clarification des critères de choix (pas uniquement le salaire ou la sécurité). Mise à l'épreuve de 2 pistes via des échanges avec des professionnels du secteur, pour sortir de la seule réflexion théorique.",
    result:
      "Une **direction posée et un premier pas concret** engagé (candidature à une formation courte) en 6 séances, là où plusieurs mois de réflexion seule n'avaient débouché sur rien.",
    sector: "Questionnement professionnel",
    period_label: "6 séances",
    offer_scopes: ["clarifier-son-projet"],
    show_on_home: false,
  },
] as const;

/** Cas concrets de la page **Se (re)positionner** (mail n° 2). Même règle. */
export const run18RepositionnerCaseStudies = [
  {
    title: "Rendre un profil solide enfin lisible pour les recruteurs",
    summary: "Quinze candidatures par semaine, huit mois de recherche, et quasiment aucun retour.",
    situation:
      "Un profil solide sur le papier — quinze ans d'expérience, des responsabilités croissantes — mais un CV qui listait des missions sans jamais montrer de résultats, et un ciblage trop large pour se démarquer sur un marché saturé.",
    actions:
      "Repositionnement complet du CV autour des résultats obtenus plutôt que des tâches réalisées. Resserrage du ciblage sur 3 types de postes précis, identifiés à partir d'une lecture du marché plutôt que d'intitulés génériques. Retravail du profil LinkedIn et préparation aux entretiens, notamment sur la manière de justifier un profil senior sans paraître « trop cher » ou « trop qualifié ».",
    result:
      "**Premier entretien décroché en 3 semaines**, après 8 mois de silence complet — sur un poste correspondant réellement au niveau de responsabilité recherché.",
    sector: "Recherche d'emploi",
    period_label: "4 séances",
    offer_scopes: ["se-repositionner"],
    show_on_home: false,
  },
  {
    title: "Reprendre une recherche après plusieurs années hors du marché",
    summary:
      "Trois ans d'arrêt pour raisons familiales, et le sentiment de ne plus savoir comment se présenter face à un recruteur.",
    situation:
      "Une pause professionnelle de plusieurs années, perçue comme un trou dans le CV plutôt que comme une période à valoriser, freinait toute reprise de recherche : peur d'être écartée d'office, sentiment d'être « dépassée » sur les codes actuels du marché.",
    actions:
      "Travail sur la manière de présenter cette période comme une continuité de compétences plutôt qu'une coupure (engagement associatif, veille, compétences maintenues). Reconstruction du pitch et du CV. Mise à jour des codes actuels du marché : mots-clés recruteurs, attentes en entretien, usages LinkedIn.",
    result:
      "Une candidature reprise **avec confiance** plutôt qu'en s'excusant de la pause, et des entretiens obtenus dès les premières semaines de recherche active.",
    sector: "Reprise après une pause",
    period_label: "2 mois",
    offer_scopes: ["se-repositionner"],
    show_on_home: false,
  },
  {
    title: "Traduire un parcours atypique pour qu'il devienne un atout",
    summary:
      "Dix ans dans le secteur bancaire, un projet de reconversion vers un métier de l'accompagnement, et des candidatures qui n'obtenaient aucune réponse.",
    situation:
      "Un parcours perçu comme « hors sujet » par les recruteurs malgré des compétences réellement transférables (relation client, gestion de la complexité, pédagogie), parce que le CV mettait en avant les intitulés de postes bancaires plutôt que ce qui, dans ce parcours, servait directement le nouveau projet.",
    actions:
      "Identification précise des compétences transférables entre les deux secteurs. Reformulation complète du CV et du pitch autour de ces compétences plutôt que de l'historique des postes. Ciblage des structures réellement ouvertes aux profils en reconversion.",
    result:
      "Un parcours bancaire devenu un **différenciant assumé** plutôt qu'un frein, avec des entretiens obtenus sur des postes correspondant au nouveau projet professionnel.",
    sector: "Changement de secteur",
    period_label: "4 séances",
    offer_scopes: ["se-repositionner"],
    show_on_home: false,
  },
] as const;

/** Les six cas du lot, dans l'ordre des deux mails (= ordre des carrousels). */
export const run18CaseStudies = [...run18ClarifierCaseStudies, ...run18RepositionnerCaseStudies];
