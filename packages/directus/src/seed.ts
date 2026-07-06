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
import { homePageContent } from "./content-home.ts";
import { config } from "./env.ts";

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
    booking_url: config.bookingUrl,
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
      q: "Puis-je utiliser mon CPF ?",
      a: P(
        "Non.",
        "Ces accompagnements ne sont pas éligibles au CPF.",
        "Ils relèvent d'une démarche personnelle et volontaire.",
      ),
      scope: "b2c",
    },
    {
      q: "Cet accompagnement est-il fait pour moi ?",
      a: P(
        "Il s'adresse aux personnes qui souhaitent avancer dans leur réflexion ou leur projet professionnel.",
        "En revanche, il ne remplace pas un accompagnement thérapeutique lorsqu'une souffrance psychologique importante est présente.",
      ),
      scope: "b2c",
    },
    {
      q: "Que se passe-t-il lors du premier échange ?",
      a: P(
        "Nous faisons connaissance.",
        "Vous m'expliquez votre situation, vos interrogations et vos besoins.",
        "Je vous explique ma façon de travailler.",
        "Et nous regardons ensemble si l'accompagnement est pertinent pour vous.",
        "Sans engagement. Sans pression.",
      ),
      scope: "b2c",
    },
    {
      q: "Est-ce un audit de contrôle ?",
      a: P(
        "Non. Il ne s'agit pas de juger vos pratiques, mais de comprendre votre fonctionnement pour vous aider à y voir plus clair.",
      ),
      scope: "audit",
    },
    {
      q: "Dois-je préparer des documents ?",
      a: P(
        "Non. J'adapte mon analyse à ce qui existe déjà. Si vous avez des documents (entretiens, fiches de poste, plans de formation…), ils sont simplement des supports complémentaires.",
      ),
      scope: "audit",
    },
    {
      q: "Combien de temps cela mobilise-t-il côté client ?",
      a: P(
        "Environ 2 à 3 heures d'échanges réparties sur la mission. Le reste est pris en charge de mon côté.",
      ),
      scope: "audit",
    },
    {
      q: "Peut-on poursuivre après l'audit ?",
      a: P(
        "Oui. L'audit peut être un point de départ vers une structuration des compétences (GEPP), un travail sur les managers, ou un accompagnement global des pratiques RH. Nous en discutons ensemble à la restitution.",
      ),
      scope: "audit",
    },
    {
      q: "Nous avons déjà un logiciel RH. Est-ce compatible ?",
      a: P(
        "Oui.",
        "Je travaille à partir de vos outils existants et j'adapte la démarche à votre environnement.",
      ),
      scope: "competences",
    },
    {
      q: "Nos managers ont peu de temps. Est-ce réaliste ?",
      a: P(
        "Oui.",
        "L'objectif est justement de construire des outils simples, utilisables et adaptés au terrain.",
        "Les temps de contribution sont anticipés et limités au strict nécessaire.",
      ),
      scope: "competences",
    },
    {
      q: "Est-ce réservé aux entreprises soumises à la GEPP ?",
      a: P(
        "Non.",
        "Même lorsqu'il n'existe aucune obligation légale, comprendre ses compétences et ses parcours reste un enjeu stratégique de développement.",
      ),
      scope: "competences",
    },
    {
      q: "Faut-il commencer par un audit RH ?",
      a: P(
        "Pas forcément.",
        "Mais lorsque les besoins sont encore flous, l'audit RH constitue souvent un excellent point de départ.",
      ),
      scope: "competences",
    },
    {
      q: "Combien de participants par atelier ?",
      a: P("Entre 6 et 10 participants pour favoriser les échanges et la participation active."),
      scope: "managers",
    },
    {
      q: "Peut-on combiner cet accompagnement avec d'autres missions ?",
      a: P(
        "Oui.",
        "Il complète particulièrement bien les démarches de développement des compétences, de GEPP ou d'audit RH.",
      ),
      scope: "managers",
    },
    {
      q: "Que faire si certains managers sont réticents ?",
      a: P(
        "C'est une situation fréquente.",
        "Avant de transmettre des outils ou des méthodes, je prends le temps de comprendre leurs réalités, leurs contraintes et leurs représentations du management.",
        "L'adhésion se construit rarement par obligation.",
      ),
      scope: "managers",
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
  type TB = { title: string; body?: string };
  type OfferSeed = {
    slug: string;
    audience: string;
    title: string;
    icon: string;
    short_description: string;
    duration_label: string;
    price_label: string;
    price_note?: string;
    featured_testimonial: string | null;
    accroche_title?: string;
    accroche_subtitle?: string;
    accroche_body?: string;
    accroche_signature?: string;
    outcomes_title?: string;
    outcomes_intro?: string;
    outcomes?: TB[];
    context_title?: string;
    context_items?: TB[];
    context_conclusion?: string;
    approche_title?: string;
    approche_body?: string;
    approche_signature?: string;
    mission_title?: string;
    mission_intro?: string;
    mission_includes?: TB[];
    format_title?: string;
    format_body?: string;
    audience_fit_title?: string;
    audience_fit?: { text: string }[];
    audience_fit_conclusion?: string;
    cta_title?: string;
    cta_body?: string;
    cta_label?: string;
    cta_subtext?: string;
  };
  const offers: OfferSeed[] = [
    {
      slug: "audit-rh",
      audience: "organisation",
      title: "Audit RH & feuille de route",
      icon: "search",
      short_description:
        "Retrouver de la visibilité : faire le point sur vos pratiques RH et identifier les priorités les plus utiles.",
      duration_label: "à partir de 4 semaines",
      price_label: "Sur devis",
      price_note: "Forfait défini avant démarrage. Acompte de 30 % à la signature.",
      accroche_title: "Avant de structurer vos RH, encore faut-il savoir où vous en êtes vraiment.",
      accroche_subtitle:
        "Dans beaucoup de PME, les pratiques RH se sont construites progressivement, au rythme de la croissance : recrutement, management, formation, entretiens, organisation…\n\nRien n'est totalement absent. Mais tout n'est pas toujours lisible. Et c'est précisément là que les difficultés apparaissent.",
      accroche_body:
        "On retrouve souvent la même situation : des outils RH qui existent mais qui ne produisent pas les effets attendus, des managers qui font de leur mieux mais sans cadre commun, des compétences présentes mais peu visibles ou peu structurées, des décisions prises dans l'urgence, faute de recul.\n\nCe n'est pas un manque de volonté. C'est un manque de clarté.",
      accroche_signature: "L'audit RH n'est pas un contrôle. C'est un point de clarté.",
      outcomes_title: "Retrouver de la clarté pour décider plus sereinement.",
      outcomes_intro:
        "L'objectif n'est pas de produire un document théorique. Il est de vous permettre de comprendre rapidement où vous en êtes, ce qui fonctionne déjà, ce qui freine votre organisation, et par quoi commencer.",
      outcomes: [
        {
          title: "Voir clairement votre situation RH",
          body: "Vous obtenez une lecture structurée de vos pratiques actuelles, sans jargon ni jugement.",
        },
        {
          title: "Identifier les vrais leviers d'action",
          body: "Pas une liste de recommandations, mais ce qui aura réellement un impact dans votre contexte.",
        },
        {
          title: "Prioriser ce qui compte vraiment",
          body: "Ce qui est urgent, ce qui est important, et ce qui peut attendre.",
        },
        {
          title: "Poser une base solide pour la suite",
          body: "Que vous poursuiviez ensuite seul ou accompagné, vous repartez avec une vision claire et exploitable.",
        },
      ],
      context_title: "Derrière chaque audit RH, on retrouve des situations très similaires.",
      context_items: [
        {
          title: "Compétences peu lisibles",
          body: "Les savoir-faire existent, mais ils ne sont pas formalisés ni partagés.",
        },
        {
          title: "Managers en sur-sollicitation",
          body: "Ils portent beaucoup de responsabilités sans cadre commun ni outils stabilisés.",
        },
        {
          title: "Outils RH sous-exploités",
          body: "Entretiens, formation, procédures… présents, mais peu structurants dans le quotidien.",
        },
        {
          title: "Organisation en croissance rapide",
          body: "L'entreprise évolue plus vite que ses pratiques internes.",
        },
        {
          title: "Pilotage à court terme",
          body: "Le quotidien prend le dessus sur la structuration.",
        },
      ],
      context_conclusion: "L'audit permet justement de remettre de la lecture dans cet ensemble.",
      mission_title: "Un audit RH complet, structuré et directement exploitable.",
      mission_includes: [
        {
          title: "Analyse de votre organisation RH",
          body: "Recrutement, intégration, formation, entretiens, compétences, management.",
        },
        {
          title: "Entretiens avec les parties prenantes clés",
          body: "Direction, managers, fonctions support selon votre organisation.",
        },
        {
          title: "Lecture des écarts et enjeux",
          body: "Entre vos pratiques actuelles et vos besoins réels de développement.",
        },
        {
          title: "Feuille de route priorisée",
          body: "Une vision claire : court terme (actions immédiates), moyen terme, structuration long terme.",
        },
        {
          title: "Restitution orale",
          body: "Un temps d'échange pour repartir avec une vision claire et actionnable.",
        },
      ],
      format_body: "",
      audience_fit_title: "Cette mission est faite pour vous si…",
      audience_fit: [
        { text: "Votre entreprise grandit plus vite que ses pratiques RH" },
        { text: "Vous n'avez pas de RH dédié, ou seulement partiellement" },
        { text: "Vous reprenez une structure et souhaitez comprendre l'existant" },
        { text: "Vous sentez des tensions ou des déséquilibres sans pouvoir les expliquer" },
        { text: "Vous préparez une phase de croissance ou de structuration" },
        {
          text: "Vous voulez poser des bases solides avant d'aller plus loin (GEPP, compétences, management)",
        },
      ],
      audience_fit_conclusion:
        "L'audit est souvent le point de départ d'une structuration RH plus cohérente. Mais il peut aussi être une étape autonome, simplement pour retrouver de la clarté.",
      cta_title: "Vous avez besoin de comprendre clairement où vous en êtes ?",
      cta_body:
        "Avant de transformer une organisation, il faut d'abord pouvoir la lire. C'est exactement l'objectif de cet audit.",
      cta_label: "Prendre rendez-vous",
      cta_subtext: "30 minutes d'échange, sans engagement, pour clarifier votre situation.",
      featured_testimonial: tMarie,
    },
    {
      slug: "competences-parcours",
      audience: "organisation",
      title: "Compétences & parcours",
      icon: "route",
      short_description:
        "Rendre les compétences visibles et donner de la perspective aux parcours, pour de meilleures décisions RH.",
      // S7 — Format : 4 à 8 semaines. Tarif « à partir de XXX € » d'Éléonore = placeholder →
      // « Sur devis » tant que le montant n'est pas arrêté (ne pas publier « XXX »).
      duration_label: "4 à 8 semaines d'accompagnement",
      price_label: "Sur devis",
      price_note:
        "Le périmètre est ajusté à la taille de votre organisation, à vos enjeux et à vos objectifs.",
      // S1 — Accroche
      accroche_title: "Rendre les compétences visibles. Donner de la perspective aux parcours.",
      accroche_subtitle:
        "Les compétences sont partout dans votre organisation.\n\nElles permettent de produire, d'innover, de transmettre, de manager et de se développer.\n\nPourtant, elles restent souvent peu visibles.\n\nOn sait qu'elles existent.\n\nOn sait qu'elles sont importantes.\n\nMais on peine parfois à identifier précisément où elles se trouvent, comment elles évoluent et ce qu'il faudra développer demain.",
      accroche_body:
        "Lorsque les compétences ne sont pas clairement identifiées :\n\n— les recrutements deviennent plus complexes ;\n— les besoins de formation sont difficiles à prioriser ;\n— les managers manquent de repères ;\n— les collaborateurs ont du mal à se projeter ;\n— les départs ou évolutions créent des fragilités inattendues.\n\nÀ l'inverse, une organisation qui comprend ses compétences et ses parcours professionnels prend de meilleures décisions.\n\nElle anticipe davantage.\n\nElle développe ses équipes plus efficacement.\n\nEt elle donne à chacun une vision plus claire de sa place et de ses perspectives.",
      accroche_signature: "Structurer les compétences sans oublier les personnes qui les portent.",
      // S2 — Ce que cet accompagnement change concrètement
      outcomes_title: "Plus de visibilité aujourd'hui. Plus de capacité d'anticipation demain.",
      outcomes_intro:
        "L'objectif n'est pas de produire un référentiel supplémentaire qui finira dans un dossier partagé.\n\nL'objectif est de rendre les compétences réellement utiles à votre organisation.",
      outcomes: [
        {
          title: "Mieux comprendre vos ressources internes",
          body: "Vous identifiez clairement les compétences présentes dans votre organisation et les expertises sur lesquelles vous pouvez vous appuyer.",
        },
        {
          title: "Sécuriser votre développement",
          body: "Vous repérez les compétences critiques, les risques de dépendance et les besoins futurs.",
        },
        {
          title: "Donner des repères aux managers",
          body: "Les managers disposent d'un langage commun pour accompagner leurs équipes et conduire les entretiens professionnels.",
        },
        {
          title: "Donner de la visibilité aux collaborateurs",
          body: "Les parcours deviennent plus lisibles.\nLes possibilités d'évolution sont mieux comprises.\nLes discussions professionnelles gagnent en qualité.",
        },
        {
          title: "Aligner formation et besoins réels",
          body: "Le développement des compétences répond à des enjeux concrets plutôt qu'à une logique de catalogue.",
        },
      ],
      // S3 — Ce que j'observe le plus souvent (situations sans titre → carte à corps seul)
      context_title: "Les compétences sont rarement absentes. Elles sont surtout peu visibles.",
      context_items: [
        {
          title: "",
          body: "Certaines compétences clés reposent sur quelques personnes sans être suffisamment formalisées ou transmises.",
        },
        {
          title: "",
          body: "Les managers connaissent leurs équipes mais manquent d'outils pour objectiver les besoins de développement.",
        },
        {
          title: "",
          body: "Les entretiens professionnels existent mais débouchent rarement sur des actions concrètes.",
        },
        {
          title: "",
          body: "Les besoins de recrutement et de formation sont traités séparément alors qu'ils répondent aux mêmes enjeux.",
        },
        {
          title: "",
          body: "Les collaborateurs peinent à comprendre comment évoluer au sein de l'organisation.",
        },
      ],
      context_conclusion:
        "La question n'est généralement pas de créer davantage d'outils RH.\n\nLa question est de rendre les compétences plus lisibles pour permettre de meilleures décisions.",
      // S4 — Une approche qui relie compétences et parcours
      approche_title: "Parce qu'une compétence n'existe jamais seule.",
      approche_body:
        "<p>Derrière chaque compétence, il y a une personne.</p>" +
        "<p>Derrière chaque évolution professionnelle, il y a un parcours.</p>" +
        "<p>C'est pourquoi mon approche ne se limite pas à la construction d'un référentiel ou à une démarche GEPP.</p>" +
        "<p>Elle consiste à relier :</p>" +
        "<ul><li>les besoins de l'organisation ;</li><li>les compétences disponibles ;</li><li>les aspirations professionnelles ;</li><li>les perspectives d'évolution.</li></ul>" +
        "<p>Cette double lecture me permet de construire des démarches qui répondent à la fois aux enjeux RH et aux réalités humaines.</p>",
      approche_signature:
        "Structurer sans déshumaniser.\n\nLes outils n'ont de valeur que s'ils aident les personnes à mieux comprendre leur rôle, leur développement et leur place dans l'organisation.",
      // S5 — Ce que comprend la mission
      mission_title: "Une démarche de gestion des compétences adaptée à votre réalité.",
      mission_includes: [
        {
          title: "Cartographie des compétences",
          body: "Identifier les compétences présentes, leur niveau de maîtrise et leur contribution aux enjeux de l'organisation.",
        },
        {
          title: "Référentiel de compétences",
          body: "Construire ou faire évoluer un référentiel adapté à vos métiers et à votre culture.",
        },
        {
          title: "Analyse des écarts",
          body: "Identifier les compétences à développer, transmettre ou renforcer.",
        },
        {
          title: "Plan de Développement des Compétences",
          body: "Construire un PDC cohérent, priorisé et aligné avec vos objectifs.",
        },
        {
          title: "Entretiens professionnels et parcours",
          body: "Outiller les managers et structurer les échanges autour des évolutions professionnelles.",
        },
        {
          title: "Outils de pilotage",
          body: "Tableaux de bord, trames d'entretien, outils de suivi et supports opérationnels.",
        },
        {
          title: "Transmission",
          body: "Rendre votre organisation autonome dans l'utilisation des outils construits.",
        },
      ],
      // Pas de section « Comment ça se passe » distincte pour cette offre.
      format_body: "",
      // S6 — Pour qui ?
      audience_fit_title: "Cet accompagnement est particulièrement pertinent si…",
      audience_fit: [
        { text: "Votre organisation compte entre 20 et 300 salariés" },
        {
          text: "Vous souhaitez mettre en place une démarche GEPP sans créer une usine à gaz",
        },
        { text: "Vos compétences clés ne sont pas clairement identifiées" },
        { text: "Vous préparez une phase de croissance ou de transformation" },
        { text: "Vous avez des difficultés de recrutement ou de fidélisation" },
        {
          text: "Vos managers manquent de repères pour accompagner les parcours professionnels",
        },
        { text: "Vos entretiens professionnels n'apportent pas les résultats attendus" },
        { text: "Vous souhaitez développer les compétences de façon plus stratégique" },
      ],
      audience_fit_conclusion:
        "Que l'objectif soit d'anticiper, de transmettre ou de développer les compétences, tout commence par une meilleure visibilité de l'existant.",
      // S10 — Appel à l'action
      cta_title: "Et si vous aviez enfin une vision claire de vos compétences et de vos parcours ?",
      cta_body:
        "Les meilleures décisions RH reposent rarement sur l'intuition seule.\n\nElles reposent sur une compréhension claire de ce qui existe déjà et de ce qu'il faut construire pour demain.",
      cta_label: "Prendre rendez-vous",
      cta_subtext:
        "30 minutes d'échange pour faire le point sur vos enjeux de compétences, de GEPP et de développement des parcours.",
      // S9 — Témoignage à intégrer après les premières missions (placeholder Éléonore).
      featured_testimonial: null,
    },
    {
      slug: "managers-equipes",
      audience: "organisation",
      title: "Management & cohésion d'équipe",
      icon: "groups",
      short_description:
        "Donner des repères aux managers pour accompagner leurs équipes avec clarté et sérénité.",
      duration_label: "Minimum 2 jours",
      price_label: "750 € HT par jour",
      price_note:
        "Comprend : analyse du besoin, conception sur mesure, animation des ateliers, supports pédagogiques et suivi à J+30.\n\nChaque proposition est construite en fonction du nombre de participants et des objectifs poursuivis.",
      // S1 — Accroche
      accroche_title:
        "Vos managers ont gagné des responsabilités. Ont-ils gagné les repères qui vont avec ?",
      accroche_subtitle:
        "On devient souvent manager parce qu'on maîtrise son métier.\n\nBeaucoup plus rarement parce qu'on a appris à accompagner une équipe, gérer des situations complexes ou conduire des entretiens professionnels.\n\nLa plupart des managers construisent leurs pratiques au fil de l'expérience, avec beaucoup de bonne volonté… mais parfois peu de cadre.",
      accroche_body:
        "C'est rarement un problème de motivation.\n\nC'est plus souvent un manque de repères.\n\n— Comment trouver la bonne posture ?\n— Comment donner du feedback ?\n— Comment gérer une tension dans l'équipe ?\n— Comment conduire un entretien professionnel utile ?\n— Comment accompagner les changements sans s'épuiser ?\n\nAutant de questions qui influencent directement la qualité du management, l'engagement des équipes et le fonctionnement de l'organisation.",
      accroche_signature:
        "Des managers plus clairs dans leur rôle. Des équipes plus sereines dans leur quotidien.",
      // S2 — Ce que cet accompagnement change concrètement
      outcomes_title:
        "Donner aux managers les moyens de faire vivre les pratiques RH au quotidien.",
      outcomes_intro:
        "Les managers sont souvent le point de rencontre entre les décisions de l'organisation et la réalité du terrain.\n\nLorsqu'ils disposent de repères clairs, tout devient plus fluide.",
      outcomes: [
        {
          title: "Renforcer la confiance managériale",
          body: "Les managers comprennent mieux leur rôle, leur responsabilité et leur marge d'action.",
        },
        {
          title: "Faciliter la communication dans les équipes",
          body: "Les échanges deviennent plus simples, plus constructifs et plus efficaces.",
        },
        {
          title: "Donner un cadre commun",
          body: "Les pratiques managériales gagnent en cohérence sans perdre leur dimension humaine.",
        },
        {
          title: "Mieux conduire les entretiens professionnels et annuels",
          body: "Les managers disposent de repères concrets pour accompagner les parcours professionnels.",
        },
        {
          title: "Faire vivre les outils RH",
          body: "Les référentiels, les parcours et les dispositifs RH prennent réellement vie dans le quotidien des équipes.",
        },
      ],
      // S3 — Ce que j'observe le plus souvent
      context_title:
        "Les managers ne manquent généralement pas d'engagement. Ils manquent de repères.",
      context_items: [
        {
          title: "Une expertise métier qui ne suffit plus",
          body: "Être un excellent professionnel ne prépare pas automatiquement à accompagner une équipe.",
        },
        {
          title: "Des responsabilités qui augmentent rapidement",
          body: "Les attentes grandissent plus vite que les moyens ou l'accompagnement disponibles.",
        },
        {
          title: "Des situations humaines complexes",
          body: "Conflits, démotivation, tensions, changements, départs, réorganisations… Les managers doivent souvent gérer ces situations sans cadre clair.",
        },
        {
          title: "Des entretiens qui deviennent administratifs",
          body: "Les entretiens professionnels et annuels sont réalisés mais produisent peu d'effets concrets.",
        },
        {
          title: "Des pratiques très différentes selon les managers",
          body: "Chaque personne fait de son mieux, mais sans langage commun ni repères partagés.",
        },
      ],
      context_conclusion:
        "Former les managers ne consiste pas seulement à transmettre des méthodes.\n\nIl s'agit de leur donner suffisamment de clarté pour agir avec confiance dans leur propre contexte.",
      // S4 — Une approche qui relie management, RH et réalité du terrain
      approche_title: "Le management ne se résume pas à une boîte à outils.",
      approche_body:
        "<p>Mon approche s'appuie sur une conviction simple : les difficultés managériales sont rarement uniquement managériales.</p>" +
        "<p>Elles sont souvent liées à :</p>" +
        "<ul><li>l'organisation du travail ;</li><li>les compétences disponibles ;</li><li>les parcours professionnels ;</li><li>les attentes de l'entreprise ;</li><li>les dynamiques d'équipe.</li></ul>" +
        "<p>C'est pourquoi j'interviens avec une double lecture :</p>" +
        "<ul><li>celle du management au quotidien ;</li><li>celle des ressources humaines et du développement des compétences.</li></ul>",
      approche_signature:
        "Structurer sans déshumaniser.\n\nDonner un cadre n'a de sens que s'il aide les personnes à travailler ensemble plus sereinement.",
      // S5 — Les thématiques d'accompagnement
      mission_title: "Des interventions construites à partir de vos enjeux réels.",
      mission_intro:
        "Chaque accompagnement est conçu sur mesure en fonction de votre contexte, de vos équipes et de vos objectifs.",
      mission_includes: [
        {
          title: "Posture managériale",
          body: "Passer du rôle d'expert à celui de manager, clarifier sa place et développer sa légitimité.",
        },
        {
          title: "Communication et feedback",
          body: "Améliorer les échanges, gérer les désaccords et renforcer la qualité des relations de travail.",
        },
        {
          title: "Cohésion d'équipe",
          body: "Comprendre les dynamiques collectives et développer la coopération.",
        },
        {
          title: "Entretiens professionnels et annuels",
          body: "Accompagner les managers dans la conduite d'entretiens utiles et structurants.",
        },
        {
          title: "Gestion des situations sensibles",
          body: "Conflits, difficultés individuelles, changements organisationnels ou annonces complexes.",
        },
      ],
      // S6 — Le format
      format_title: "Des accompagnements pensés pour être utiles sur le terrain.",
      format_body:
        "<p>Les interventions peuvent être réalisées en présentiel ou à distance selon vos contraintes.</p>" +
        "<p>Le format privilégie toujours l'échange, l'expérimentation et les situations réelles rencontrées par les participants.</p>" +
        "<h3>Fonctionnement</h3>" +
        "<ul><li>Minimum 2 jours d'intervention</li><li>Sessions espacées pour favoriser la mise en pratique</li><li>Exercices issus de situations concrètes</li><li>Adaptation au contexte de votre organisation</li></ul>" +
        "<h3>Un suivi à J+30</h3>" +
        "<p>Parce qu'un atelier n'a de valeur que s'il produit des effets dans la durée.</p>" +
        "<p>Ce temps de suivi permet de faire le point sur les évolutions observées, les difficultés rencontrées et les ajustements nécessaires.</p>",
      // S7 — Pour qui ?
      audience_fit_title: "Cet accompagnement est particulièrement pertinent si…",
      audience_fit: [
        { text: "Vos managers ont pris de nouvelles responsabilités récemment" },
        {
          text: "Vous constatez des pratiques managériales très différentes selon les équipes",
        },
        { text: "Vos entretiens professionnels manquent d'impact" },
        { text: "Certaines tensions ou incompréhensions freinent la coopération" },
        { text: "Vous souhaitez renforcer la cohérence managériale de votre organisation" },
        {
          text: "Vous mettez en place une démarche compétences ou GEPP et souhaitez impliquer vos managers",
        },
        {
          text: "Vous cherchez à développer un management plus structuré sans perdre en proximité",
        },
      ],
      audience_fit_conclusion:
        "Le management n'a pas besoin d'être parfait.\n\nIl a besoin d'être suffisamment clair pour permettre aux équipes d'avancer ensemble.",
      // S11 — Appel à l'action
      cta_title: "Et si vos managers disposaient enfin des repères dont ils ont besoin ?",
      cta_body:
        "Les équipes n'ont pas besoin de managers parfaits.\n\nElles ont besoin de managers capables de créer de la clarté, de la confiance et de la cohérence dans leur quotidien.",
      cta_label: "Prendre rendez-vous",
      cta_subtext:
        "30 minutes d'échange pour comprendre vos enjeux managériaux et identifier les pistes les plus pertinentes.",
      // S10 — Témoignage à intégrer après les premières missions (placeholder Éléonore).
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
      price_note: o.price_note ?? "Acompte de 30 % à la signature. Séance découverte offerte.",
      accroche_title: o.accroche_title ?? o.title,
      accroche_subtitle: o.accroche_subtitle ?? "",
      accroche_body: o.accroche_body ?? o.short_description,
      accroche_signature: o.accroche_signature ?? "",
      outcomes_title: o.outcomes_title ?? "",
      outcomes_intro: o.outcomes_intro ?? "",
      outcomes: o.outcomes ?? [
        { title: "De la clarté", body: "Vous savez quoi faire et dans quel ordre." },
        { title: "De l'autonomie", body: "Des outils que vous gardez après la mission." },
      ],
      context_title: o.context_title ?? "",
      context_items: o.context_items ?? [],
      context_conclusion: o.context_conclusion ?? "",
      approche_title: o.approche_title ?? "",
      approche_body: o.approche_body ?? "",
      approche_signature: o.approche_signature ?? "",
      mission_title: o.mission_title ?? "",
      mission_intro: o.mission_intro ?? "",
      mission_includes: o.mission_includes ?? [
        { title: "Un cadrage initial de vos enjeux" },
        { title: "Des livrables actionnables" },
        { title: "Un point de suivi à la fin" },
      ],
      format_title: o.format_title ?? "",
      format_body:
        o.format_body ??
        P(
          "On démarre par un échange pour cadrer le besoin réel.",
          "Puis on avance par étapes courtes, avec des points réguliers.",
        ),
      audience_fit_title: o.audience_fit_title ?? "",
      audience_fit: o.audience_fit ?? [
        { text: "Pour vous si vous voulez du concret" },
        { text: "Pas pour vous si vous cherchez une recette magique" },
      ],
      audience_fit_conclusion: o.audience_fit_conclusion ?? "",
      featured_testimonial: o.featured_testimonial,
      cta_title: o.cta_title ?? "",
      cta_body: o.cta_body ?? "",
      cta_label: o.cta_label ?? "Prendre rendez-vous",
      cta_subtext: o.cta_subtext ?? "",
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
  // Contenu éditorial mutualisé (content-home.ts) + témoignage vedette (ID runtime) + SEO.
  await setSingleton("home_page", {
    ...homePageContent,
    featured_testimonial: tMarie,
    meta_title: "L'Encre Humaine — Conseil RH & accompagnement des PME",
  });

  await setSingleton("about_page", {
    // §1 Accroche
    accroche_title:
      "J'aide à remettre de la clarté là où les personnes et les organisations avancent dans le flou.",
    accroche_body: P(
      "Au fil de mon parcours, j'ai observé une constante.",
      "Les difficultés professionnelles naissent rarement d'un manque de bonne volonté.",
      "Elles apparaissent lorsque les repères deviennent flous : des collaborateurs qui ne savent plus où ils vont, des managers qui avancent sans cadre, des organisations qui grandissent sans structurer leurs pratiques, des personnes qui cherchent leur place sans parvenir à la trouver.",
      "C'est dans ces moments-là que la clarté devient essentielle.",
      "Et c'est pour contribuer à la créer que j'ai fondé L'Encre Humaine.",
    ),
    // §2 Mon parcours
    story_title: "Comprendre les parcours avant de structurer les organisations.",
    story_body: P(
      "Mon parcours dans les ressources humaines a commencé là où les enjeux humains se révèlent souvent avec le plus d'intensité : l'accompagnement vers l'emploi.",
      "En Mission Locale puis à France Travail, j'ai accompagné des personnes confrontées à des questions fondamentales : trouver leur place, identifier leurs compétences, construire un projet professionnel ou retrouver confiance dans leur avenir.",
      "Cette expérience m'a appris quelque chose qui ne m'a jamais quittée : on n'accompagne pas une situation avant d'avoir compris la personne qui la vit.",
      "J'ai appris à écouter avant de conseiller. À comprendre les trajectoires plutôt qu'à chercher des solutions rapides. À voir derrière chaque CV une histoire, des ressources et parfois des obstacles invisibles.",
      "Puis j'ai découvert une autre facette du monde du travail : celle des organisations.",
      "J'ai évolué dans les domaines de la formation professionnelle, du développement des compétences et des ressources humaines. J'ai piloté des projets liés à la formation, à la qualité, à la GEPP, aux plans de développement des compétences, à l'accompagnement des managers et à la structuration des pratiques RH.",
      "J'y ai retrouvé les mêmes problématiques sous une autre forme. Lorsque les repères manquent, les organisations aussi avancent dans le flou. Les compétences existent mais ne sont pas identifiées. Les managers portent des responsabilités sans cadre clair. Les outils RH sont présents mais peinent à produire leurs effets. Les équipes avancent, mais sans toujours savoir dans quelle direction.",
      "C'est là que j'ai compris que les parcours individuels et les organisations étaient finalement confrontés à la même question : comment avancer lorsqu'on manque de visibilité ?",
      "Puis est arrivé un licenciement économique. Un événement que l'on vit d'abord comme une rupture. Avant qu'il ne devienne une occasion de prendre du recul.",
      "J'ai alors traversé moi-même ce que j'avais accompagné pendant des années chez d'autres : l'incertitude, le questionnement, la reconstruction et le choix d'une nouvelle direction.",
      "Cette expérience a renforcé une conviction déjà présente : on accompagne différemment ce que l'on a réellement vécu.",
      "C'est à ce moment-là qu'est née L'Encre Humaine.",
    ),
    // §3 Pourquoi L'Encre Humaine ? + le poulpe
    why_title: "Pourquoi « L'Encre Humaine » ?",
    why_body: P(
      "L'encre transforme une idée en quelque chose de visible. Elle permet de mettre des mots sur ce qui était encore confus. De rendre lisible ce qui semblait complexe. De laisser une trace durable.",
      "C'est exactement ce que je cherche à faire dans mon métier. Apporter de la clarté. Structurer. Mettre en lumière. Donner des repères.",
    ),
    octopus_subtitle: "Et pourquoi un poulpe ?",
    octopus_body: P(
      "Parce qu'il représente assez bien ma manière de travailler.",
      "Le poulpe évolue dans des environnements complexes. Il observe avant d'agir. Il s'adapte sans perdre sa direction. Il mobilise plusieurs ressources en même temps. Et surtout, il sait naviguer dans des situations où tout n'est pas parfaitement prévisible.",
      "Après plusieurs années passées entre insertion professionnelle, formation, développement des compétences et conseil RH, cette capacité d'adaptation est devenue l'une de mes forces.",
    ),
    // §4 Mes convictions
    convictions_title: "Mes convictions professionnelles.",
    convictions: [
      {
        title: "Les pratiques RH peuvent être humaines et efficaces.",
        body: "Je n'ai jamais adhéré à l'idée qu'il faudrait choisir entre performance et considération des personnes.\nLes organisations fonctionnent mieux lorsque les collaborateurs comprennent leur rôle, disposent de repères clairs et peuvent se projeter dans leur évolution.\nL'humanité n'est pas l'opposé de l'efficacité. Elle en est souvent une condition.",
      },
      {
        title: "La clarté est une forme de respect.",
        body: "Un collaborateur qui comprend ce que l'on attend de lui. Un manager qui sait comment accompagner son équipe. Un candidat qui sait où il en est. Une organisation qui explicite ses attentes.\nLa clarté réduit les incompréhensions, les tensions et les pertes d'énergie. Elle permet aux personnes d'avancer.",
      },
      {
        title: "Le terrain reste toujours le meilleur point de départ.",
        body: "Les méthodes ont leur utilité. Les outils aussi. Mais aucune recommandation n'a de valeur si elle ne tient pas compte de la réalité vécue.\nC'est pourquoi je cherche toujours à comprendre avant de proposer. Observer avant de conclure. Écouter avant de construire.",
      },
      {
        title: "Les parcours professionnels ne sont jamais linéaires.",
        body: "Je l'ai observé chez les personnes que j'ai accompagnées. Je l'ai vécu moi-même.\nLes transitions, les doutes, les changements de direction et les remises en question font partie des trajectoires professionnelles. L'important n'est pas d'éviter ces périodes. C'est de parvenir à leur donner du sens.",
      },
    ],
    // §5 Ma manière d'accompagner
    work_title: "Concrètement, comment je travaille.",
    work_intro:
      "Mon objectif n'est pas de vous rendre dépendant d'un consultant.\nMon objectif est de vous aider à avancer avec davantage d'autonomie, de clarté et de confiance.",
    how_i_work: [
      {
        title: "J'écoute avant de recommander.",
        body: "Parce qu'une bonne réponse commence toujours par une bonne compréhension de la situation.",
      },
      {
        title: "Je construis avec vous, pas à votre place.",
        body: "Vous connaissez votre organisation, votre métier ou votre parcours mieux que personne. Mon rôle consiste à apporter du recul, de la méthode et des outils.",
      },
      {
        title: "Je privilégie les solutions simples et durables.",
        body: "Je préfère un outil utilisé pendant trois ans qu'un dispositif complexe abandonné après trois semaines.",
      },
      {
        title: "Je sais aussi dire quand je ne suis pas la bonne personne.",
        body: "L'accompagnement de qualité passe parfois par une réorientation vers un autre professionnel.",
      },
    ],
    location:
      "Basée dans les Bouches-du-Rhône, j'accompagne des organisations et des particuliers partout en France, à distance ou en présentiel selon les besoins.",
    // §6 Ce que je ne fais pas
    what_i_dont_do_title: "Ce que je ne fais pas.",
    what_i_dont_do: [
      { text: "Des solutions RH standardisées appliquées à tous les contextes" },
      { text: "Des formations catalogue déconnectées de votre réalité" },
      { text: "Des recommandations impossibles à mettre en œuvre" },
      { text: "Des outils complexes qui finissent dans un dossier oublié" },
      { text: "Des réponses toutes faites à des situations qui méritent d'être comprises" },
    ],
    // §7 CTA
    cta_title: "Si vous cherchez davantage de clarté, nous avons déjà un point commun.",
    cta_body:
      "Que vous soyez une organisation en phase de structuration ou une personne en transition professionnelle, un premier échange permet souvent de mieux comprendre la situation et d'identifier les prochaines étapes.",
    cta_label: "Échangeons ensemble",
    meta_title: "À propos — L'Encre Humaine",
  });

  await setSingleton("org_hub_page", {
    // §1 Accroche
    accroche_title: "Quand votre organisation évolue, vos pratiques RH doivent évoluer avec elle.",
    accroche_subtitle:
      "Les équipes grandissent. Les responsabilités se développent. Les besoins changent.\n\nEt pourtant, les pratiques RH restent souvent celles d'une structure plus petite, d'une autre époque ou d'un autre contexte.\n\nCe n'est généralement pas un problème d'engagement. C'est un problème de visibilité, de priorisation et de structuration.",
    accroche_body:
      "Les compétences existent mais ne sont pas toujours identifiées. Les managers portent davantage de responsabilités sans disposer des repères nécessaires. Les entretiens professionnels sont réalisés mais peinent à produire des effets concrets. Les recrutements s'enchaînent sans vision claire des parcours à construire. Petit à petit, les équipes avancent, mais sans toujours savoir où elles vont.\n\nMon rôle consiste à remettre de la clarté dans cet ensemble pour construire des pratiques RH cohérentes, utiles et adaptées à votre réalité.",
    accroche_signature: "Structurer sans déshumaniser. Clarifier sans complexifier.",
    // §2 Ce que j'observe
    observe_title: "Derrière les outils RH, il y a souvent un besoin de clarté.",
    observe_intro:
      "Les organisations qui me sollicitent ne manquent généralement ni d'idées ni d'implication.\nElles manquent surtout de temps pour prendre du recul et structurer ce qui s'est construit progressivement au fil de leur développement.",
    observe_items: [
      {
        title: "Les compétences sont présentes mais peu visibles",
        body: "Les savoir-faire existent, mais ils ne sont pas suffisamment identifiés pour être développés, transmis ou valorisés.",
      },
      {
        title: "Les managers avancent sans repères communs",
        body: "Ils portent une part croissante des enjeux RH mais disposent rarement d'un cadre clair pour accompagner leurs équipes.",
      },
      {
        title: "Les outils RH existent mais ne produisent pas toujours les effets attendus",
        body: "Entretiens professionnels, référentiels, plans d'action ou dispositifs de formation restent parfois déconnectés des réalités du terrain.",
      },
      {
        title: "Les décisions sont prises dans l'urgence",
        body: "Le quotidien laisse peu de place à la réflexion stratégique et à l'anticipation.",
      },
    ],
    observe_conclusion:
      "Ce que recherchent la plupart des organisations n'est pas une accumulation d'outils supplémentaires.\nC'est une manière plus simple, plus lisible et plus cohérente de faire vivre leurs pratiques RH.",
    // §3 Offres (cartes dynamiques)
    offers_title: "Trois façons d'apporter davantage de clarté à votre organisation.",
    // §4 Ma façon de travailler
    method_title: "Une démarche construite à partir de votre réalité.",
    method_intro:
      "Je ne travaille pas avec des modèles standardisés ou des solutions prêtes à l'emploi. Chaque organisation possède son histoire, sa culture, ses contraintes et ses ressources. C'est à partir de cette réalité que nous construisons les solutions les plus pertinentes.",
    method_steps: [
      {
        number: "01",
        title: "Comprendre",
        description:
          "J'écoute, j'observe et j'analyse votre fonctionnement avant toute recommandation.",
      },
      {
        number: "02",
        title: "Clarifier",
        description:
          "Nous identifions ensemble les besoins réels, les priorités et les objectifs à atteindre.",
      },
      {
        number: "03",
        title: "Construire",
        description:
          "Je conçois des outils, des démarches ou des dispositifs adaptés à votre contexte.",
      },
      {
        number: "04",
        title: "Ancrer",
        description:
          "Je transmets, j'accompagne et je veille à ce que les solutions puissent vivre durablement dans votre organisation.",
      },
    ],
    // §5 Ce qui différencie l'approche
    differentiator_title: "Structurer les RH sans perdre de vue les personnes.",
    differentiator_body: P(
      "Mon parcours m'a conduite à travailler dans l'insertion professionnelle, la formation, le développement des compétences et les ressources humaines.",
      "Cette diversité d'expériences me permet d'aborder les organisations avec une double lecture : les enjeux de structure, de compétences et d'organisation ; et les réalités humaines vécues par les collaborateurs et les managers.",
      "Je ne vois pas les RH comme une succession de procédures. Je les considère comme un ensemble de repères qui permettent aux personnes de mieux comprendre leur place, leur rôle et leurs perspectives.",
      "Parce qu'une organisation fonctionne rarement mieux que le niveau de clarté qu'elle est capable d'offrir à ceux qui la composent.",
    ),
    // §6 Fait pour vous si…
    audience_title: "Vous vous reconnaîtrez probablement dans l'une de ces situations.",
    audience_items: [
      { text: "Votre organisation grandit plus vite que ses pratiques RH" },
      {
        text: "Vous souhaitez mettre en place une démarche GEPP mais ne savez pas par où commencer",
      },
      { text: "Vos compétences clés ne sont pas suffisamment identifiées" },
      { text: "Vos managers manquent de repères communs" },
      { text: "Vos entretiens professionnels n'apportent pas les résultats attendus" },
      { text: "Vous avez besoin d'un accompagnement RH externe sur un projet spécifique" },
      { text: "Vous cherchez à structurer sans créer une usine à gaz" },
    ],
    audience_conclusion:
      "Que vous soyez dirigeant, DRH, responsable RH ou manager, l'objectif reste le même : créer davantage de clarté pour permettre aux équipes d'avancer dans la même direction.",
    // §7 Témoignages
    testimonials_title: "Ce qu'en disent les organisations accompagnées",
    // §8 CTA final
    cta_title:
      "Vous savez qu'il faut structurer certaines choses, mais vous ne savez pas encore par où commencer ?",
    cta_body:
      "C'est précisément dans ce type de situation qu'un regard extérieur est le plus utile.\nUn premier échange permet souvent d'identifier rapidement les enjeux, les priorités et les pistes d'action possibles.",
    cta_label: "Prendre rendez-vous",
    cta_subtext: "30 minutes d'échange, sans engagement, pour faire le point sur votre situation.",
    meta_title: "Pour les organisations — L'Encre Humaine",
  });

  await setSingleton("b2c_hub_page", {
    // 1. Accroche
    accroche_title:
      "Quand le parcours professionnel devient flou, retrouver de la clarté change tout.",
    accroche_subtitle:
      "Reconversion professionnelle, perte de sens, évolution de carrière, recherche d'emploi, questionnement sur la suite…\n\n" +
      "Certaines périodes de la vie professionnelle nous obligent à ralentir pour comprendre ce qui se joue vraiment.\n\n" +
      "Et lorsqu'on est directement concerné, il est souvent difficile d'y voir clair seul.",
    accroche_body:
      "Vous avez peut-être l'impression de tourner en rond.\n\n" +
      "De ne plus être à votre place.\n\n" +
      "De savoir que quelque chose doit évoluer sans parvenir à identifier quoi.\n\n" +
      "Ou au contraire, vous avez déjà un projet en tête mais vous ne savez pas comment le concrétiser.\n\n" +
      "Dans les deux cas, la difficulté n'est pas toujours de trouver une solution.\n\n" +
      "C'est souvent de retrouver suffisamment de clarté pour avancer dans une direction qui a du sens pour vous.",
    accroche_signature:
      "Parce qu'un parcours professionnel n'a pas besoin d'être parfait. Il a besoin d'être compris.",
    accroche_cta_label: "Réserver un premier échange",
    // 2. Ce que vous venez chercher (bénéfices)
    outcomes_title: "Avant de prendre une décision, il faut souvent comprendre ce qui se passe.",
    outcomes_intro:
      "Les personnes que j'accompagne arrivent rarement avec une demande technique. Elles arrivent avec des questions. Parfois très simples. Parfois très profondes.",
    outcomes: [
      {
        title: "Retrouver de la clarté",
        body: "Mettre des mots sur ce qui bloque, ce qui manque ou ce qui appelle un changement.",
      },
      {
        title: "Comprendre son parcours",
        body: "Prendre du recul sur son histoire professionnelle et identifier les fils conducteurs souvent invisibles au quotidien.",
      },
      {
        title: "Faire des choix plus sereinement",
        body: "Explorer les possibilités et prendre des décisions plus alignées avec ses aspirations et sa réalité.",
      },
      {
        title: "Reprendre confiance",
        body: "Valoriser ses compétences, ses expériences et ses ressources pour retrouver une dynamique d'action.",
      },
      {
        title: "Passer à l'action",
        body: "Transformer les réflexions en démarches concrètes et réalistes.",
      },
    ],
    // 3. Deux situations, deux accompagnements
    situations_title: "Chaque transition professionnelle est différente.",
    situations_intro:
      "Certaines personnes cherchent d'abord à comprendre. D'autres savent déjà où elles veulent aller. L'accompagnement s'adapte à votre situation.",
    situation_a_title: "Clarifier & Avancer",
    situation_a_body: "",
    situation_a_audience:
      "Vous traversez une période de questionnement professionnel, de reconversion, d'évolution de carrière ou de perte de sens.",
    situation_a_items: [
      { text: "Comprendre ce qui se joue dans votre situation actuelle" },
      { text: "Identifier vos besoins et vos motivations" },
      { text: "Explorer les pistes possibles" },
      { text: "Construire un projet professionnel réaliste" },
      { text: "Retrouver une direction claire" },
    ],
    situation_a_result:
      "Vous repartez avec une vision plus lisible de votre parcours et des prochaines étapes à engager.",
    situation_a_cta_label: "Découvrir l'accompagnement",
    situation_a_cta_link: "/particuliers/clarifier-avancer",
    situation_b_title: "Booster sa recherche",
    situation_b_body: "",
    situation_b_audience:
      "Vous avez déjà un objectif professionnel mais vous avez besoin d'aide pour le concrétiser.",
    situation_b_items: [
      { text: "CV et candidature" },
      { text: "Profil LinkedIn" },
      { text: "Valorisation des compétences" },
      { text: "Préparation aux entretiens" },
      { text: "Stratégie de recherche d'emploi" },
      { text: "Réseau professionnel" },
    ],
    situation_b_result:
      "Vous gagnez en cohérence, en visibilité et en efficacité dans vos démarches.",
    situation_b_cta_label: "Découvrir l'accompagnement",
    situation_b_cta_link: "/particuliers/booster-recherche",
    // 4. Ma façon d'accompagner
    how_i_work_title: "Ni recettes toutes faites. Ni injonctions à changer de vie.",
    how_i_work_body: P(
      "Chaque parcours est différent.",
      "C'est pourquoi je ne pars jamais d'une méthode standardisée ou d'un projet préconçu.",
      "Je commence par comprendre votre situation, votre histoire professionnelle et ce qui vous amène aujourd'hui.",
      "Mon rôle n'est pas de décider à votre place.",
      "Mon rôle est de vous aider à voir plus clair pour que vous puissiez prendre vos propres décisions.",
    ),
    how_i_work_signature:
      "Structurer sans déshumaniser.\n\n" +
      "Même lorsqu'il s'agit d'un parcours individuel, la clarté reste souvent le meilleur point de départ.",
    // 5. Pourquoi c'est différent
    why_different_title: "Un regard à la croisée des parcours, de l'emploi et des RH.",
    why_different_body:
      P(
        "Depuis plus de 10 ans, j'accompagne des personnes confrontées à des transitions professionnelles.",
        "J'ai travaillé dans :",
      ) +
      "<ul><li>l'insertion professionnelle ;</li><li>l'accompagnement vers l'emploi ;</li><li>la formation ;</li><li>les ressources humaines ;</li><li>le développement des compétences.</li></ul>" +
      P(
        "J'ai accompagné des jeunes, des salariés, des demandeurs d'emploi, des personnes en reconversion ou confrontées à une rupture professionnelle.",
        "Cette diversité de situations m'a appris une chose :",
        "Les parcours professionnels sont rarement linéaires.",
        "Et derrière chaque période de doute se cachent souvent des ressources qui demandent simplement à être révélées.",
      ),
    // 6. Comment se déroule l'accompagnement
    format_title: "Un accompagnement à votre rythme.",
    format_items: [
      { text: "Séances individuelles d'une heure" },
      { text: "À distance en visioconférence" },
      { text: "Exercices et réflexions entre les séances" },
      { text: "Accompagnement personnalisé" },
    ],
    format_body:
      "Les exercices proposés ne sont pas des devoirs.\n\n" +
      "Ils servent à prolonger la réflexion dans votre quotidien et à transformer progressivement les prises de conscience en actions concrètes.",
    // 8. Témoignage — à compléter après les premiers accompagnements
    testimonial: null,
    // 9. Appel à l'action
    cta_title: "Et si vous vous accordiez enfin un espace pour y voir plus clair ?",
    cta_body:
      "Une transition professionnelle n'exige pas toujours des réponses immédiates. Elle demande souvent un temps pour comprendre, prendre du recul et retrouver une direction.",
    cta_label: "Réserver une séance découverte",
    cta_subtext:
      "Un premier échange gratuit pour faire le point sur votre situation et voir comment je peux vous accompagner.",
    meta_title: "Pour les particuliers — L'Encre Humaine",
    meta_description:
      "Reconversion, perte de sens, évolution de carrière ou recherche d'emploi : un accompagnement pour retrouver de la clarté et avancer dans une direction qui a du sens.",
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
