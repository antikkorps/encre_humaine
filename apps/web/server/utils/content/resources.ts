import { readItems, readSingleton } from "@directus/sdk";
import type { ArticleSummary } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapPhoto,
  mapSeo,
  type RawSiteDefaults,
  records,
  str,
} from "./_shared";
import { mapArticle, mapArticles, type RawArticle } from "./home";
import {
  mapNewsletterContent,
  NEWSLETTER_PAGE_FIELDS,
  type NewsletterContent,
  type RawNewsletterPage,
} from "./newsletter";

/**
 * Contenu de la page fusionnée « Les Tentacules » (blog + newsletter) — /ressources.
 * Source : `resources_page` + `articles` (publiés) + `newsletter_page` (section
 * d'inscription) + `site_settings`. Doit fonctionner **avec 0 article** (état vide
 * propre). Cartes article via `mapArticle(s)` (DRY, partagé avec l'accueil). Filtres
 * dérivés des `article_categories.group` présents, enrichis d'un chrome ÉDITABLE
 * (icône + mots-clés, `explore_cards`). `positioning_body` (resources_page) et `promise_body`
 * (newsletter_page) sont du rich text → **assainis serveur** (sanitizer injecté).
 */

/**
 * Repli des filtres par groupe : servent tant que `resources_page.explore_cards`
 * n'est pas renseigné (la taxonomie, elle, reste fixe : 3 groupes).
 */
const GROUP_META: Record<string, { label: string; icon: string; keywords: string }> = {
  organisations: {
    label: "Organisations",
    icon: "groups",
    keywords: "GEPP • compétences • management • RH • formation • structuration",
  },
  particuliers: {
    label: "Parcours professionnels",
    icon: "person-search",
    keywords: "transition • reconversion • CV • LinkedIn • recherche d'emploi",
  },
  terrain: {
    label: "Terrain",
    icon: "explore",
    keywords: "analyses • observations • situations réelles",
  },
};

export interface RawResourcesPage {
  accroche_title?: string | null;
  accroche_body?: string | null;
  hero_signature?: string | null;
  featured_article?: RawArticle | string | null;
  explore_cards?: unknown; // répéteur { group, icon, label, keywords }
  positioning_title?: string | null;
  positioning_body?: string | null; // rich text
  positioning_photo?: FileField;
  cta_title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

/** Filtre par groupe de catégorie (valeur + chrome d'affichage). */
export interface CategoryFilter {
  group: string;
  label: string;
  /** Clé Material Symbols (sans préfixe) — remplace les anciens emoji. */
  icon: string;
  keywords: string;
}

export interface ResourcesContent {
  accrocheTitle: string | null;
  accrocheBody: string | null;
  heroSignature: string | null;
  /** Article « à lire en premier » ; `null` si non défini → section masquée. */
  featuredArticle: ArticleSummary | null;
  /** Filtres présents (groupes ayant ≥ 1 article), dans l'ordre documenté. */
  filters: CategoryFilter[];
  articles: ArticleSummary[];
  /** Positionnement (rich text assaini) ; `null` si vide. `photo` optionnelle. */
  positioning: { title: string | null; bodyHtml: string; photo: ContentPhoto | null } | null;
  ctaTitle: string | null;
  /** Section newsletter intégrée (« Les Tentacules »). */
  newsletter: NewsletterContent;
  seo: ContentSeo;
}

/**
 * Filtres = groupes documentés effectivement présents parmi les articles, dont
 * le chrome (icône, libellé, mots-clés) est **éditable** via le répéteur
 * `resources_page.explore_cards`. Chaque valeur vide retombe sur GROUP_META :
 * une carte à moitié remplie reste correcte.
 */
export function buildFilters(articles: ArticleSummary[], raw?: unknown): CategoryFilter[] {
  const present = new Set(articles.map((a) => a.categoryGroup).filter(Boolean));
  const overrides = new Map(
    records(raw)
      .map((card) => [str(card.group), card] as const)
      .filter(([group]) => group),
  );
  return Object.entries(GROUP_META)
    .filter(([group]) => present.has(group))
    .map(([group, meta]) => {
      const override = overrides.get(group);
      return {
        group,
        label: str(override?.label) || meta.label,
        icon: str(override?.icon) || meta.icon,
        keywords: str(override?.keywords) || meta.keywords,
      };
    });
}

/** Featured article « à lire en premier » : requiert un titre + slog, sinon masqué. */
export function mapFeaturedArticle(
  raw: RawResourcesPage["featured_article"],
  assetBase: string,
): ArticleSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const article = mapArticle(raw, assetBase);
  return article.title && article.slug ? article : null;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Compose le payload de la page (pur ; `sanitize` injecté pour le rich text). */
export function mapResourcesContent(
  page: RawResourcesPage,
  articlesRaw: unknown,
  newsletterRaw: RawNewsletterPage,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): ResourcesContent {
  const articles = mapArticles(articlesRaw, assetBase);
  const positioningTitle = str(page.positioning_title);
  const positioningBodyHtml = sanitize(page.positioning_body);
  const positioningPhoto = mapPhoto(page.positioning_photo, assetBase);
  return {
    accrocheTitle: str(page.accroche_title) || null,
    accrocheBody: str(page.accroche_body) || null,
    heroSignature: str(page.hero_signature) || null,
    featuredArticle: mapFeaturedArticle(page.featured_article, assetBase),
    filters: buildFilters(articles, page.explore_cards),
    articles,
    positioning:
      positioningTitle || positioningBodyHtml
        ? {
            title: positioningTitle || null,
            bodyHtml: positioningBodyHtml,
            photo: positioningPhoto,
          }
        : null,
    ctaTitle: str(page.cta_title) || null,
    newsletter: mapNewsletterContent(newsletterRaw, settings, assetBase, sanitize),
    seo: mapSeo(page, settings, assetBase),
  };
}

/** Charge et compose la page fusionnée /ressources (Directus published, lecture seule). */
export async function loadResourcesContent(): Promise<ResourcesContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [page, articles, newsletter, settings] = await Promise.all([
    client.request(
      readSingleton("resources_page", {
        fields: [
          "accroche_title",
          "accroche_body",
          "hero_signature",
          {
            featured_article: [
              "title",
              "slug",
              "excerpt",
              "reading_time",
              "published_at",
              "cover_image",
              { category: ["name", "slug", "group"] },
            ],
          },
          "explore_cards",
          "positioning_title",
          "positioning_body",
          // Visuel du positionnement : champ EXPANSÉ (dimensions natives + alt)
          // → affiché en entier, sans rognage (cf. les photos d'« À propos »).
          { positioning_photo: ["id", "width", "height", "title", "description"] },
          "cta_title",
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
        limit: -1,
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
    ),
    client.request(
      readSingleton("newsletter_page", {
        fields: [...NEWSLETTER_PAGE_FIELDS],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapResourcesContent(
    page as unknown as RawResourcesPage,
    articles as unknown as RawArticle[],
    newsletter as unknown as RawNewsletterPage,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
