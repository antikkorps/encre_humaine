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
  type RawSiteDefaults,
  records,
  str,
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
  category?: { name?: string | null } | string | null;
}

export interface RawHome {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_cta_b2b_label?: string | null;
  hero_cta_b2c_label?: string | null;
  stats?: unknown;
  block_b2b_title?: string | null;
  block_b2b_text?: string | null;
  block_b2b_tags?: unknown;
  block_b2c_title?: string | null;
  block_b2c_text?: string | null;
  block_b2c_tags?: unknown;
  intro_title?: string | null;
  intro_text?: string | null;
  intro_photo?: FileField;
  featured_testimonial?: RawTestimonial | string | null;
  final_cta_title?: string | null;
  final_cta_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

// — Forme exposée à la page —

export interface HomeBlock {
  title: string;
  text: string | null;
  tags: string[];
  /** Lien vers le hub correspondant. */
  to: string;
}

export interface HomeContent {
  hero: {
    title: string;
    subtitle: string | null;
    ctaB2bLabel: string;
    ctaB2cLabel: string;
  };
  stats: Stat[];
  blockB2b: HomeBlock | null;
  blockB2c: HomeBlock | null;
  intro: { title: string; text: string | null; photo: ContentPhoto | null } | null;
  featuredTestimonial: TestimonialItem | null;
  articles: ArticleSummary[];
  finalCta: { title: string; label: string } | null;
  seo: ContentSeo;
}

// — Mappers purs —

/** Ligne de crédibilité : valeur + label requis (item incomplet masqué, docs/01 §2). */
export function mapStats(raw: unknown): Stat[] {
  return records(raw)
    .map((s) => ({ value: str(s.value), label: str(s.label) }))
    .filter((s) => s.value !== "" && s.label !== "");
}

/** Bloc « Ce que je fais » : masqué si pas de titre (docs/01 §3). */
export function mapBlock(
  title: unknown,
  text: unknown,
  tags: unknown,
  to: string,
): HomeBlock | null {
  const t = str(title);
  if (!t) return null;
  return { title: t, text: str(text) || null, tags: mapStringList(tags), to };
}

/** Témoignage vedette : requiert une citation, sinon section masquée (docs/01 §5). */
export function mapTestimonial(raw: RawHome["featured_testimonial"]): TestimonialItem | null {
  return mapTestimonialItem(raw);
}

export function mapArticle(raw: RawArticle, assetBase: string): ArticleSummary {
  const cat = raw.category;
  const categoryName = cat && typeof cat === "object" ? str(cat.name) || undefined : undefined;
  return {
    title: str(raw.title),
    slug: str(raw.slug),
    excerpt: str(raw.excerpt) || undefined,
    coverImage: fileUrl(raw.cover_image, assetBase) ?? undefined,
    coverAlt: fileAlt(raw.cover_image) || undefined,
    categoryName,
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

function mapIntro(home: RawHome, assetBase: string): HomeContent["intro"] {
  const title = str(home.intro_title);
  const text = str(home.intro_text);
  if (!title && !text) return null;
  return { title, text: text || null, photo: mapPhoto(home.intro_photo, assetBase) };
}

/** Compose le payload de la page (pur). */
export function mapHomeContent(
  home: RawHome,
  articles: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
): HomeContent {
  const finalTitle = str(home.final_cta_title);
  return {
    hero: {
      // Fallbacks = garde-fous d'affichage (hero toujours visible), pas du contenu éditorial.
      title: str(home.hero_title) || "L'Encre Humaine",
      subtitle: str(home.hero_subtitle) || null,
      ctaB2bLabel: str(home.hero_cta_b2b_label) || "Je suis une organisation",
      ctaB2cLabel: str(home.hero_cta_b2c_label) || "Je suis un particulier",
    },
    stats: mapStats(home.stats),
    blockB2b: mapBlock(
      home.block_b2b_title,
      home.block_b2b_text,
      home.block_b2b_tags,
      "/organisations",
    ),
    blockB2c: mapBlock(
      home.block_b2c_title,
      home.block_b2c_text,
      home.block_b2c_tags,
      "/particuliers",
    ),
    intro: mapIntro(home, assetBase),
    featuredTestimonial: mapTestimonial(home.featured_testimonial),
    articles: mapArticles(articles, assetBase),
    finalCta: finalTitle
      ? { title: finalTitle, label: str(home.final_cta_label) || "Travaillons ensemble" }
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
          "hero_cta_b2b_label",
          "hero_cta_b2c_label",
          "stats",
          "block_b2b_title",
          "block_b2b_text",
          "block_b2b_tags",
          "block_b2c_title",
          "block_b2c_text",
          "block_b2c_tags",
          "intro_title",
          "intro_text",
          // Champs fichier = ID brut (directus_files hors Schema typé, cf. shop.ts) → URL d'asset.
          "intro_photo",
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
          "final_cta_title",
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
        limit: 3,
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
