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
    siret: "À COMPLÉTER",
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
    hero_title: "Remettre de l'humain dans le travail",
    hero_subtitle:
      "Conseil RH pour les organisations, accompagnement pour les particuliers. Des méthodes concrètes, jamais hors-sol.",
    hero_cta_b2b_label: "Je suis une organisation",
    hero_cta_b2c_label: "Je suis un particulier",
    stats: [
      { value: "10+", label: "ans en RH" },
      { value: "50+", label: "accompagnements" },
      { value: "100%", label: "sur-mesure" },
    ],
    block_b2b_title: "Pour les organisations",
    block_b2b_text: "Audit, structuration des pratiques, accompagnement des managers.",
    block_b2b_tags: ["Audit RH", "GEPP", "Management"],
    block_b2c_title: "Pour les particuliers",
    block_b2c_text: "Clarifier son projet, réussir sa transition, booster sa recherche.",
    block_b2c_tags: ["Bilan", "Reconversion", "Recherche d'emploi"],
    intro_title: "Qui je suis",
    intro_text:
      "Eléonore Morée, consultante RH. J'aide les organisations et les personnes à remettre du sens et de la méthode dans le travail.",
    featured_testimonial: tMarie,
    final_cta_title: "Et si on en parlait ?",
    final_cta_label: "Prendre rendez-vous",
    meta_title: "L'Encre Humaine — Conseil RH & accompagnement",
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

  // ── legal_documents (PLACEHOLDER — contenu réel à réconcilier hors seed) ─────
  const legalNote = P(
    "<em>Contenu de démonstration</em> — à remplacer par le texte légal réel dans Directus.",
  );
  const legalDocs = [
    {
      slug: "mentions-legales",
      title: "Mentions légales",
      arts: ["Éditeur du site", "Hébergeur", "Propriété intellectuelle"],
    },
    {
      slug: "cgv",
      title: "Conditions générales de vente",
      arts: ["Objet", "Tarifs et paiement", "Droit de rétractation"],
    },
    {
      slug: "cgu",
      title: "Conditions générales d'utilisation",
      arts: ["Objet", "Accès au site", "Cookies"],
    },
    {
      slug: "confidentialite",
      title: "Politique de confidentialité",
      arts: ["Données collectées", "Vos droits", "Sous-traitants"],
    },
  ];
  for (const d of legalDocs) {
    const body = legalNote + d.arts.map((a) => `<h2>${a}</h2>${P("Texte à compléter.")}`).join("");
    await upsert("legal_documents", "slug", d.slug, { title: d.title, body, ...PUB });
  }

  console.log("✓ Seed terminé (contenu démo FR). Boutique : produits masqués sans prix Stripe.");
}

main().catch((err) => {
  console.error("\n✗ Seed échoué :\n", err instanceof Error ? err.message : err);
  process.exit(1);
});
