// Seed de contenu DÉMO (français plausible) — pour travailler la mise en page.
// Idempotent : upsert par clé naturelle (slug/nom/question), re-jouable à volonté.
// Ce N'EST PAS du contenu de production : remplaçable via le back-office Directus.
//
//   pnpm --filter @encre/directus seed     (ou : make cms-seed)
//
// Pré-requis : stack up (make cms-up) + schéma bootstrapé (make cms-bootstrap).
// NB : la boutique (catalogue/fiche) ne s'affiche pas sans prix Stripe actifs —
// les produits sont seedés en éditorial mais resteront masqués tant que Stripe
// n'est pas branché. Aucune image (champs fichier laissés vides : dégradation propre).

import { get, patch, post } from "./api.ts";

type Json = Record<string, unknown>;

/** Upsert d'un item de collection par clé naturelle ; renvoie l'id. Idempotent. */
async function upsert(collection: string, key: string, value: string, data: Json): Promise<string> {
  const found = await get<{ id: string }[]>(
    `/items/${collection}?filter[${key}][_eq]=${encodeURIComponent(value)}&limit=1&fields=id`,
  );
  const payload = { ...data, [key]: value };
  if (found[0]) {
    await patch(`/items/${collection}/${found[0].id}`, payload);
    return found[0].id;
  }
  const created = await post<{ id: string }>(`/items/${collection}`, payload);
  return created.id;
}

/** Met à jour un singleton (PATCH /items/<collection>). */
async function setSingleton(collection: string, data: Json): Promise<void> {
  await patch(`/items/${collection}`, data);
}

const PUB = { status: "published" } as const;
const P = (...paras: string[]) => paras.map((t) => `<p>${t}</p>`).join("");

async function main(): Promise<void> {
  console.log("→ Seed contenu démo (FR)…");

  // ── site_settings ──────────────────────────────────────────────────────────
  await setSingleton("site_settings", {
    brand_name: "L'Encre Humaine",
    tagline: "Conseil RH & accompagnement des parcours professionnels",
    contact_email: "contact@encrehumaine.fr",
    linkedin_url: "https://www.linkedin.com/in/eleonore-moree",
    booking_url: "https://cal.com/eleonore/decouverte",
    location_label: "Bouches-du-Rhône · France entière",
    social_links: [{ platform: "LinkedIn", url: "https://www.linkedin.com/in/eleonore-moree" }],
    legal_name: "Eléonore Morée",
    legal_status: "Micro-entreprise",
    siret: "en cours d'immatriculation", // ⚠️ 1ER AOÛT : numéro SIRET réel
    legal_address: "Bouches-du-Rhône, France",
    vat_mention: "TVA non applicable, art. 293 B du CGI",
    host_info: "Hetzner Online GmbH — Industriestr. 25, 91710 Gunzenhausen, Allemagne",
    default_meta_description:
      "Conseil RH, accompagnement des transitions professionnelles et serious games pour explorer le travail autrement.",
  });

  // ── testimonials (référencés par home/hubs/offres) ──────────────────────────
  const tMarie = await upsert("testimonials", "author_name", "Marie Dupuis", {
    quote:
      "Un regard juste et des recommandations actionnables dès la première semaine. On a enfin structuré nos pratiques RH.",
    author_title: "DRH",
    company: "PME industrielle (120 salariés)",
    audience: "organisation",
    context: "Structuration RH",
    featured: true,
    ...PUB,
  });
  const tSophie = await upsert("testimonials", "author_name", "Sophie Lambert", {
    quote:
      "J'étais perdue dans ma reconversion. En quelques séances, j'ai retrouvé un cap clair et la confiance pour avancer.",
    author_title: "En reconversion",
    audience: "particulier",
    context: "Bilan de parcours",
    featured: false,
    ...PUB,
  });
  await upsert("testimonials", "author_name", "Karim Benali", {
    quote:
      "Un accompagnement managérial concret, sans jargon, qui a vraiment changé nos rituels d'équipe.",
    author_title: "Manager d'équipe",
    company: "Scale-up tech",
    audience: "organisation",
    context: "Accompagnement managers",
    featured: false,
    ...PUB,
  });

  // ── article_categories (3 groupes) ─────────────────────────────────────────
  const cOrg = await upsert("article_categories", "slug", "organisations", {
    name: "Organisations",
    group: "organisations",
  });
  const cPart = await upsert("article_categories", "slug", "particuliers", {
    name: "Particuliers",
    group: "particuliers",
  });
  const cTerrain = await upsert("article_categories", "slug", "terrain", {
    name: "Sur le terrain",
    group: "terrain",
  });

  // ── articles ────────────────────────────────────────────────────────────────
  await upsert("articles", "slug", "structurer-rh-pme", {
    title: "Structurer ses pratiques RH en PME : par où commencer ?",
    excerpt: "Trois leviers concrets pour poser des bases RH solides sans usine à gaz.",
    body: P(
      "En PME, le RH se construit souvent au fil de l'eau. Voici comment reprendre la main.",
      "Premier réflexe : cartographier l'existant avant d'ajouter des process.",
    ),
    category: cOrg,
    reading_time: 6,
    published_at: "2026-05-12",
    ...PUB,
  });
  await upsert("articles", "slug", "reconversion-clarifier-cap", {
    title: "Reconversion : clarifier son cap avant de bouger",
    excerpt:
      "La question n'est pas « quel métier ? » mais « quoi de plus important pour moi maintenant ? ».",
    body: P(
      "On veut souvent une réponse rapide. Le détour par le sens fait gagner du temps ensuite.",
    ),
    category: cPart,
    reading_time: 4,
    published_at: "2026-05-28",
    ...PUB,
  });
  await upsert("articles", "slug", "rituels-equipe-qui-marchent", {
    title: "Les rituels d'équipe qui marchent (et ceux qui épuisent)",
    excerpt: "Retour de terrain sur ce qui crée vraiment de la coopération.",
    body: P("Un bon rituel sert une décision ou un lien. Sinon, c'est une réunion de plus."),
    category: cTerrain,
    reading_time: 5,
    published_at: "2026-06-09",
    ...PUB,
  });

  // ── faq_items (par scope) ───────────────────────────────────────────────────
  const faqs: Array<{ q: string; a: string; scope: string }> = [
    {
      q: "Sous quel délai répondez-vous ?",
      a: P("Sous 48h ouvrées, par email."),
      scope: "contact",
    },
    {
      q: "Proposez-vous un premier échange gratuit ?",
      a: P("Oui, une séance découverte de 30 minutes."),
      scope: "contact",
    },
    {
      q: "Comment se passe un accompagnement individuel ?",
      a: P("En visio ou présentiel, en 4 à 6 séances selon le besoin."),
      scope: "b2c",
    },
    {
      q: "Est-ce adapté si je ne sais pas encore quoi faire ?",
      a: P("C'est même le point de départ idéal : on clarifie ensemble."),
      scope: "b2c",
    },
    {
      q: "Que contient un audit RH ?",
      a: P("Un état des lieux des pratiques, des risques et des priorités d'action."),
      scope: "audit",
    },
    {
      q: "Intervenez-vous partout en France ?",
      a: P("Oui, à distance, et en présentiel dans la région PACA."),
      scope: "general",
    },
  ];
  for (const f of faqs) {
    await upsert("faq_items", "question", f.q, { answer: f.a, scope: f.scope, ...PUB });
  }

  // ── offers (5 documentées) ──────────────────────────────────────────────────
  const offers = [
    {
      slug: "audit-rh",
      audience: "organisation",
      title: "Audit RH",
      icon: "search",
      short_description: "Un état des lieux clair de vos pratiques RH et des priorités d'action.",
      duration_label: "3 à 4 semaines",
      price_label: "1 500 – 2 500 € HT",
      featured_testimonial: tMarie,
    },
    {
      slug: "competences-parcours",
      audience: "organisation",
      title: "Compétences & parcours",
      icon: "route",
      short_description: "Cartographie des compétences et structuration des parcours (GEPP, PDC).",
      duration_label: "6 à 10 semaines",
      price_label: "Sur devis",
      featured_testimonial: tMarie,
    },
    {
      slug: "managers-equipes",
      audience: "organisation",
      title: "Managers & équipes",
      icon: "groups",
      short_description: "Accompagnement managérial concret pour des équipes qui coopèrent.",
      duration_label: "Cycle de 3 mois",
      price_label: "Sur devis",
      featured_testimonial: null,
    },
    {
      slug: "clarifier-avancer",
      audience: "particulier",
      title: "Clarifier & avancer",
      icon: "explore",
      short_description: "Retrouver un cap professionnel clair et un plan d'action réaliste.",
      duration_label: "4 à 6 séances",
      price_label: "À partir de 90 € / séance",
      featured_testimonial: tSophie,
    },
    {
      slug: "booster-recherche",
      audience: "particulier",
      title: "Booster sa recherche",
      icon: "rocket_launch",
      short_description: "CV, posture et stratégie pour une recherche d'emploi efficace.",
      duration_label: "3 à 5 séances",
      price_label: "À partir de 90 € / séance",
      featured_testimonial: null,
    },
  ];
  let sort = 1;
  for (const o of offers) {
    await upsert("offers", "slug", o.slug, {
      title: o.title,
      audience: o.audience,
      icon: o.icon,
      short_description: o.short_description,
      duration_label: o.duration_label,
      price_label: o.price_label,
      price_note: "Acompte de 30 % à la signature. Séance découverte offerte.",
      accroche_title: o.title,
      accroche_body: o.short_description,
      mission_includes: [
        { text: "Un cadrage initial de vos enjeux" },
        { text: "Des livrables actionnables" },
        { text: "Un point de suivi à la fin" },
      ],
      outcomes: [
        { title: "De la clarté", body: "Vous savez quoi faire et dans quel ordre." },
        { title: "De l'autonomie", body: "Des outils que vous gardez après la mission." },
      ],
      audience_fit: [
        { text: "Pour vous si vous voulez du concret" },
        { text: "Pas pour vous si vous cherchez une recette magique" },
      ],
      format_body: P(
        "On démarre par un échange pour cadrer le besoin réel.",
        "Puis on avance par étapes courtes, avec des points réguliers.",
      ),
      featured_testimonial: o.featured_testimonial,
      cta_label: "En discuter",
      sort: sort++,
      ...PUB,
    });
  }

  // ── resources (lead magnets) ────────────────────────────────────────────────
  const rGuide = await upsert("resources", "slug", "guide-7-leviers-rh", {
    title: "Le guide des 7 leviers RH en PME",
    description: "Un guide pratique pour structurer vos pratiques RH sans usine à gaz.",
    requires_email: true,
    audience: "organisation",
    featured: true,
    ...PUB,
  });
  await upsert("resources", "slug", "checklist-entretien-annuel", {
    title: "Checklist de l'entretien annuel utile",
    description: "Une trame simple pour des entretiens qui servent vraiment à quelque chose.",
    requires_email: false,
    audience: "organisation",
    featured: false,
    ...PUB,
  });

  // ── products (éditorial ; masqués en boutique tant que Stripe absent) ────────
  await upsert("products", "slug", "cartes-coop", {
    name: "Cartes Coop",
    tagline: "Un jeu de cartes pour animer la coopération en équipe.",
    description: P("48 cartes pour ouvrir le dialogue et faire émerger les bonnes pratiques."),
    game_details: [
      { label: "Joueurs", value: "3 à 8" },
      { label: "Durée", value: "45 min" },
      { label: "Public", value: "Équipes & managers" },
    ],
    audience: "both",
    featured: true,
    stripe_product_id: "prod_demo_cartes_coop",
    ...PUB,
  });

  // ── Singletons de pages ──────────────────────────────────────────────────────
  await setSingleton("home_page", {
    // Hero
    hero_title: "Quand votre organisation grandit, vos pratiques RH doivent suivre.",
    hero_subtitle:
      "J'aide les PME à structurer leurs compétences, leurs parcours et leurs pratiques RH pour accompagner durablement leur développement.",
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
      {
        title: "Booster sa recherche",
        body: "CV, LinkedIn, entretiens et stratégie de recherche.",
      },
    ],
    b2c_cta_label: "Découvrir les accompagnements",
    // Témoignage vedette (optionnel — masqué si retiré)
    featured_testimonial: tMarie,
    // Ressources
    resources_title: "Réflexions, outils et retours de terrain.",
    resources_cta_label: "Voir toutes les ressources",
    // CTA final
    final_cta_title: "Et si on en parlait ?",
    final_cta_description:
      "Un premier échange sans engagement pour voir où vous en êtes et par où commencer.",
    final_cta_label: "Prendre rendez-vous",
    meta_title: "L'Encre Humaine — Conseil RH & accompagnement des PME",
  });

  await setSingleton("about_page", {
    accroche: "Donner du sens et de la méthode au travail.",
    story_body: P(
      "Après plus de dix ans en RH, j'ai créé L'Encre Humaine pour accompagner autrement.",
      "Mon fil rouge : du concret, de l'écoute, et zéro bullshit.",
    ),
    why_title: "Pourquoi L'Encre Humaine",
    why_body: P("Parce que le travail mérite mieux que des process plaqués."),
    octopus_body: P(
      "Le poulpe ? Huit bras pour faire plein de choses à la fois, et beaucoup d'adaptabilité. 🐙",
    ),
    convictions: [
      { title: "Écoute d'abord", body: "On part du réel, pas d'un modèle." },
      { title: "Du concret", body: "Des livrables utiles, pas des slides." },
      { title: "De l'autonomie", body: "Vous gardez les outils après." },
    ],
    how_i_work: [
      { text: "Cadrer le besoin réel" },
      { text: "Co-construire" },
      { text: "Transmettre" },
    ],
    what_i_dont_do: P("Pas de recette magique, pas de jargon, pas de promesses irréalistes."),
    personal_quote: "Le travail va mieux quand on remet de l'humain au centre.",
    cta_label: "Travaillons ensemble",
    meta_title: "À propos — L'Encre Humaine",
  });

  await setSingleton("org_hub_page", {
    accroche_title: "Pour les organisations",
    accroche_body: "Structurez vos pratiques RH et accompagnez vos équipes, avec méthode.",
    method_steps: [
      { number: 1, title: "Cadrage", description: "On pose le besoin et les objectifs." },
      { number: 2, title: "Diagnostic", description: "État des lieux et priorités." },
      { number: 3, title: "Construction", description: "On bâtit les outils ensemble." },
      { number: 4, title: "Restitution", description: "Plan d'action et transmission." },
    ],
    audience_items: [
      { text: "PME qui structurent leur RH" },
      { text: "Équipes en croissance" },
      { text: "Dirigeants qui veulent du concret" },
    ],
    cta_title: "Travaillons ensemble",
    cta_label: "Prendre rendez-vous",
    meta_title: "Pour les organisations — L'Encre Humaine",
  });

  await setSingleton("b2c_hub_page", {
    accroche_title: "Pour les particuliers",
    accroche_body: "Un accompagnement bienveillant pour clarifier votre cap et avancer.",
    situation_a_title: "Je veux y voir plus clair",
    situation_a_body: "Vous sentez qu'il faut bouger mais ne savez pas vers quoi.",
    situation_a_cta_label: "Clarifier & avancer",
    situation_a_cta_link: "/particuliers/clarifier-avancer",
    situation_b_title: "Je cherche un emploi",
    situation_b_body: "Vous voulez une recherche plus efficace et plus sereine.",
    situation_b_cta_label: "Booster sa recherche",
    situation_b_cta_link: "/particuliers/booster-recherche",
    how_i_work_body: P(
      "On avance à votre rythme, avec des outils simples et des objectifs clairs.",
    ),
    testimonial: tSophie,
    cta_label: "Prendre rendez-vous",
    meta_title: "Pour les particuliers — L'Encre Humaine",
  });

  await setSingleton("resources_page", {
    accroche_title: "Ressources",
    accroche_body:
      "Des guides et des articles pour avancer, côté organisations comme côté particuliers.",
    featured_resource: rGuide,
    meta_title: "Ressources — L'Encre Humaine",
  });

  await setSingleton("newsletter_page", {
    name: "Le Fil",
    promise_body: P(
      "Deux fois par mois, des outils concrets et des retours de terrain. 5 minutes, sans bullshit.",
    ),
    what_you_receive: [
      { text: "Un outil ou une méthode actionnable" },
      { text: "Un retour d'expérience" },
      { text: "Une ressource à télécharger" },
    ],
    welcome_gift_label: rGuide,
    sample_excerpt:
      "Cette semaine : comment transformer l'entretien annuel en vrai moment utile (et pas une corvée).",
    sample_issue_label: "Extrait du Fil #07",
    rgpd_mention: "Double opt-in, désinscription en un clic. Vos données ne sont jamais cédées.",
    meta_title: "La newsletter « Le Fil » — L'Encre Humaine",
  });

  await setSingleton("contact_page", {
    accroche_title: "Travaillons ensemble",
    accroche_body:
      "Une question, un projet, une envie d'en parler ? Écrivez-moi ou réservez un échange.",
    booking_intro: "Réservez une séance découverte de 30 minutes, sans engagement.",
    next_steps: [
      { number: 1, title: "Vous écrivez", description: "Un message ou une réservation." },
      { number: 2, title: "On échange", description: "30 min pour cerner le besoin." },
      { number: 3, title: "Je propose", description: "Une proposition claire et adaptée." },
    ],
    response_time_note: "Je réponds sous 48h ouvrées.",
    meta_title: "Contact — L'Encre Humaine",
  });

  await setSingleton("shop_page", {
    shop_enabled: true,
    title: "La boutique",
    intro: "Des serious games conçus pour explorer, apprendre et coopérer autrement.",
    empty_message: "Les premiers jeux arrivent très bientôt. Revenez vite !",
    meta_title: "Boutique — L'Encre Humaine",
  });

  // ── legal_documents ─────────────────────────────────────────────────────────
  // Bases RÉCONCILIÉES pour la stack réelle (Cal.com / Resend / Umami cookieless /
  // Hetzner / Stripe / Cloudflare R2), achat invité (pas de compte), franchise TVA
  // 293 B, rétractation 14 j sur les jeux physiques.
  // ⚠️ Bases à faire relire par un professionnel avant mise en production.
  //
  // ┌─ 1ER AOÛT (immatriculation micro-entreprise) ─────────────────────────────┐
  // │ Remplacer ces valeurs INTÉRIMAIRES par l'identité réelle, PUIS activer la  │
  // │ boutique (shop_page.shop_enabled = true). Mettre aussi à jour site_settings │
  // │ (siret/legal_address). Jusque-là : vitrine en ligne, boutique désactivée.  │
  // └────────────────────────────────────────────────────────────────────────────┘
  const ID = {
    siret: "en cours d'immatriculation", // → numéro SIRET réel
    address: "Bouches-du-Rhône, France", // → adresse postale complète
    // Médiateur conso : obligatoire dès l'ouverture de la boutique (B2C).
    mediatorSentence: "un médiateur de la consommation sera désigné à l'ouverture de la boutique",
  };
  const legalDocs: { slug: string; title: string; body: string }[] = [
    {
      slug: "mentions-legales",
      title: "Mentions légales",
      body: [
        `<h2>Éditeur du site</h2>`,
        `<p>Le site <a href="https://encrehumaine.fr">encrehumaine.fr</a> est édité par :</p>`,
        `<ul>`,
        `<li><strong>Eléonore Morée</strong>, entrepreneuse individuelle (micro-entreprise) ;</li>`,
        `<li>Adresse : ${ID.address} ;</li>`,
        `<li>SIRET : ${ID.siret} ;</li>`,
        `<li>Courriel : <a href="mailto:contact@encrehumaine.fr">contact@encrehumaine.fr</a> ;</li>`,
        `<li>TVA : TVA non applicable, article 293 B du CGI (franchise en base de TVA).</li>`,
        `</ul>`,
        `<h2>Directrice de la publication</h2>`,
        `<p>Eléonore Morée.</p>`,
        `<h2>Hébergeur</h2>`,
        `<p>Le site est hébergé par <strong>Hetzner Online GmbH</strong>, Industriestr. 25, 91710 Gunzenhausen, Allemagne — <a href="https://www.hetzner.com">hetzner.com</a>.</p>`,
        `<h2>Propriété intellectuelle</h2>`,
        `<p>L'ensemble des contenus du site (textes, illustrations, identité visuelle, serious games et supports associés) est protégé par le droit de la propriété intellectuelle et demeure la propriété exclusive d'Eléonore Morée, sauf mention contraire. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite.</p>`,
        `<h2>Données personnelles et cookies</h2>`,
        `<p>Les traitements de données réalisés via le site sont décrits dans la <a href="/confidentialite">Politique de confidentialité</a>. La mesure d'audience est assurée par Umami, une solution auto-hébergée <strong>sans cookie ni traceur</strong> ; le détail figure dans les <a href="/cgu">Conditions générales d'utilisation</a>.</p>`,
      ].join(""),
    },
    {
      slug: "cgv",
      title: "Conditions générales de vente",
      body: [
        `<h2>1. Objet et champ d'application</h2>`,
        `<p>Les présentes conditions générales de vente (CGV) régissent les ventes conclues sur le site <a href="https://encrehumaine.fr">encrehumaine.fr</a> par Eléonore Morée (ci-après « la Vendeuse ») :</p>`,
        `<ul>`,
        `<li>la vente de <strong>produits physiques</strong> (serious games et supports associés) via la boutique en ligne ;</li>`,
        `<li>la fourniture de <strong>prestations</strong> de conseil RH et d'accompagnement.</li>`,
        `</ul>`,
        `<p>Toute commande ou tout devis accepté implique l'adhésion sans réserve aux présentes CGV. Aucun compte client n'est requis : les achats en boutique se font en mode invité.</p>`,
        `<h2>2. Prix</h2>`,
        `<p>Les prix sont indiqués en euros. <strong>TVA non applicable, article 293 B du CGI</strong> (franchise en base) : les prix sont donc nets, sans TVA. Les éventuels frais de livraison sont indiqués avant la validation de la commande. La Vendeuse se réserve le droit de modifier ses prix à tout moment, le prix applicable étant celui en vigueur au moment de la commande.</p>`,
        `<h2>3. Produits physiques — commande, paiement et livraison</h2>`,
        `<p>La commande est validée après paiement intégral. Le paiement est traité par <strong>Stripe</strong> via une page de paiement sécurisée ; aucune donnée de carte bancaire ne transite ni n'est conservée par la Vendeuse. Une confirmation est adressée par courriel.</p>`,
        `<p>Les produits sont livrés à l'adresse indiquée lors de la commande, dans un délai précisé avant la validation de celle-ci. Les frais de livraison sont indiqués avant paiement.</p>`,
        `<h2>4. Droit de rétractation (produits physiques)</h2>`,
        `<p>Conformément aux articles L.221-18 et suivants du Code de la consommation, le client consommateur dispose d'un délai de <strong>quatorze (14) jours</strong> à compter de la réception du produit pour exercer son droit de rétractation, sans avoir à justifier de motif.</p>`,
        `<p>Pour l'exercer, le client notifie sa décision par courriel à <a href="mailto:contact@encrehumaine.fr">contact@encrehumaine.fr</a> avant l'expiration du délai. Le produit est retourné dans son état d'origine ; les frais de retour restent à la charge du client. Le remboursement intervient dans les quatorze (14) jours suivant la récupération du produit (ou la preuve de son expédition), par le même moyen de paiement.</p>`,
        `<h2>5. Garanties légales</h2>`,
        `<p>Tous les produits bénéficient de la garantie légale de conformité (art. L.217-3 et s. du Code de la consommation) et de la garantie contre les vices cachés (art. 1641 et s. du Code civil), indépendamment de toute garantie commerciale.</p>`,
        `<h2>6. Prestations de conseil et d'accompagnement</h2>`,
        `<p>Les prestations font l'objet d'un devis ou d'une proposition décrivant le périmètre, les modalités et le tarif. La prestation débute après accord et, le cas échéant, versement de l'acompte convenu. Les modalités d'annulation ou de report propres à chaque mission sont précisées au devis.</p>`,
        `<p>Pour les prestations de services commandées à distance par un consommateur, le droit de rétractation de quatorze (14) jours s'applique ; le client peut toutefois demander que l'exécution commence avant la fin de ce délai, ce qui peut, en cas de prestation pleinement exécutée, le priver de ce droit conformément à l'article L.221-28 du Code de la consommation.</p>`,
        `<h2>7. Réclamations et médiation de la consommation</h2>`,
        `<p>Toute réclamation peut être adressée à <a href="mailto:contact@encrehumaine.fr">contact@encrehumaine.fr</a>. Conformément à l'article L.612-1 du Code de la consommation, le consommateur peut recourir gratuitement à un médiateur de la consommation ; ${ID.mediatorSentence}. La plateforme européenne de règlement en ligne des litiges est par ailleurs accessible à l'adresse <a href="https://ec.europa.eu/consumers/odr">ec.europa.eu/consumers/odr</a>.</p>`,
        `<h2>8. Droit applicable</h2>`,
        `<p>Les présentes CGV sont soumises au droit français. À défaut de résolution amiable, les litiges relèvent des juridictions françaises compétentes.</p>`,
      ].join(""),
    },
    {
      slug: "cgu",
      title: "Conditions générales d'utilisation",
      body: [
        `<h2>1. Objet</h2>`,
        `<p>Les présentes conditions régissent l'accès et l'utilisation du site <a href="https://encrehumaine.fr">encrehumaine.fr</a>. En naviguant sur le site, l'utilisateur en accepte les conditions.</p>`,
        `<h2>2. Accès au site</h2>`,
        `<p>Le site est accessible gratuitement. <strong>Aucune création de compte n'est nécessaire</strong> : la consultation des contenus, la prise de contact, l'inscription à la newsletter et les achats en boutique se font sans authentification (achat invité). La Vendeuse s'efforce d'assurer la disponibilité du site sans pouvoir la garantir, notamment lors d'opérations de maintenance.</p>`,
        `<h2>3. Propriété intellectuelle</h2>`,
        `<p>Les contenus du site sont protégés. Toute reproduction non autorisée est interdite (voir les <a href="/mentions-legales">Mentions légales</a>).</p>`,
        `<h2>4. Mesure d'audience et cookies</h2>`,
        `<p>Le site limite au strict nécessaire le recours aux traceurs :</p>`,
        `<ul>`,
        `<li><strong>Mesure d'audience (Umami)</strong> : statistiques de fréquentation réalisées avec une solution auto-hébergée, <strong>sans cookie et sans traceur</strong>, ne collectant aucune donnée permettant d'identifier les visiteurs. Conforme aux recommandations de la CNIL pour les outils de mesure exemptés, elle <strong>ne requiert pas de consentement</strong>.</li>`,
        `<li><strong>Cookie de préférence</strong> : un cookie technique mémorise votre choix concernant les contenus tiers (voir ci-dessous). Il est strictement nécessaire au fonctionnement de cette préférence et n'est pas utilisé à des fins de suivi.</li>`,
        `<li><strong>Contenus tiers soumis à consentement</strong> : la prise de rendez-vous (Cal.com) et le paiement (Stripe) reposent sur des services tiers qui ne sont chargés <strong>qu'après votre consentement explicite</strong>. En l'absence de consentement, ces contenus ne sont pas chargés.</li>`,
        `</ul>`,
        `<h2>5. Responsabilité</h2>`,
        `<p>La Vendeuse ne saurait être tenue responsable des dommages résultant d'une mauvaise utilisation du site, d'une indisponibilité temporaire ou de la présence de liens vers des sites tiers dont elle ne maîtrise pas le contenu.</p>`,
        `<h2>6. Droit applicable</h2>`,
        `<p>Les présentes conditions sont soumises au droit français.</p>`,
      ].join(""),
    },
    {
      slug: "confidentialite",
      title: "Politique de confidentialité",
      body: [
        `<h2>1. Responsable de traitement</h2>`,
        `<p>Le responsable des traitements est Eléonore Morée — ${ID.address} — <a href="mailto:contact@encrehumaine.fr">contact@encrehumaine.fr</a>.</p>`,
        `<h2>2. Données collectées, finalités et bases légales</h2>`,
        `<ul>`,
        `<li><strong>Formulaire de contact</strong> (nom, courriel, message) : pour répondre à votre demande. Base légale : mesures précontractuelles / intérêt légitime.</li>`,
        `<li><strong>Newsletter</strong> (courriel, prénom facultatif, et preuve de consentement : date, adresse IP et agent utilisateur lors de l'inscription) : pour vous envoyer « Le Fil ». Base légale : votre consentement, recueilli par <strong>double opt-in</strong>.</li>`,
        `<li><strong>Commandes</strong> (courriel, adresse de livraison, montant) : pour traiter et suivre vos achats. Base légale : exécution du contrat de vente. Les données de paiement sont traitées par Stripe et ne sont pas conservées par la Vendeuse.</li>`,
        `<li><strong>Mesure d'audience</strong> : statistiques agrégées et anonymes (Umami, sans cookie ni traceur), ne permettant pas de vous identifier.</li>`,
        `<li><strong>Sécurité</strong> : une protection anti-robot (Cloudflare Turnstile) et une limitation de débit utilisent temporairement l'adresse IP. Cette adresse n'est <strong>pas conservée</strong> sur les demandes de contact. Base légale : intérêt légitime à la sécurité du service.</li>`,
        `</ul>`,
        `<h2>3. Double opt-in et preuve de consentement</h2>`,
        `<p>L'inscription à la newsletter n'est effective qu'après confirmation via un lien envoyé par courriel. La preuve de consentement est conservée. Les inscriptions non confirmées sont automatiquement supprimées après <strong>30 jours</strong>. Vous pouvez vous désinscrire à tout moment via le lien présent dans chaque envoi.</p>`,
        `<h2>4. Destinataires et sous-traitants</h2>`,
        `<p>Vos données ne sont jamais vendues. Elles sont susceptibles d'être traitées par les sous-traitants suivants, dans la seule mesure nécessaire :</p>`,
        `<ul>`,
        `<li><strong>Hetzner</strong> (Allemagne) : hébergement du site et de la base de données ;</li>`,
        `<li><strong>Stripe</strong> : traitement des paiements ;</li>`,
        `<li><strong>Resend</strong> : envoi des courriels (confirmation, notifications, newsletter) ;</li>`,
        `<li><strong>Cloudflare</strong> : diffusion du site, protection anti-robot (Turnstile) et stockage chiffré des sauvegardes (R2) ;</li>`,
        `<li><strong>Cal.com</strong> : prise de rendez-vous (uniquement si vous utilisez ce service).</li>`,
        `</ul>`,
        `<p>Certains de ces prestataires peuvent traiter des données hors de l'Union européenne ; ces transferts sont alors encadrés par des garanties appropriées (clauses contractuelles types ou cadre de protection des données UE–États-Unis).</p>`,
        `<h2>5. Durées de conservation</h2>`,
        `<ul>`,
        `<li>Demandes de contact : 3 ans à compter du dernier échange ;</li>`,
        `<li>Newsletter : jusqu'à votre désinscription (puis suppression) ; inscriptions non confirmées : 30 jours ;</li>`,
        `<li>Commandes et pièces comptables : durée légale de conservation applicable (jusqu'à 10 ans pour les documents comptables).</li>`,
        `</ul>`,
        `<h2>6. Vos droits</h2>`,
        `<p>Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité, ainsi que du droit de retirer votre consentement à tout moment. Pour les exercer, écrivez à <a href="mailto:contact@encrehumaine.fr">contact@encrehumaine.fr</a>. Vous pouvez également introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr">cnil.fr</a>).</p>`,
      ].join(""),
    },
  ];
  for (const d of legalDocs) {
    await upsert("legal_documents", "slug", d.slug, { title: d.title, body: d.body, ...PUB });
  }

  console.log("✓ Seed terminé (contenu démo FR). Boutique : produits masqués sans prix Stripe.");
}

main().catch((err) => {
  console.error("\n✗ Seed échoué :\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
