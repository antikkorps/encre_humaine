// Contenu éditorial de la page d'accueil (copie d'Éléonore) — source unique,
// consommée par `seed.ts` (seed complet) et `seed-home.ts` (seed ciblé home).
// N'inclut PAS `featured_testimonial` : c'est une relation vers un ID de
// témoignage, câblée à l'exécution par le seed complet (le seed ciblé n'y touche pas).

/** Champs `home_page` (hors `featured_testimonial` + SEO géré à part). */
export const homePageContent = {
  // Hero
  hero_title: "Quand votre organisation grandit, vos pratiques RH doivent suivre.",
  hero_subtitle:
    "J'aide les PME à structurer leurs compétences, leurs parcours et leurs pratiques RH pour accompagner durablement leur développement.",
  hero_signature:
    "Une organisation avance mieux lorsque ses pratiques RH et ses réalités humaines vont dans le même sens.",
  hero_tagline: ["Audit RH", "GEPP", "Plan de développement des compétences", "Management"],
  hero_proofs: [
    "10+ ans d'expérience",
    "Insertion professionnelle, formation et RH",
    "Intervention partout en France",
  ],
  hero_cta_primary_label: "Prendre rendez-vous",
  hero_cta_secondary_label: "Découvrir l'approche",
  // Problème : vous vous reconnaissez ?
  recognition_title: "Vous savez qu'il faut structurer. Mais par où commencer ?",
  recognition_items: [
    { text: "Vos managers ont des responsabilités mais peu de repères" },
    { text: "Les compétences ne sont pas clairement identifiées" },
    { text: "Les entretiens professionnels existent mais n'apportent pas grand-chose" },
    { text: "Vous recrutez mais les parcours restent flous" },
    { text: "Vos pratiques RH n'ont pas suivi votre croissance" },
    { text: "Vous manquez de temps pour prendre du recul" },
  ],
  recognition_conclusion:
    "Vous n'avez pas forcément besoin d'un RH à temps plein.\nVous avez besoin de visibilité, de méthode et d'un plan d'action adapté à votre réalité.",
  // Promesse / Offre
  build_title: "Des RH plus claires. Des managers mieux équipés. Des équipes qui avancent.",
  build_blocks: [
    {
      title: "Audit & feuille de route RH",
      body: "Faire le point sur vos pratiques actuelles et identifier les priorités les plus utiles pour votre organisation.",
    },
    {
      title: "Compétences & parcours",
      body: "Cartographier les compétences, structurer votre GEPP et construire un plan de développement cohérent.",
    },
    {
      title: "Managers & équipes",
      body: "Donner à vos managers les outils, les repères et la posture nécessaires pour accompagner leurs équipes.",
    },
  ],
  build_cta_label: "Explorer",
  build_cta_url: "/organisations",
  // Méthode
  method_title: "Pas de solution catalogue. Pas de diagnostic générique.",
  method_steps: [
    {
      title: "Comprendre",
      body: "J'écoute, j'observe et j'analyse votre contexte avant toute recommandation.",
    },
    {
      title: "Structurer",
      body: "Nous construisons ensemble des solutions adaptées à votre réalité.",
    },
    { title: "Transmettre", body: "Je crée des outils simples, utilisables et durables." },
    {
      title: "Ancrer",
      body: "Je reste disponible pour m'assurer que les changements prennent réellement vie.",
    },
  ],
  // Signature / Positionnement
  why_title: "Une approche à la croisée de trois expertises.",
  why_items: [
    {
      title: "Insertion professionnelle",
      body: "Comprendre les parcours, les transitions et les dynamiques humaines.",
    },
    {
      title: "Formation",
      body: "Concevoir des dispositifs qui développent réellement les compétences.",
    },
    {
      title: "Conseil RH",
      body: "Structurer les organisations avec des outils adaptés au terrain.",
    },
  ],
  why_conclusion:
    "Cette double vision des organisations et des parcours me permet d'agir à la fois sur les systèmes et sur les personnes qui les font vivre.",
  // À propos
  intro_title: "Je suis Eléonore Morée.",
  intro_text:
    "Depuis plus de 10 ans, j'accompagne des personnes, des managers et des organisations confrontés à la même difficulté : avancer sans toujours savoir où aller.\n\nJ'ai travaillé dans l'insertion professionnelle, la formation et les RH. J'ai accompagné des demandeurs d'emploi, piloté des dispositifs de formation, construit des plans de développement des compétences et participé à la structuration RH d'organisations en transformation.\n\nAujourd'hui, avec L'Encre Humaine, j'aide les organisations à remettre de la clarté là où les pratiques, les compétences ou les parcours en manquent.",
  intro_cta_label: "Découvrir mon parcours",
  // Particuliers
  b2c_section_title: "Vous traversez une transition professionnelle ?",
  b2c_section_text:
    "Questionnement, reconversion, perte de sens, recherche d'emploi : je vous accompagne pour clarifier votre direction et avancer avec confiance.",
  b2c_cards: [
    {
      title: "Clarifier & avancer",
      body: "Faire le point et construire un projet professionnel réaliste.",
    },
    { title: "Booster sa recherche", body: "CV, LinkedIn, entretiens et stratégie de recherche." },
  ],
  b2c_cta_label: "Découvrir les accompagnements",
  // Ressources
  resources_title: "Réflexions, outils et retours de terrain.",
  resources_cta_label: "Voir toutes les ressources",
  // CTA final
  final_cta_title: "Et si on en parlait ?",
  final_cta_description:
    "Un premier échange sans engagement pour voir où vous en êtes et par où commencer.",
  final_cta_label: "Prendre rendez-vous",
} as const;
