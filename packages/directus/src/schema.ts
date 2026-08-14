// Modèle de contenu Directus — traduction fidèle de docs/02-content-model.md.
// Source d'intention (diffable en review). Le moteur bootstrap.ts l'applique ;
// le snapshot YAML en est l'artefact reproductible. DRY : un concept = une ligne.
import * as f from "./fields.ts";
import { ICON_SUBFIELD } from "./icons.ts";

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
/**
 * Périmètres de FAQ. **Le libellé nomme la ou les PAGES d'affichage**, pas un thème :
 * c'est la seule façon pour l'éditrice de savoir où sortira sa question sans lire le
 * code (retour Éléonore 2026-08-06 — « je ne sais pas comment modifier la FAQ de
 * /particuliers »). Une non-évidence que les libellés doivent porter :
 *  - `general` ne sort **que** sur les 5 pages d'offre (ni hubs, ni contact).
 * Les valeurs stockées ne changent jamais (contenu existant préservé) ; seuls les
 * libellés évoluent. Consommé par le bootstrap ET par `reconcile.ts` (source unique).
 *
 * ⚠️ `b2c` désigne l'**offre Clarifier & avancer**, pas le hub. Ce périmètre était
 * partagé entre les deux jusqu'au 2026-08-14 ; Éléonore a tranché que ses questions
 * étaient justes pour l'offre, et a demandé une FAQ propre à chaque hub. La valeur
 * est restée `b2c` pour que ses 5 questions publiées ne bougent pas de page — la
 * renommer aurait exigé une migration de données sur la prod pour un gain purement
 * cosmétique. Le hub, lui, a désormais `b2c_hub` (symétrique de `org`).
 */
export const FAQ_SCOPE = [
  { text: "Page /contact", value: "contact" },
  { text: "Page /organisations", value: "org" },
  { text: "Page /particuliers", value: "b2c_hub" },
  { text: "Offre Audit RH", value: "audit" },
  { text: "Offre Compétences & parcours", value: "competences" },
  { text: "Offre Managers & équipes", value: "managers" },
  { text: "Offre Clarifier & avancer", value: "b2c" },
  { text: "Offre Booster sa recherche", value: "booster" },
  { text: "Toutes les offres (transverse)", value: "general" },
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
      f.textarea("hero_signature", {
        note: "Phrase signature (italique, sous le sous-titre du hero). Ex. « Une organisation avance mieux lorsque… »",
      }),
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
      f.repeater(
        "recognition_items",
        [ICON_SUBFIELD, { field: "text", interface: "input-multiline" }],
        { note: "Problématiques (5–6, une par entrée) — icône éditable par item" },
      ),
      f.textarea("recognition_conclusion"),
      // — Promesse / Offre : ce que je vous aide à construire (ancre #offres) —
      f.divider("build_divider", "Promesse / Offre (#offres)"),
      f.input("build_title"),
      f.repeater(
        "build_blocks",
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Blocs services (icône éditable + titre + texte)" },
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
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Cartes accompagnement particuliers (icône éditable + titre + texte)" },
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
      // §1 Accroche (h1 + chapeau)
      f.input("accroche_title"),
      f.richtext("accroche_body"),
      // §2 Mon parcours
      f.input("story_title"),
      f.imageFile("story_photo", {
        note: "Photo du 1er bloc, affichée à DROITE (optionnelle, non rognée)",
      }),
      f.richtext("story_body", { note: "Mon parcours — 1er bloc (texte à gauche)" }),
      f.imageFile("story_photo_2", {
        note: "Photo du 2e bloc, affichée à GAUCHE (optionnelle, non rognée)",
      }),
      f.richtext("story_body_2", {
        note: "Mon parcours — 2e bloc (texte à droite). Vide = bloc masqué",
      }),
      // §3 Pourquoi L'Encre Humaine ? + le poulpe
      f.input("why_title"),
      f.richtext("why_body", { note: "L'encre" }),
      f.input("octopus_subtitle", { note: "Ex. « Et pourquoi un poulpe ? »" }),
      f.richtext("octopus_body", { note: "Le poulpe" }),
      // §4 Convictions
      f.input("convictions_title"),
      f.repeater(
        "convictions",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Convictions professionnelles (titre + corps)" },
      ),
      // §5 Ma manière d'accompagner
      f.input("work_title"),
      f.textarea("work_intro"),
      f.repeater(
        "how_i_work",
        [{ field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Principes : affirmation (titre) + explication (corps)" },
      ),
      f.textarea("location", { note: "Zone d'intervention" }),
      // §6 Ce que je ne fais pas
      f.input("what_i_dont_do_title"),
      f.repeater("what_i_dont_do", [{ field: "text", interface: "input-multiline" }], {
        note: "Liste (une entrée par ligne, ✗ ajouté à l'affichage)",
      }),
      // §7 Portrait + citation (optionnels) + CTA
      f.imageFile("portrait_photo", { note: "Portrait (optionnel, section citation)" }),
      f.textarea("personal_quote"),
      f.input("cta_title"),
      f.textarea("cta_body"),
      f.input("cta_label"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "org_hub_page",
    singleton: true,
    icon: "corporate_fare",
    note: "Offres, témoignages & FAQ (scope=org) branchés dynamiquement (audience=organisation)",
    fields: [
      // §1 Accroche
      f.input("accroche_title"),
      f.textarea("accroche_subtitle"),
      f.textarea("accroche_body"),
      f.input("accroche_signature", { note: "Phrase signature" }),
      f.imageFile("accroche_photo"),
      // §2 Ce que j'observe
      f.input("observe_title"),
      f.textarea("observe_intro"),
      f.repeater(
        "observe_items",
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Constats (icône Material Symbols + titre + corps)" },
      ),
      f.textarea("observe_conclusion"),
      // §3 Offres (cartes dynamiques depuis `offers`) — titre de section
      f.input("offers_title"),
      // §3bis Trois enjeux, trois accompagnements (cartes détaillées, calquées
      // sur les situations B2C). Renseignées → remplacent les cartes compactes.
      f.divider("enjeux_divider", "Trois enjeux, trois accompagnements"),
      f.input("situations_title"),
      f.textarea("situations_intro"),
      f.divider("enjeu_a_divider", "Enjeu A"),
      f.input("situation_a_title"),
      f.textarea("situation_a_body", { note: "Chapô optionnel sous le titre de la carte" }),
      f.textarea("situation_a_audience", { note: "« Pour qui ? »" }),
      f.repeater("situation_a_items", [{ field: "text", interface: "input-multiline" }], {
        note: "« Ce que nous travaillons » (liste)",
      }),
      f.textarea("situation_a_result", { note: "« Résultat »" }),
      f.input("situation_a_cta_label", { half: true }),
      f.input("situation_a_cta_link", { half: true }),
      f.divider("enjeu_b_divider", "Enjeu B"),
      f.input("situation_b_title"),
      f.textarea("situation_b_body", { note: "Chapô optionnel sous le titre de la carte" }),
      f.textarea("situation_b_audience", { note: "« Pour qui ? »" }),
      f.repeater("situation_b_items", [{ field: "text", interface: "input-multiline" }], {
        note: "« Ce que nous travaillons » (liste)",
      }),
      f.textarea("situation_b_result", { note: "« Résultat »" }),
      f.input("situation_b_cta_label", { half: true }),
      f.input("situation_b_cta_link", { half: true }),
      f.divider("enjeu_c_divider", "Enjeu C"),
      f.input("situation_c_title"),
      f.textarea("situation_c_body", { note: "Chapô optionnel sous le titre de la carte" }),
      f.textarea("situation_c_audience", { note: "« Pour qui ? »" }),
      f.repeater("situation_c_items", [{ field: "text", interface: "input-multiline" }], {
        note: "« Ce que nous travaillons » (liste)",
      }),
      f.textarea("situation_c_result", { note: "« Résultat »" }),
      f.input("situation_c_cta_label", { half: true }),
      f.input("situation_c_cta_link", { half: true }),
      // §4 Ma façon de travailler
      f.input("method_title"),
      f.textarea("method_intro"),
      f.repeater(
        "method_steps",
        [
          { field: "number" },
          { field: "title" },
          { field: "description", interface: "input-multiline" },
        ],
        { note: "Comprendre / Clarifier / Construire / Ancrer" },
      ),
      // §5 Ce qui différencie l'approche
      f.input("differentiator_title"),
      f.richtext("differentiator_body"),
      // §6 Fait pour vous si…
      f.input("audience_title"),
      f.repeater("audience_items", [{ field: "text" }], { note: "Pour qui (✓)" }),
      f.textarea("audience_conclusion"),
      // §7 Témoignages (dynamiques) — titre de section
      f.input("testimonials_title"),
      // §8 CTA final
      f.input("cta_title"),
      f.textarea("cta_body"),
      f.input("cta_label"),
      f.input("cta_subtext", { note: "Sous-texte rassurant sous le bouton" }),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "b2c_hub_page",
    singleton: true,
    icon: "diversity_3",
    note: "FAQ branchée dynamiquement (faq_items scope=b2c). Gabarit riche calqué sur `offers`.",
    fields: [
      // 1. Accroche
      f.input("accroche_title"),
      f.textarea("accroche_subtitle", { note: "Sous-titre empathique sous le h1" }),
      f.textarea("accroche_body", { note: "Texte d'accroche (multi-paragraphes)" }),
      f.input("accroche_signature", { note: "Phrase signature" }),
      f.input("accroche_cta_label", { note: "CTA d'accroche → /contact" }),
      f.imageFile("accroche_photo"),
      // 2. Ce que vous venez chercher (bénéfices)
      f.divider("outcomes_divider", "Ce que vous venez chercher"),
      f.input("outcomes_title"),
      f.textarea("outcomes_intro"),
      f.repeater(
        "outcomes",
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Bénéfices (icône Material Symbols + titre + corps)" },
      ),
      // 3. Deux situations, deux accompagnements (cartes détaillées)
      f.divider("situations_divider", "Deux situations, deux accompagnements"),
      f.input("situations_title"),
      f.textarea("situations_intro"),
      f.divider("sit_a_divider", "Situation A"),
      f.input("situation_a_title"),
      f.textarea("situation_a_body", { note: "Chapô optionnel sous le titre de la carte" }),
      f.textarea("situation_a_audience", { note: "« Pour qui ? »" }),
      f.repeater("situation_a_items", [{ field: "text", interface: "input-multiline" }], {
        note: "« Ce que nous travaillons » (liste)",
      }),
      f.textarea("situation_a_result", { note: "« Résultat »" }),
      f.input("situation_a_cta_label", { half: true }),
      f.input("situation_a_cta_link", { half: true }),
      f.divider("sit_b_divider", "Situation B"),
      f.input("situation_b_title"),
      f.textarea("situation_b_body", { note: "Chapô optionnel sous le titre de la carte" }),
      f.textarea("situation_b_audience", { note: "« Pour qui ? »" }),
      f.repeater("situation_b_items", [{ field: "text", interface: "input-multiline" }], {
        note: "« Ce que nous travaillons » (liste)",
      }),
      f.textarea("situation_b_result", { note: "« Résultat »" }),
      f.input("situation_b_cta_label", { half: true }),
      f.input("situation_b_cta_link", { half: true }),
      // 4. Ma façon d'accompagner
      f.divider("how_i_work_divider", "Ma façon d'accompagner"),
      f.input("how_i_work_title"),
      f.richtext("how_i_work_body"),
      f.textarea("how_i_work_signature", { note: "Encadré signature (facultatif)" }),
      // 5. Pourquoi cet accompagnement est différent
      f.divider("why_different_divider", "Pourquoi c'est différent"),
      f.input("why_different_title"),
      f.richtext("why_different_body", { note: "Texte narratif (liste possible)" }),
      // 6. Comment se déroule l'accompagnement
      f.divider("format_divider", "Comment se déroule l'accompagnement"),
      f.input("format_title"),
      f.repeater("format_items", [{ field: "text" }], { note: "Format (visio, rythme…)" }),
      f.textarea("format_body"),
      // 8. Témoignage
      f.m2o("testimonial", "testimonials"),
      // 9. Appel à l'action
      f.divider("cta_divider", "Appel à l'action"),
      f.input("cta_title"),
      f.textarea("cta_body"),
      f.input("cta_label"),
      f.input("cta_subtext", { note: "Sous-texte rassurant sous le bouton" }),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "resources_page",
    singleton: true,
    icon: "menu_book",
    note: "Blog + newsletter fusionnés (« Les Tentacules »). Catégories dynamiques (article_categories).",
    fields: [
      f.input("accroche_title"),
      f.textarea("accroche_body"),
      f.textarea("hero_signature", {
        note: "Signature sous l'accroche (ex. « 🐙 Les Tentacules… »)",
      }),
      f.m2o("featured_article", "articles", { note: "Article « à lire en premier »" }),
      f.m2o("featured_resource", "resources", {
        note: "Ancien lead magnet vedette — déprécié (le lead magnet vit dans newsletter_page)",
      }),
      f.repeater(
        "explore_cards",
        [
          {
            field: "group",
            interface: "select-dropdown",
            width: "half",
            options: { choices: ARTICLE_GROUP, allowNone: true },
          },
          ICON_SUBFIELD,
          { field: "label" },
          { field: "keywords", interface: "input-multiline" },
        ],
        {
          note: "Cartes « Explorer les Tentacules » : le groupe doit correspondre à une catégorie d'articles ; mots-clés séparés par « • ». Non renseigné = valeurs par défaut.",
        },
      ),
      f.divider("positioning_divider", "Positionnement"),
      f.input("positioning_title"),
      f.richtext("positioning_body", { note: "Approche terrain (listes possibles)" }),
      f.imageFile("positioning_photo", {
        note: "Visuel à côté du texte (optionnel, masqué si vide)",
      }),
      f.input("cta_title", { note: "Titre du CTA final (→ inscription newsletter)" }),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "shop_page",
    singleton: true,
    icon: "science",
    note: "« Le Laboratoire » (/laboratoire) : page vitrine des outils en préparation + boutique quand elle ouvre",
    fields: [
      f.bool("shop_enabled", false, {
        note: "Ouvre la VENTE : catalogue produits + paiement. La page vitrine, elle, est toujours visible",
      }),
      f.input("title", { note: "Titre de la page (ex. « Le Laboratoire »)" }),
      f.textarea("intro", {
        note: "Sous-titre sous le titre (ex. « Des outils conçus à partir du terrain. »)",
      }),
      f.richtext("hero_body", { note: "Paragraphes d'introduction du Laboratoire" }),
      f.imageFile("hero_image", { note: "Illustration du hero (optionnelle, masquée si vide)" }),
      f.textarea("empty_message", {
        note: "Affiché quand la vente est ouverte mais qu'aucun produit n'est disponible",
      }),
      // §2 Ce que vous trouverez bientôt
      f.divider("catalog_divider", "Ce que vous trouverez bientôt"),
      f.input("catalog_title"),
      f.repeater(
        "catalog_items",
        [
          ICON_SUBFIELD,
          { field: "status", width: "half" },
          { field: "title" },
          { field: "body", interface: "input-multiline" },
        ],
        {
          note: "Familles d'outils : icône + titre + description + statut (ex. « En cours de conception »)",
        },
      ),
      // §3 En ce moment…
      f.divider("focus_divider", "En ce moment…"),
      f.input("focus_eyebrow", { note: "Ex. « En ce moment… »" }),
      f.input("focus_title"),
      f.richtext("focus_body"),
      f.imageFile("focus_image", { note: "Visuel à gauche du texte (optionnel)" }),
      f.input("focus_cta_label", { note: "Ex. « Contribuer au questionnaire »", half: true }),
      f.input("focus_cta_url", { note: "Lien du bouton (questionnaire externe)", half: true }),
      // §4 Manifeste
      f.divider("manifesto_divider", "Le parti pris du jeu"),
      f.input("manifesto_title"),
      f.input("manifesto_subtitle"),
      f.richtext("manifesto_body"),
      f.imageFile("manifesto_image", { note: "Visuel à droite du texte (optionnel)" }),
      // §5 Pourquoi ce Laboratoire (optionnel : masqué tant qu'il est vide)
      f.divider("why_divider", "Pourquoi ce Laboratoire ?"),
      f.input("why_title"),
      f.repeater("why_items", [ICON_SUBFIELD, { field: "title" }, { field: "body" }], {
        note: "Section optionnelle : masquée tant qu'aucun item n'est saisi",
      }),
      // §6 Invitation newsletter
      f.divider("newsletter_divider", "Invitation à la newsletter"),
      f.input("newsletter_title", {
        note: "Ex. « Vous souhaitez être informé des prochaines sorties ? »",
      }),
      f.textarea("newsletter_body"),
      ...f.seoBlock(),
    ],
  },
  {
    collection: "newsletter_page",
    singleton: true,
    icon: "mail",
    note: "Newsletter « Les Tentacules » — rendue dans la section newsletter de /ressources.",
    fields: [
      f.input("name", { note: "Ex. « Les Tentacules de L'Encre Humaine »" }),
      f.textarea("subtitle", { note: "Sous-titre (ex. « Une fois tous les 15 jours… »)" }),
      f.richtext("promise_body"),
      f.repeater("helps_with", [{ field: "text" }], { note: "« Chaque édition aide à… »" }),
      f.repeater("what_you_receive", [{ field: "text" }], { note: "« Contenu d'une édition »" }),
      f.m2o("welcome_gift_label", "resources", { note: "Cadeau de bienvenue (lead magnet)" }),
      f.textarea("sample_excerpt"),
      f.input("sample_issue_label", { note: "Ex. « Extrait #07 »" }),
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
      f.textarea("accroche_subtitle", { note: "Chapeau sous le titre (hero)" }),
      f.textarea("accroche_body", { note: "Encadré « Certaines situations… » à droite du hero" }),
      // Deux voies de contact (carte RDV + carte message)
      f.textarea("contact_intro", {
        note: "Introduction sous le titre de la section « Premier contact »",
      }),
      f.textarea("booking_intro", { note: "Texte de la carte « Réserver un échange »" }),
      f.textarea("booking_reassurance", {
        note: "Réassurance sous le RDV (ex. « 🐙 Aucun tentacule commercial caché… »)",
      }),
      f.textarea("message_intro", { note: "Texte de la carte « M'envoyer un message »" }),
      // Comment se déroule le premier échange
      f.input("steps_title", { note: "Ex. « Comment se déroule notre premier échange ? »" }),
      f.repeater("next_steps", [
        { field: "number" },
        { field: "title" },
        { field: "description", interface: "input-multiline" },
      ]),
      f.textarea("steps_conclusion", { note: "Conclusion sous les étapes (optionnel)" }),
      f.textarea("response_time_note", { note: "Ex. « Je réponds sous 48h ouvrées… »" }),
      // Vous pouvez me contacter si…
      f.divider("reasons_divider", "Vous pouvez me contacter si…"),
      f.input("reasons_title"),
      f.input("reasons_org_lead", {
        note: "Amorce de la colonne organisations (ex. « Vous souhaitez… »)",
      }),
      f.repeater("reasons_org", [{ field: "text", interface: "input-multiline" }], {
        note: "Pour les organisations",
      }),
      f.input("reasons_b2c_lead", {
        note: "Amorce de la colonne particuliers (ex. « Aujourd'hui… »)",
      }),
      f.repeater("reasons_b2c", [{ field: "text", interface: "input-multiline" }], {
        note: "Pour les particuliers",
      }),
      // CTA final
      f.divider("contact_cta_divider", "CTA final"),
      f.input("final_cta_title"),
      f.textarea("final_cta_body"),
      f.textarea("final_cta_subtext", { note: "Réassurance sous le bouton du CTA final" }),
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
      // Accroche
      f.input("accroche_title"),
      f.textarea("accroche_subtitle"),
      f.textarea("accroche_body"),
      f.input("accroche_signature", { note: "Phrase signature" }),
      // Ce que ça change (bénéfices)
      f.input("outcomes_title"),
      f.textarea("outcomes_intro"),
      f.repeater(
        "outcomes",
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Bénéfices (icône Material Symbols + titre + corps)" },
      ),
      // Ce que je vois souvent (contexte)
      f.input("context_title"),
      f.repeater(
        "context_items",
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "Situations récurrentes (icône + titre + corps)" },
      ),
      f.textarea("context_conclusion"),
      // Une approche qui relie compétences et parcours (optionnel)
      f.input("approche_title"),
      f.richtext("approche_body", { note: "Texte narratif (puces possibles)" }),
      f.textarea("approche_signature", { note: "Encadré signature (facultatif)" }),
      // Ce que comprend la mission
      f.input("mission_title"),
      f.textarea("mission_intro", { note: "Intro sous le titre de la mission (optionnel)" }),
      f.repeater(
        "mission_includes",
        [ICON_SUBFIELD, { field: "title" }, { field: "body", interface: "input-multiline" }],
        { note: "La mission inclut (icône + titre + corps)" },
      ),
      // Un regard / une expérience (optionnel — récit narratif avec listes)
      f.input("background_title"),
      f.richtext("background_body", {
        note: "Récit d'expérience / regard terrain (puces possibles)",
      }),
      f.input("format_title", {
        note: "Titre de la section format (défaut : « Comment ça se passe »)",
      }),
      f.richtext("format_body", { note: "Comment ça se passe (optionnel)" }),
      // Pour qui
      f.input("audience_fit_title"),
      f.repeater("audience_fit", [{ field: "text" }], { note: "Pour qui (✓)" }),
      f.repeater("audience_fit_exclude", [{ field: "text", interface: "input-multiline" }], {
        note: "Pas pour vous (✗) — optionnel",
      }),
      f.textarea("audience_fit_conclusion"),
      // Ce que vous emportez (livrables — optionnel)
      f.input("takeaways_title"),
      f.textarea("takeaways_intro"),
      f.repeater("takeaways", [{ field: "text", interface: "input-multiline" }], {
        note: "Ce que vous emportez (✓)",
      }),
      // Témoignage + CTA
      f.m2o("featured_testimonial", "testimonials"),
      f.input("cta_title"),
      f.textarea("cta_body"),
      f.input("cta_label"),
      f.input("cta_subtext", { note: "Sous-texte sous le bouton" }),
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
    note: "FAQ réutilisables — le périmètre (scope) nomme la page où la question s'affiche",
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
