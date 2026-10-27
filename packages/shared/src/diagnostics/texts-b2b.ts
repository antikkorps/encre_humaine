import type { DiagnosticTexts } from "./texts.ts";

const YES_NO = ["Oui", "En partie", "Non"];

/**
 * Textes de référence du diagnostic B2B — cahier des charges d'Éléonore v1.0
 * (§4, §5). Éléonore les ajuste dans Directus ; ceux-ci servent de semence et
 * de repli. Descriptions d'offre : prototype joint au cahier des charges.
 */
export const B2B_TEXTS: DiagnosticTexts = {
  title: "Où en sont vos RH, vraiment ?",
  intro:
    "12 questions, environ 4 minutes, pour savoir où vous en êtes et par quoi commencer. Pas de contrôle, pas de bonne ou de mauvaise réponse.",
  ctaLabel: "Réserver 30 minutes pour en parler",
  levels: { low: "Des bases à poser", mid: "En structuration", high: "Une base solide" },
  themes: { A: "Structuration RH", B: "Compétences et GEPP", C: "Management" },
  questions: {
    profile: { label: "Votre profil", options: ["Dirigeant·e", "DRH – Responsable RH", "Autre"] },
    size: {
      label: "Taille de votre entreprise",
      options: [
        "Moins de 10 salariés",
        "10 à 19",
        "20 à 49",
        "50 à 149",
        "150 à 300",
        "Plus de 300",
      ],
    },
    a_practices: {
      label:
        "Vos pratiques RH (recrutement, intégration, formation, entretiens) sont écrites et connues de vos managers.",
      variant:
        "Vos pratiques RH (recrutement, intégration, formation, entretiens) sont formalisées dans des procédures partagées avec les managers.",
      options: YES_NO,
      tip: "Listez vos 4 pratiques RH clés et vérifiez, en une page chacune, qui fait quoi et quand. Ce qui n’est pas écrit n’est pas partagé.",
    },
    a_onboarding: {
      label: "Le premier jour d’un nouvel arrivant, ça ressemble à quoi ?",
      options: [
        "Un parcours préparé en amont, côté RH et côté manager",
        "Un accueil chaleureux, mais chacun improvise",
        "Un badge, un PC, et on verra la suite",
      ],
      tip: "Préparez une trame d’arrivée d’une page : ce qui est prêt avant le jour J, la première semaine, qui accueille. Les départs précoces se jouent souvent là.",
    },
    a_indicators: {
      label:
        "Vous suivez quelques indicateurs RH (turnover, absentéisme, budget formation) pour décider, pas seulement pour rendre des comptes.",
      variant:
        "Vous avez une vision chiffrée de vos RH (départs, absences, budget formation) quand vous prenez une décision.",
      options: YES_NO,
      tip: "Choisissez 3 indicateurs seulement et regardez-les chaque trimestre. Trois chiffres suivis valent mieux que vingt jamais ouverts.",
    },
    b_key_person: {
      label: "Si une personne clé quittait l’entreprise demain…",
      options: [
        "On sait précisément ce qu’on perdrait et comment on le compenserait",
        "On a une idée, mais rien n’est formalisé",
        "On le découvrirait le jour même",
      ],
      tip: "Listez les 5 compétences sans lesquelles une activité s’arrête, et qui les détient. Si la réponse est « une seule personne », vous tenez votre premier risque.",
    },
    b_reviews: {
      label:
        "Ce qui remonte des entretiens professionnels (envies d’évolution, besoins de formation) alimente réellement votre plan de formation.",
      variant:
        "Les entretiens avec vos collaborateurs débouchent sur des décisions de formation ou d’évolution.",
      options: YES_NO,
      tip: "Ajoutez une question à vos trames d’entretien (« Quelle compétence vous manquera dans 2 ans ? ») et regroupez les réponses avant de construire votre plan.",
    },
    b_training_plan: {
      label: "Comment votre plan de formation est-il construit ?",
      options: [
        "À partir des postes qui vont évoluer et des compétences dont on aura besoin",
        "Un mélange de demandes individuelles et de besoins identifiés",
        "À partir d’un catalogue et des demandes au fil de l’eau",
      ],
      tip: "Avant de choisir des formations, listez les 3 postes qui vont changer dans les 18 mois. Partez des postes, pas du catalogue.",
    },
    c_support: {
      label:
        "Vos managers ont été accompagnés pour manager (feedback, posture, entretiens), pas seulement nommés pour leur expertise.",
      variant: "Vos managers ont reçu un vrai accompagnement quand ils ont pris leur poste.",
      options: YES_NO,
      tip: "Proposez un temps court et régulier pour s’exercer sur un sujet précis, comme donner un feedback. Un atelier isolé ne change pas les habitudes.",
    },
    c_tension: {
      label: "Une tension apparaît dans une équipe. Que se passe-t-il ?",
      options: [
        "Le manager s’appuie sur un cadre et des repères communs",
        "Il fait de son mieux, seul, selon sa personnalité",
        "Ça remonte à la direction ou aux RH, qui gèrent",
      ],
      tip: "Donnez à vos managers 3 repères simples pour les situations tendues : quand en parler, comment, à qui remonter. Le cadre rassure plus qu’il ne contraint.",
    },
    c_consistency: {
      label: "Les pratiques managériales sont cohérentes d’une équipe à l’autre.",
      options: YES_NO,
      tip: "Comparez comment trois équipes font un point hebdomadaire ou un entretien. Les écarts montrent ce qu’il faut harmoniser en premier.",
    },
    priority: {
      label: "Le sujet le plus pressant dans les 6 mois",
      options: [
        "Croissance et recrutement",
        "Départs ou transmission de compétences",
        "Tensions ou difficultés managériales",
        "Plan de formation et budget",
        "Je ne sais pas encore",
      ],
    },
  },
  offers: {
    audit: {
      name: "Audit RH",
      price: "À partir de 2 000 €, à partir de 2 semaines",
      description:
        "Un point de lucidité sur vos pratiques RH et une feuille de route priorisée sur 6 à 12 mois.",
      url: "/organisations/audit-rh",
    },
    talents: {
      name: "Carte des Talents",
      price: "À partir de 4 000 €, à partir de 4 semaines",
      description:
        "Des compétences visibles, une GEPP sans usine à gaz, un plan de formation aligné sur ce qui arrive.",
      url: "/organisations/carte-des-talents",
    },
    managers: {
      name: "De l’Expert au Manager",
      price: "Sur devis, minimum 2 jours",
      description:
        "Des repères concrets pour vos managers : feedback, situations tendues, entretiens utiles.",
      url: "/organisations/de-l-expert-au-manager",
    },
  },
  messages: {
    global_label: "Score global",
    tips_title: "Vos conseils pour démarrer",
    no_tips: "Rien d’urgent ne ressort de vos réponses.",
    proposal_title: "Ce que je vous propose",
    score_card_title: "Ce que montre votre diagnostic",
    need_card_title: "Pour répondre à votre priorité",
    same_direction: "Votre score et votre priorité pointent dans la même direction.",
    solid_base:
      "Vos bases sont solides. L’échange portera plutôt sur l’optimisation que sur la structuration.",
    priority_recall: "Vous avez indiqué comme priorité : {priorite}.",
    size_small:
      "Mes accompagnements sont plutôt pensés pour des organisations de 20 à 300 personnes. Si vous êtes plus petit·e, on peut quand même échanger 30 minutes pour voir ce qui serait réaliste chez vous.",
    size_large:
      "Mes accompagnements sont plutôt pensés pour des organisations de 20 à 300 personnes. Pour une structure plus grande, on peut échanger 30 minutes pour regarder un périmètre précis, par exemple une direction ou un site.",
    see_examples: "Voir des exemples concrets",
  },
  unlock: {
    title: "Débloquez votre rapport détaillé",
    body: "Conseils personnalisés, offre recommandée et prise de rendez-vous. Une copie vous est envoyée par email.",
    consent:
      "J’accepte de recevoir mon rapport par email, conformément à la politique de confidentialité.",
    newsletter: "Je souhaite aussi recevoir Les Tentacules, la newsletter (facultatif).",
    button: "Débloquer mon rapport",
  },
  emailSubject: "Votre diagnostic : {niveau}",
  // Branchements sur le site (mail d'Éléonore du 2026-10-26).
  promo: {
    title: "Pas sûr d’avoir besoin de ça ?",
    body: "Faites le point en 4 minutes : 12 questions, et un rapport avec des conseils concrets pour savoir par quoi commencer.",
    label: "Faire le diagnostic RH",
    hubLabel: "Faire le point en 4 minutes",
  },
};
