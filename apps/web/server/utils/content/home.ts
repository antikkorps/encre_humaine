import { readItems, readSingleton } from "@directus/sdk";
import type { ArticleSummary, Stat, TestimonialItem } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  fileAlt,
  fileUrl,
  mapPhoto,
  mapSeo,
  mapStringList,
  mapTestimonialItem,
  mapTitledItems,
  type RawSiteDefaults,
  records,
  str,
  type TitledItem,
} from "./_shared";

/**
 * Contenu de la page d'accueil — docs/01-accueil.md, docs/02-content-model.md §4.
 * Source : `home_page` (singleton) + `articles` (3 derniers publiés) + `site_settings`
 * (défauts SEO). On NE rend QUE du contenu venu de Directus (critère d'acceptation :
 * « aucune donnée en dur qui devrait venir de home_page ») ; les seuls fallbacks sont
 * des garde-fous d'affichage pour les éléments toujours visibles (titre/CTA du hero),
 * jamais du contenu éditorial.
 *
 * Les `map*` sont **purs** (testables sans réseau, cf. test/home.spec.ts) ;
 * `loadHomeContent` orchestre les appels Directus. Helpers communs dans `_shared`.
 * Les sections dynamiques (témoignage, articles, blocs) se masquent si vides.
 */

// — Formes brutes (sous-ensemble Directus consommé ; cf. schema.gen Home/Articles) —

export interface RawTestimonial {
  quote?: string | null;
  author_name?: string | null;
  author_title?: string | null;
  company?: string | null;
  context?: string | null;
  audience?: string | null;
}

export interface RawArticle {
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  reading_time?: number | null;
  published_at?: string | null;
  cover_image?: FileField;
  category?: { name?: string | null; slug?: string | null; group?: string | null } | string | null;
}

export interface RawHome {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_signature?: string | null;
  hero_tagline?: unknown;
  hero_proofs?: unknown;
  hero_cta_primary_label?: string | null;
  hero_cta_secondary_label?: string | null;
  stats?: unknown;
  recognition_title?: string | null;
  recognition_subtitle?: string | null;
  recognition_items?: unknown;
  recognition_conclusion?: string | null;
  build_title?: string | null;
  build_blocks?: unknown;
  build_cta_label?: string | null;
  build_cta_url?: string | null;
  method_title?: string | null;
  method_subtitle?: string | null;
  method_steps?: unknown;
  why_title?: string | null;
  why_subtitle?: string | null;
  why_items?: unknown;
  why_conclusion?: string | null;
  intro_title?: string | null;
  intro_text?: string | null;
  intro_photo?: FileField;
  intro_cta_label?: string | null;
  b2c_section_title?: string | null;
  b2c_section_text?: string | null;
  b2c_cards?: unknown;
  b2c_cta_label?: string | null;
  featured_testimonial?: RawTestimonial | string | null;
  resources_title?: string | null;
  resources_subtitle?: string | null;
  resources_cta_label?: string | null;
  final_cta_title?: string | null;
  final_cta_description?: string | null;
  final_cta_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

// — Forme exposée à la page (sections optionnelles = null → masquées) —

export interface HomeContent {
  hero: {
    title: string;
    subtitle: string | null;
    /** Phrase signature (italique, sous le sous-titre) — masquée si vide. */
    signature: string | null;
    /** Ligne d'expertise (Audit RH • GEPP • …). */
    tagline: string[];
    /** Micro-preuves ✓. */
    proofs: string[];
    /** Principal → /contact (RDV). */
    ctaPrimaryLabel: string;
    /** Secondaire → section méthode (#approche). */
    ctaSecondaryLabel: string;
  };
  stats: Stat[];
  recognition: {
    title: string;
    subtitle: string | null;
    /** Problématiques : texte + icône éditable (clé Material Symbols, optionnelle). */
    items: { text: string; icon?: string }[];
    conclusion: string | null;
  } | null;
  build: {
    title: string;
    blocks: TitledItem[];
    /** CTA de section (« Explorer »), `null` si non renseigné. */
    ctaLabel: string | null;
    ctaUrl: string;
  } | null;
  method: { title: string; subtitle: string | null; steps: TitledItem[] } | null;
  why: {
    title: string;
    subtitle: string | null;
    items: TitledItem[];
    conclusion: string | null;
  } | null;
  intro: {
    title: string;
    text: string | null;
    photo: ContentPhoto | null;
    ctaLabel: string;
  } | null;
  b2c: { title: string; text: string | null; cards: TitledItem[]; ctaLabel: string } | null;
  featuredTestimonial: TestimonialItem | null;
  articles: ArticleSummary[];
  /** Toujours présent (titres à défaut) ; la section se masque si aucun article. */
  resources: { title: string; subtitle: string | null; ctaLabel: string };
  finalCta: { title: string; description: string | null; label: string } | null;
  seo: ContentSeo;
}

// — Mappers purs —

/** Ligne de crédibilité : valeur + label requis (item incomplet masqué, docs/01 §2). */
export function mapStats(raw: unknown): Stat[] {
  return records(raw)
    .map((s) => ({ value: str(s.value), label: str(s.label) }))
    .filter((s) => s.value !== "" && s.label !== "");
}

/** Problème « Vous vous reconnaissez ? » : masqué si totalement vide (docs/01 §2). */
export function mapRecognition(home: RawHome): HomeContent["recognition"] {
  const title = str(home.recognition_title);
  const subtitle = str(home.recognition_subtitle);
  // Répéteur `[{ text, icon? }]` (l'icône devient éditable au run 8) ; tolère
  // aussi l'ancienne forme liste-de-chaînes. Entrées sans texte exclues.
  const items = records(home.recognition_items)
    .map((it) => ({ text: str(it.text) || str(it.value), icon: str(it.icon) || undefined }))
    .filter((it) => it.text !== "");
  const conclusion = str(home.recognition_conclusion);
  if (!title && !subtitle && !items.length && !conclusion) return null;
  return { title, subtitle: subtitle || null, items, conclusion: conclusion || null };
}

/** Promesse / Offre : 3 blocs services + CTA de section (docs/01 §3). */
export function mapBuild(home: RawHome): HomeContent["build"] {
  const title = str(home.build_title);
  const blocks = mapTitledItems(home.build_blocks);
  if (!title && !blocks.length) return null;
  return {
    title,
    blocks,
    ctaLabel: str(home.build_cta_label) || null,
    ctaUrl: str(home.build_cta_url) || "/organisations",
  };
}

/** Méthode : étapes numérotées à l'affichage (docs/01 §4). */
export function mapMethod(home: RawHome): HomeContent["method"] {
  const title = str(home.method_title);
  const subtitle = str(home.method_subtitle);
  const steps = mapTitledItems(home.method_steps);
  if (!title && !subtitle && !steps.length) return null;
  return { title, subtitle: subtitle || null, steps };
}

/** Signature / Positionnement : piliers de la double expertise (docs/01 §5). */
export function mapWhy(home: RawHome): HomeContent["why"] {
  const title = str(home.why_title);
  const subtitle = str(home.why_subtitle);
  const items = mapTitledItems(home.why_items);
  const conclusion = str(home.why_conclusion);
  if (!title && !subtitle && !items.length && !conclusion) return null;
  return { title, subtitle: subtitle || null, items, conclusion: conclusion || null };
}

/** Particuliers : 2 axes d'accompagnement (docs/01 §7). */
export function mapB2c(home: RawHome): HomeContent["b2c"] {
  const title = str(home.b2c_section_title);
  const text = str(home.b2c_section_text);
  const cards = mapTitledItems(home.b2c_cards);
  if (!title && !text && !cards.length) return null;
  return {
    title,
    text: text || null,
    cards,
    ctaLabel: str(home.b2c_cta_label) || "Découvrir les accompagnements",
  };
}

/** Témoignage vedette : requiert une citation, sinon section masquée (docs/01 §5). */
export function mapTestimonial(raw: RawHome["featured_testimonial"]): TestimonialItem | null {
  return mapTestimonialItem(raw);
}

export function mapArticle(raw: RawArticle, assetBase: string): ArticleSummary {
  const cat = raw.category && typeof raw.category === "object" ? raw.category : null;
  return {
    title: str(raw.title),
    slug: str(raw.slug),
    excerpt: str(raw.excerpt) || undefined,
    coverImage: fileUrl(raw.cover_image, assetBase) ?? undefined,
    coverAlt: fileAlt(raw.cover_image) || undefined,
    categoryName: (cat && str(cat.name)) || undefined,
    categorySlug: (cat && str(cat.slug)) || undefined,
    categoryGroup: (cat && str(cat.group)) || undefined,
    readingTime: typeof raw.reading_time === "number" ? raw.reading_time : undefined,
    publishedAt: str(raw.published_at) || undefined,
  };
}

/** 3 derniers articles ; section masquée si aucun (docs/01 §6). */
export function mapArticles(raws: unknown, assetBase: string): ArticleSummary[] {
  return (Array.isArray(raws) ? (raws as RawArticle[]) : [])
    .map((r) => mapArticle(r, assetBase))
    .filter((a) => a.slug !== "");
}

/** À propos : incarné (photo + texte), masqué si ni titre ni texte (docs/01 §6). */
export function mapIntro(home: RawHome, assetBase: string): HomeContent["intro"] {
  const title = str(home.intro_title);
  const text = str(home.intro_text);
  if (!title && !text) return null;
  return {
    title,
    text: text || null,
    photo: mapPhoto(home.intro_photo, assetBase),
    ctaLabel: str(home.intro_cta_label) || "Découvrir mon parcours",
  };
}

/** Compose le payload de la page (pur). Fallbacks = garde-fous d'affichage, jamais du contenu éditorial. */
export function mapHomeContent(
  home: RawHome,
  articles: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
): HomeContent {
  const finalTitle = str(home.final_cta_title);
  return {
    hero: {
      title: str(home.hero_title) || "L'Encre Humaine",
      subtitle: str(home.hero_subtitle) || null,
      signature: str(home.hero_signature) || null,
      tagline: mapStringList(home.hero_tagline),
      proofs: mapStringList(home.hero_proofs),
      ctaPrimaryLabel: str(home.hero_cta_primary_label) || "Prendre rendez-vous",
      ctaSecondaryLabel: str(home.hero_cta_secondary_label) || "Découvrir l'approche",
    },
    stats: mapStats(home.stats),
    recognition: mapRecognition(home),
    build: mapBuild(home),
    method: mapMethod(home),
    why: mapWhy(home),
    intro: mapIntro(home, assetBase),
    b2c: mapB2c(home),
    featuredTestimonial: mapTestimonial(home.featured_testimonial),
    articles: mapArticles(articles, assetBase),
    resources: {
      title: str(home.resources_title) || "Réflexions, outils et retours de terrain.",
      subtitle: str(home.resources_subtitle) || null,
      ctaLabel: str(home.resources_cta_label) || "Voir toutes les ressources",
    },
    finalCta: finalTitle
      ? {
          title: finalTitle,
          description: str(home.final_cta_description) || null,
          label: str(home.final_cta_label) || "Prendre rendez-vous",
        }
      : null,
    seo: mapSeo(home, settings, assetBase),
  };
}

/** Charge et compose le contenu de l'accueil (Directus published, lecture seule). */
export async function loadHomeContent(): Promise<HomeContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [home, articles, settings] = await Promise.all([
    client.request(
      readSingleton("home_page", {
        fields: [
          "hero_title",
          "hero_subtitle",
          "hero_signature",
          "hero_tagline",
          "hero_proofs",
          "hero_cta_primary_label",
          "hero_cta_secondary_label",
          "stats",
          "recognition_title",
          "recognition_subtitle",
          "recognition_items",
          "recognition_conclusion",
          "build_title",
          "build_blocks",
          "build_cta_label",
          "build_cta_url",
          "method_title",
          "method_subtitle",
          "method_steps",
          "why_title",
          "why_subtitle",
          "why_items",
          "why_conclusion",
          "intro_title",
          "intro_text",
          // Champs fichier = ID brut (directus_files hors Schema typé, cf. shop.ts) → URL d'asset.
          "intro_photo",
          "intro_cta_label",
          "b2c_section_title",
          "b2c_section_text",
          "b2c_cards",
          "b2c_cta_label",
          {
            featured_testimonial: [
              "quote",
              "author_name",
              "author_title",
              "company",
              "context",
              "audience",
            ],
          },
          "resources_title",
          "resources_subtitle",
          "resources_cta_label",
          "final_cta_title",
          "final_cta_description",
          "final_cta_label",
          "meta_title",
          "meta_description",
          "og_image",
          "no_index",
        ],
      }),
    ),
    client.request(
      readItems("articles", {
        filter: { status: { _eq: "published" } },
        sort: ["-published_at"],
        // Carrousel « Les Tentacules » (run 9) : on charge jusqu'à 8 articles pour
        // qu'on puisse « se balader » ; la carte finale renvoie vers /ressources.
        limit: 8,
        fields: [
          "title",
          "slug",
          "excerpt",
          "reading_time",
          "published_at",
          "cover_image",
          { category: ["name"] },
        ],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapHomeContent(
    home as unknown as RawHome,
    articles,
    settings as unknown as RawSiteDefaults,
    assetBase,
  );
}
