import type { DiagnosticTexts } from "./texts.ts";

const YES_NO = ["Oui", "En partie", "Non"];

/**
 * Textes de référence du diagnostic B2C — cahier des charges d'Éléonore v1.0
 * (§6, §7). Les thèmes sont nommés par parcours (`direction_A`…) : le même
 * score A ne mesure pas la même chose selon le chemin choisi en Q2.
 */
export const B2C_TEXTS: DiagnosticTexts = {
  title: "Où en est votre projet professionnel ?",
  intro:
    "12 questions, environ 4 minutes, pour voir si vous avez surtout besoin de clarifier votre direction ou de rendre votre recherche plus lisible. Il n’y a pas de bonne réponse.",
  ctaLabel: "Réserver ma séance découverte offerte",
  levels: { low: "À construire", mid: "En progrès", high: "Solide" },
  themes: {
    direction_A: "Clarté du projet",
    direction_B: "Mise en mouvement",
    position_A: "Clarté du poste visé",
    position_B: "Lisibilité de la recherche",
  },
  questions: {
    situation: {
      label: "Votre situation actuelle",
      options: [
        "En poste",
        "En recherche d’emploi",
        "Après un licenciement ou une rupture",
        "En pause (famille, santé, autre)",
        "En reconversion",
      ],
    },
    orientation: {
      label: "Où en êtes-vous aujourd’hui ?",
      options: ["Je cherche encore ma direction", "J’ai une direction, je cherche un poste"],
    },
    difficulty: {
      label: "En ce moment, votre difficulté est surtout…",
      options: [
        "Professionnelle",
        "À la fois professionnelle et personnelle, mais je me sens en capacité d’avancer",
        "Je traverse une période très difficile sur le plan personnel",
      ],
    },
    d_one_sentence: {
      label: "Je peux dire en une phrase ce que je veux faire d’ici 2 ans.",
      options: YES_NO,
      tip: "Écrivez trois phrases qui commencent par « Dans 2 ans, j’aimerais… ». Ce qui revient dans les trois est probablement un début de direction.",
    },
    d_drivers: {
      label: "Quand vous pensez à l’envie de changer, ce qui la nourrit, c’est…",
      options: [
        "Des éléments précis que je sais nommer",
        "Un mélange de choses, difficiles à démêler",
        "Un malaise diffus, sans explication claire",
      ],
      tip: "Notez pendant une semaine ce qui vous donne de l’énergie et ce qui vous en prend. Distinguer la fonction, l’équipe et l’environnement change souvent la lecture.",
    },
    d_skills: {
      label:
        "Je sais quelles compétences je peux transférer vers un autre poste ou un autre secteur.",
      options: YES_NO,
      tip: "Prenez 3 réussites professionnelles et listez ce que vous avez réellement fait pour y arriver. Vos compétences transférables sont dans les verbes, pas dans les intitulés de poste.",
    },
    d_values: {
      label:
        "Je sais ce qui compte vraiment pour moi dans mon travail (valeurs, rythme, type de mission).",
      options: YES_NO,
      tip: "Notez 5 moments de travail où vous étiez pleinement à votre place et ce qu’ils avaient en commun. Ce sont vos critères, pas ceux du marché.",
    },
    d_constraints: {
      label:
        "Mes réflexions tiennent compte de mes contraintes réelles (finances, famille, mobilité).",
      options: YES_NO,
      tip: "Listez vos contraintes non négociables et celles qui le sont peut-être. Un projet qui les ignore ne tient pas ; un projet qui les respecte toutes est souvent trop étroit.",
    },
    d_options: {
      label: "Sur la suite, vous avez…",
      options: [
        "Deux pistes réalistes que j’ai commencé à explorer",
        "Plusieurs idées, mais aucune vraiment creusée",
        "Aucune idée, ou une seule que j’abandonne aussitôt",
      ],
      tip: "Choisissez une piste et testez-la par une conversation avec une personne qui exerce ce métier. Une réflexion seule tourne vite en rond.",
    },
    d_tested: {
      label: "Avez-vous déjà testé une piste sur le terrain (conversation, immersion, essai) ?",
      options: [
        "Oui, j’ai échangé avec des personnes du métier ou fait un essai",
        "J’y pense, mais je n’ai pas encore osé",
        "Non, je réfléchis surtout seul·e",
      ],
      tip: "Prenez rendez-vous avec une personne qui exerce un métier qui vous attire et posez-lui 3 questions sur son quotidien. C’est le test le moins cher et le plus instructif.",
    },
    d_support: {
      label: "J’ai parlé de ma réflexion à des personnes de confiance, qui m’aident à avancer.",
      options: YES_NO,
      tip: "Choisissez deux personnes de confiance et partagez-leur ce que vous explorez. Dire un projet à voix haute le rend plus clair.",
    },
    d_funding: {
      label:
        "Je sais comment je pourrais financer une formation ou une transition (CPF, employeur, épargne, droits).",
      options: YES_NO,
      tip: "Listez vos droits et sources de financement possibles (CPF, projet de transition, employeur, France Travail) avant d’écarter une piste pour des raisons de budget.",
    },
    p_target: {
      label: "Je peux dire en une phrase le type de poste que je cherche.",
      options: YES_NO,
      tip: "Écrivez en une phrase le poste, le secteur et le type de structure visés. Si vous n’y arrivez pas, c’est le premier chantier.",
    },
    p_proof: {
      label: "Je sais quelles compétences et quelles réussites mettre en avant pour ces postes.",
      options: YES_NO,
      tip: "Pour 3 offres qui vous intéressent, soulignez ce qu’elles demandent et notez votre meilleure preuve pour chacune.",
    },
    p_constraints: {
      label:
        "Mes critères de poste tiennent compte de mes contraintes réelles (finances, famille, mobilité).",
      options: YES_NO,
      tip: "Listez vos contraintes non négociables et celles qui le sont peut-être. Un critère qui les ignore ne tient pas ; un critère qui les respecte toutes est souvent trop étroit.",
    },
    p_cv: {
      label: "Mon CV met en avant ce que j’ai obtenu, pas seulement ce que j’ai fait.",
      options: YES_NO,
      tip: "Reprenez vos 3 dernières expériences et ajoutez à chaque tâche un résultat concret (chiffre, délai, effet). Un recruteur lit des signaux, pas des descriptions.",
    },
    p_pitch: {
      label: "Un recruteur vous dit « présentez-vous »…",
      options: [
        "Je le fais en 30 secondes, naturellement",
        "Je me débrouille, mais ça change à chaque fois",
        "C’est le moment que je redoute",
      ],
      tip: "Construisez un pitch en 3 temps : ce que vous faites, ce que vous avez prouvé, ce que vous cherchez. Répétez-le à voix haute, pas seulement par écrit.",
    },
    p_linkedin: {
      label: "Mon profil LinkedIn raconte la même histoire que mon CV et mon projet.",
      options: YES_NO,
      tip: "Relisez votre titre et votre résumé LinkedIn comme un recruteur : en 10 secondes, comprend-il ce que vous cherchez ? Sinon, reformulez d’abord ces deux zones.",
    },
    p_targeting: {
      label: "Vos candidatures, c’est plutôt…",
      options: [
        "Quelques postes ciblés, choisis pour une raison précise",
        "Un ciblage assez large, selon les offres que je vois",
        "Je postule partout où ça pourrait coller",
      ],
      tip: "Définissez 3 types de postes précis et laissez le reste de côté pendant un mois. Moins de candidatures, mieux ciblées, produisent plus de réponses.",
    },
    p_followup: {
      label: "Un entretien se termine. Que se passe-t-il ensuite ?",
      options: [
        "Je fais le point sur ce qui a marché et je relance de façon construite",
        "J’attends la réponse en espérant",
        "Je n’en fais pas d’analyse, j’enchaîne",
      ],
      tip: "Après chaque entretien, notez trois choses : ce qui a marché, ce qui a bloqué, et un message de remerciement à envoyer sous 24 h.",
    },
    p_network: {
      label: "Je sollicite mon réseau pour ma recherche, pas seulement les offres publiées.",
      options: YES_NO,
      tip: "Contactez deux personnes par semaine, non pour demander un emploi mais pour demander un conseil sur un métier ou une entreprise. Beaucoup de postes se jouent par recommandation.",
    },
  },
  offers: {
    clarify: {
      name: "Clarifier son projet",
      price: "900 €, 6 séances d’1 h en visioconférence",
      description:
        "Passer du brouillard à une direction : relire votre parcours, explorer des pistes réalistes, poser un plan d’action.",
      url: "/particuliers/clarifier-son-projet",
    },
    reposition: {
      name: "Se (re)positionner",
      price: "600 €, 4 séances d’1 h en visioconférence",
      description:
        "Rendre votre profil lisible : CV, LinkedIn, pitch, stratégie de recherche et préparation aux entretiens.",
      url: "/particuliers/se-repositionner",
    },
  },
  messages: {
    tips_title: "Vos conseils pour avancer",
    no_tips: "Rien d’urgent ne ressort de vos réponses.",
    proposal_title: "Ce que je vous propose",
    see_examples: "Voir des exemples concrets",
    need_direction:
      "Avant d’optimiser votre recherche, il faut une direction. Sinon, vous ferez plus d’efforts pour peu de résultats.",
    direction_emerging:
      "Votre direction se dessine bien. L’étape suivante est de la rendre visible et lisible pour les recruteurs.",
    course_set: "Votre cap est posé. Il reste à le rendre visible et lisible pour les recruteurs.",
    well_advanced: "Vous êtes bien avancé·e. Un échange peut aider à accélérer ou à ajuster.",
    rupture:
      "Après une rupture, l’urgence pousse souvent à repartir vite sur la même chose : une direction choisie vaut mieux qu’une direction subie.",
    care_title: "Merci de votre franchise",
    care_body:
      "Quand on traverse une période difficile, la première étape est souvent d’en parler à un professionnel de santé, médecin traitant ou psychologue. Mon accompagnement n’est pas thérapeutique, mais vous pouvez revenir quand vous vous sentirez prêt·e. Si vous le souhaitez, vous pouvez continuer le questionnaire.",
    care_continue: "Continuer le questionnaire",
    care_later: "Je reviendrai plus tard",
    share_label: "Partager mon résultat",
    share_text: "J’ai fait le point sur mon projet professionnel en 4 minutes. À tester :",
  },
  unlock: {
    title: "Débloquez votre rapport détaillé",
    body: "Conseils personnalisés, offre recommandée et prise de rendez-vous. Une copie vous est envoyée par email.",
    consent:
      "J’accepte de recevoir mon rapport par email, conformément à la politique de confidentialité.",
    newsletter: "Je souhaite aussi recevoir Les Tentacules, la newsletter (facultatif).",
    button: "Débloquer mon rapport",
  },
  emailSubject: "Votre point sur votre projet professionnel",
};
