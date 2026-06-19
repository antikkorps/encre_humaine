import { readItems, readSingleton } from "@directus/sdk";
import type { ArticleSummary } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapPhoto,
  mapSeo,
  type RawSiteDefaults,
  str,
} from "./_shared";
import { mapArticles, type RawArticle } from "./home";

/**
 * Article de blog — `/ressources/{slug}` (docs/07-ressources.md). Source :
 * `articles` (par slug) + articles liés (même catégorie). `body` est du rich text
 * → **assaini serveur** (sanitizer injecté). `null` si aucun article publié ne
 * porte ce slug → l'endpoint répond 404. Les cartes liées réutilisent `mapArticles`.
 */

interface RawCategory {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  group?: string | null;
}

export interface RawArticleDetail {
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  body?: string | null; // rich text
  cover_image?: FileField;
  category?: RawCategory | string | null;
  reading_time?: number | null;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface ArticleContent {
  title: string;
  excerpt: string | null;
  /** `body` (rich text Directus) assaini côté serveur (docs/06 §1). */
  bodyHtml: string;
  cover: ContentPhoto | null;
  category: { name: string; slug: string; group: string } | null;
  readingTime: number | null;
  publishedAt: string | null;
  related: ArticleSummary[];
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Compose l'article (pur ; `sanitize` injecté pour le corps rich text). */
export function mapArticleContent(
  raw: RawArticleDetail,
  relatedRaw: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): ArticleContent {
  const cat = raw.category && typeof raw.category === "object" ? raw.category : null;
  const name = cat && str(cat.name);
  return {
    title: str(raw.title),
    excerpt: str(raw.excerpt) || null,
    bodyHtml: sanitize(raw.body),
    cover: mapPhoto(raw.cover_image, assetBase),
    category: name ? { name, slug: str(cat?.slug), group: str(cat?.group) } : null,
    readingTime: typeof raw.reading_time === "number" ? raw.reading_time : null,
    publishedAt: str(raw.published_at) || null,
    related: mapArticles(relatedRaw, assetBase),
    seo: mapSeo(raw, settings, assetBase),
  };
}

/**
 * Charge un article par slug (Directus published) + jusqu'à 3 articles liés
 * (même catégorie). `null` si aucun article publié ne porte ce slug.
 */
export async function loadArticleContent(slug: string): Promise<ArticleContent | null> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [article] = (await client.request(
    readItems("articles", {
      filter: { status: { _eq: "published" }, slug: { _eq: slug } },
      limit: 1,
      fields: [
        "title",
        "slug",
        "excerpt",
        "body",
        "cover_image",
        { category: ["id", "name", "slug", "group"] },
        "reading_time",
        "published_at",
        "meta_title",
        "meta_description",
        "og_image",
        "no_index",
      ],
    }),
  )) as unknown as (RawArticleDetail & { category?: RawCategory | string | null })[];

  if (!article) return null;

  const categoryId =
    article.category && typeof article.category === "object" ? article.category.id : null;

  const [related, settings] = await Promise.all([
    categoryId
      ? client.request(
          readItems("articles", {
            filter: {
              status: { _eq: "published" },
              slug: { _neq: slug },
              category: { _eq: categoryId },
            },
            sort: ["-published_at"],
            limit: 3,
            fields: [
              "title",
              "slug",
              "excerpt",
              "reading_time",
              "published_at",
              "cover_image",
              { category: ["name", "slug", "group"] },
            ],
          }),
        )
      : Promise.resolve([] as RawArticle[]),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapArticleContent(
    article as unknown as RawArticleDetail,
    related,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
