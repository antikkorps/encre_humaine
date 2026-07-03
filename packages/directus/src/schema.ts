// Modèle de contenu Directus — traduction fidèle de docs/02-content-model.md.
// Source d'intention (diffable en review). Le moteur bootstrap.ts l'applique ;
// le snapshot YAML en est l'artefact reproductible. DRY : un concept = une ligne.
import * as f from "./fields.ts";

export type CollectionDef = {
  collection: string;
  singleton?: boolean;
  icon?: string;
  note?: string;
  color?: string;
  /** Champs hors clé primaire (la pk uuid `id` est injectée par le bootstrap). */
  fields: f.Spec[];
};

// Choix réutilisables
const AUDIENCE = [
  { text: "Organisation", value: "organisation" },
  { text: "Particulier", value: "particulier" },
];
const AUDIENCE_BOTH = [...AUDIENCE, { text: "Les deux", value: "both" }];
const FAQ_SCOPE = [
  { text: "Contact", value: "contact" },
  { text: "Audit", value: "audit" },
  { text: "Compétences", value: "competences" },
  { text: "Managers", value: "managers" },
  { text: "Particuliers", value: "b2c" },
  { text: "Général", value: "general" },
];
const ARTICLE_GROUP = [
  { text: "Organisations", value: "organisations" },
  { text: "Particuliers", value: "particuliers" },
  { text: "Terrain", value: "terrain" },
];

/** Tail commun « contenu publiable » : statut + tri + audit. */
const publishable = (): f.Spec[] => [f.status(), f.sort(), ...f.auditFields()];

// ── Singletons (pages structurelles typées) ──────────────────────────────────

const singletons: CollectionDef[] = [
  {
    collection: "site_settings",
    singleton: true,
    icon: "settings",
    note: "Identité, contacts, infos légales, SEO par défaut",
    fields: [
      f.input("brand_name", { note: "L'Encre Humaine" }),
      f.input("tagline"),
      f.input("contact_email"),
      f.input("linkedin_url"),
      f.input("booking_url", {
        note: "URL de prise de RDV (Cal.com, Calendly… — consommée par l'embed RDV)",
      }),
      f.input("location_label", { note: "Bouches-du-Rhône · France entière" }),
      f.repeater("social_links", [{ field: "platform" }, { field: "url" }], {
        note: "Réseaux sociaux",
      }),
      f.divider("legal_divider", "Infos légales (footer + mentions)"),
      f.input("legal_name"),
      f.input("legal_status", { note: "Ex. micro-entreprise, EI…" }),
      f.input("siret"),
      f.textarea("legal_address"),
      f.input("vat_mention", { note: "Préremplie : TVA non applicable, art. 293 B du CGI" }),
      f.textarea("host_info", { note: "Hébergeur (nom, adresse)" }),
      f.divider("seo_defaults_divider", "SEO par défaut"),
      f.imageFile("default_og_image"),
      f.textarea("default_meta_description"),
    ],
  },
  {
    collection: "home_page",
    singleton: true,
    icon: "home",
    fields: [
      // — Hero (nommage CTA agnostique : principal = RDV, secondaire = ancre offres) —
      f.input("hero_title"),
      f.textarea("hero_subtitle"),
      f.tags("hero_tagline", { note: "Domaines (ex. Audit RH • GEPP • Management)" }),
      f.input("hero_cta_primary_label", { half: true, note: "CTA principal → /contact (RDV)" }),
      f.input("hero_cta_secondary_label", {
        half: true,
        note: "CTA secondaire → section offres (#offres)",
      }),
      f.tags("hero_proofs", { note: "Micro-preuves ✓ sous le hero" }),
      f.repeater("stats", [{ field: "value" }, { field: "label" }], {
        note: "Ligne de crédibilité (ex. « 10+ » / « ans »)",
      }),
      // — Problème : vous vous reconnaissez ? —
      f.divider("recognition_divider", "Vous vous reconnaissez ?"),
      f.input("recognition_title"),
      f.textarea("recognition_subtitle"),
      f.repeater("recognition_items", [{ field: "text", interface: "input-multiline" }], {
        note: "Problématiques (5–6, une par entrée)",
      }),
      f.textarea("recognition_conclusion"),
      // — Promesse / Offre : ce que je vous aide à construire (ancre #offres) —
      f.divider("build_divider", "Promesse / Offre (#offres)"),
      f.input("build_title"),
      f.repeater(
        "build_blocks",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Blocs services (titre + texte)" },
      ),
      f.input("build_cta_label", { half: true, note: "CTA section (ex. « Explorer »)" }),
      f.input("build_cta_url", { half: true, note: "Cible du CTA (défaut /organisations)" }),
      // — Ma méthode (ancre #approche, étapes numérotées automatiquement) —
      f.divider("method_divider", "Ma méthode (#approche)"),
      f.input("method_title"),
      f.textarea("method_subtitle"),
      f.repeater(
        "method_steps",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Étapes (numérotées à l'affichage)" },
      ),
      // — Signature / Positionnement (double expertise) —
      f.divider("why_divider", "Signature / Positionnement"),
      f.input("why_title"),
      f.textarea("why_subtitle"),
      f.repeater(
        "why_items",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Piliers (double expertise)" },
      ),
      f.textarea("why_conclusion"),
      // — À propos —
      f.divider("intro_divider", "À propos"),
      f.input("intro_title"),
      f.textarea("intro_text"),
      f.imageFile("intro_photo"),
      f.input("intro_cta_label", { note: "Défaut : « Découvrir mon parcours »" }),
      // — Vous êtes un particulier ? —
      f.divider("b2c_section_divider", "Vous êtes un particulier ?"),
      f.input("b2c_section_title"),
      f.textarea("b2c_section_text"),
      f.repeater(
        "b2c_cards",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Cartes accompagnement particuliers" },
      ),
      f.input("b2c_cta_label"),
      // — Témoignage vedette —
      f.divider("testimonial_divider", "Témoignage vedette"),
      f.m2o("featured_testimonial", "testimonials", {
        note: "Témoignage vedette (masqué si vide)",
      }),
      // — Ressources (3 derniers articles) —
      f.divider("resources_divider", "Ressources"),
      f.input("resources_title"),
      f.textarea("resources_subtitle"),
      f.input("resources_cta_label"),
      // — CTA final (phrase de clôture + réassurance) —
      f.divider("home_cta_divider", "CTA final"),
      f.input("final_cta_title"),
      f.textarea("final_cta_description", { note: "Sous-texte rassurant (réassurance)" }),
      f.input("final_cta_label"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "about_page",
    singleton: true,
    icon: "person",
    fields: [
      f.textarea("accroche", { note: "Texte court mis en avant" }),
      f.imageFile("story_photo"),
      f.richtext("story_body", { note: "Mon histoire" }),
      f.input("why_title"),
      f.richtext("why_body"),
      f.richtext("octopus_body", { note: "Le poulpe — avec humour" }),
      f.repeater(
        "convictions",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Ce en quoi je crois" },
      ),
      f.repeater("how_i_work", [{ field: "text" }]),
      f.richtext("what_i_dont_do"),
      f.imageFile("portrait_photo"),
      f.textarea("personal_quote"),
      f.input("cta_label"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "org_hub_page",
    singleton: true,
    icon: "corporate_fare",
    note: "Offres & témoignages branchés dynamiquement (audience=organisation)",
    fields: [
      f.input("accroche_title"),
      f.textarea("accroche_body"),
      f.imageFile("accroche_photo"),
      f.repeater(
        "method_steps",
        [
          { field: "number" },
          { field: "title" },
          { field: "description", interface: "input-multiline" },
        ],
        {
          note: "Cadrage / Diagnostic / Construction / Restitution",
        },
      ),
      f.repeater("audience_items", [{ field: "text" }], { note: "Pour qui" }),
      f.input("cta_title"),
      f.input("cta_label"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "b2c_hub_page",
    singleton: true,
    icon: "diversity_3",
    note: "FAQ branchée dynamiquement (faq_items scope=b2c)",
    fields: [
      f.input("accroche_title"),
      f.textarea("accroche_body"),
      f.imageFile("accroche_photo"),
      f.divider("sit_a_divider", "Situation A"),
      f.input("situation_a_title"),
      f.textarea("situation_a_body"),
      f.input("situation_a_cta_label", { half: true }),
      f.input("situation_a_cta_link", { half: true }),
      f.divider("sit_b_divider", "Situation B"),
      f.input("situation_b_title"),
      f.textarea("situation_b_body"),
      f.input("situation_b_cta_label", { half: true }),
      f.input("situation_b_cta_link", { half: true }),
      f.richtext("how_i_work_body"),
      f.m2o("testimonial", "testimonials"),
      f.input("cta_label"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "resources_page",
    singleton: true,
    icon: "menu_book",
    note: "Catégories branchées dynamiquement (article_categories)",
    fields: [
      f.input("accroche_title"),
      f.textarea("accroche_body"),
      f.m2o("featured_resource", "resources"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "shop_page",
    singleton: true,
    icon: "storefront",
    note: "Boutique : activation + libellés éditoriaux (générique — pas seulement des jeux)",
    fields: [
      f.bool("shop_enabled", false, {
        note: "Active la boutique : lien de navigation + accès aux pages /boutique",
      }),
      f.input("title", { note: "Titre de la page (ex. « La boutique »)" }),
      f.textarea("intro", { note: "Chapeau sous le titre" }),
      f.textarea("empty_message", {
        note: "Affiché quand la boutique est ouverte mais sans produit disponible",
      }),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "newsletter_page",
    singleton: true,
    icon: "mail",
    fields: [
      f.input("name", { note: "Ex. « Le Fil »" }),
      f.richtext("promise_body"),
      f.repeater("what_you_receive", [{ field: "text" }]),
      f.m2o("welcome_gift_label", "resources", { note: "Cadeau de bienvenue (optionnel)" }),
      f.textarea("sample_excerpt"),
      f.input("sample_issue_label", { note: "Ex. « Extrait du Fil #07 »" }),
      f.textarea("rgpd_mention"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "contact_page",
    singleton: true,
    icon: "alternate_email",
    note: "FAQ branchée dynamiquement (faq_items scope=contact)",
    fields: [
      f.input("accroche_title"),
      f.textarea("accroche_body"),
      f.textarea("booking_intro", { note: "Texte au-dessus de l'embed RDV" }),
      f.repeater("next_steps", [
        { field: "number" },
        { field: "title" },
        { field: "description", interface: "input-multiline" },
      ]),
      f.textarea("response_time_note", { note: "Ex. « Je réponds sous 48h ouvrées… »" }),
      ...f.seoBlock(),
    ],
  },
];

// ── Collections (contenu répétable) ──────────────────────────────────────────

const collections: CollectionDef[] = [
  {
    collection: "legal_documents",
    icon: "gavel",
    note: "Mentions légales, CGV, CGU, confidentialité",
    fields: [f.input("title"), f.slug(), f.richtext("body"), ...publishable()],
  },
  {
    collection: "offers",
    icon: "work",
    note: "Offres B2B + B2C — schéma phase 1, contenu détaillé phase 2",
    fields: [
      f.input("title"),
      f.slug(),
      f.select("audience", AUDIENCE, { required: true, half: true }),
      f.input("icon", { note: "Clé d'icône", half: true }),
      f.textarea("short_description", { note: "Pour la carte du hub" }),
      f.input("duration_label", { half: true }),
      f.input("price_label", { note: "Texte libre — ex. « 1 500 – 2 500 € HT »", half: true }),
      f.input("price_note"),
      f.input("accroche_title"),
      f.textarea("accroche_body"),
      f.repeater("mission_includes", [{ field: "text" }], { note: "La mission inclut" }),
      f.repeater(
        "outcomes",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Résultats" },
      ),
      f.repeater("audience_fit", [{ field: "text" }], { note: "Pour qui" }),
      f.richtext("format_body"),
      f.m2o("featured_testimonial", "testimonials"),
      f.input("cta_label"),
      ...f.seoBlock(),
      ...publishable(),
    ],
  },
  {
    collection: "products",
    icon: "casino",
    note: "Contenu éditorial des produits de la boutique (serious games & autres). AUCUN prix/stock (→ Stripe). Lien stripe_product_id.",
    fields: [
      f.input("stripe_product_id", {
        note: "Lien vers Stripe (source des prix/stock)",
        required: true,
      }),
      f.input("name"),
      f.slug(),
      f.input("tagline"),
      f.richtext("description"),
      f.files("images", { note: "Galerie (alt obligatoire sur chaque fichier)" }),
      f.repeater("game_details", [{ field: "label" }, { field: "value" }], {
        note: "Ex. Joueurs, Durée, Public",
      }),
      f.select("audience", AUDIENCE_BOTH, { half: true }),
      f.bool("featured", false, { half: true }),
      ...f.seoBlock(),
      ...publishable(),
    ],
  },
  {
    collection: "testimonials",
    icon: "format_quote",
    note: "Réutilisables. Toute section témoignage se masque proprement si vide.",
    fields: [
      f.textarea("quote", { required: true }),
      f.input("author_name", { half: true }),
      f.input("author_title", { half: true }),
      f.input("company", { half: true }),
      f.select("audience", AUDIENCE, { half: true }),
      f.input("context", { note: "Secteur / enjeu (optionnel)" }),
      f.bool("featured", false, { half: true }),
      ...publishable(),
    ],
  },
  {
    collection: "faq_items",
    icon: "help",
    note: "FAQ réutilisables, filtrées par périmètre (scope)",
    fields: [
      f.input("question"),
      f.richtext("answer"),
      f.select("scope", FAQ_SCOPE, { required: true, half: true }),
      ...publishable(),
    ],
  },
  {
    collection: "articles",
    icon: "article",
    note: "Blog — schéma phase 1, contenu phases 2-3",
    fields: [
      f.input("title"),
      f.slug(),
      f.textarea("excerpt", { note: "Chapeau 2 lignes" }),
      f.richtext("body"),
      f.imageFile("cover_image"),
      f.m2o("category", "article_categories"),
      f.integer("reading_time", { note: "Minutes (saisi ou calculé)", half: true }),
      f.datetime("published_at", { half: true }),
      ...f.seoBlock(),
      ...publishable(),
    ],
  },
  {
    collection: "article_categories",
    icon: "label",
    note: "Catégories du blog (3 grands filtres)",
    fields: [f.input("name"), f.slug(), f.select("group", ARTICLE_GROUP, { half: true }), f.sort()],
  },
  {
    collection: "resources",
    icon: "download",
    note: "Lead magnets (guides/checklists). Fichier sur R2.",
    fields: [
      f.input("title"),
      f.slug(),
      f.textarea("description"),
      f.file("file", { note: "PDF stocké sur R2" }),
      f.imageFile("cover_image"),
      f.bool("requires_email", false, { note: "Déclenche le gating par email", half: true }),
      f.select("audience", AUDIENCE, { half: true }),
      f.bool("featured", false, { half: true }),
      ...f.seoBlock(),
      ...publishable(),
    ],
  },
];

export const allCollections: CollectionDef[] = [...singletons, ...collections];

/** Collections de contenu exposées en lecture à l'app (et éditables par l'éditrice). */
export const contentCollections = allCollections.map((c) => c.collection);
