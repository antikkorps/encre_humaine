import { readItems, readSingleton } from "@directus/sdk";
import type { ArticleSummary } from "~/types/content";
import {
  type ContentSeo,
  type FileField,
  fileUrl,
  mapSeo,
  type RawSiteDefaults,
  str,
} from "./_shared";
import { mapArticles, type RawArticle } from "./home";

/**
 * Contenu de l'index Ressources (blog) — docs/07-ressources.md. Source :
 * `resources_page` + `articles` (publiés) + `resources` (vedette via m2o). Doit
 * fonctionner **avec 0 article** (état vide propre, critère d'acceptation). Les
 * cartes article réutilisent `mapArticles` (DRY, partagé avec l'accueil). Filtres
 * dérivés des `article_categories.group` réellement présents.
 */

/** Groupes de catégories d'articles (docs/02) → libellés d'affichage. */
const GROUP_LABELS: Record<string, string> = {
  organisations: "Organisations",
  particuliers: "Particuliers",
  terrain: "Terrain",
};

interface RawFeaturedResource {
  title?: string | null;
  description?: string | null;
  slug?: string | null;
  requires_email?: boolean | null;
  file?: FileField;
  cover_image?: FileField;
}

export interface RawResourcesPage {
  accroche_title?: string | null;
  accroche_body?: string | null;
  featured_resource?: RawFeaturedResource | string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

/** Ressource vedette (lead magnet). Téléchargement direct OU gating email. */
export interface FeaturedResource {
  title: string;
  description: string | null;
  coverUrl: string | null;
  /** `true` → inscription newsletter requise ; sinon lien direct. */
  requiresEmail: boolean;
  /** URL du fichier (R2 via Directus) ; n'est exposée que si `!requiresEmail`. */
  downloadUrl: string | null;
}

/** Filtre par groupe de catégorie (valeur + libellé). */
export interface CategoryFilter {
  group: string;
  label: string;
}

export interface ResourcesContent {
  accrocheTitle: string | null;
  accrocheBody: string | null;
  featured: FeaturedResource | null;
  /** Filtres présents (groupes ayant ≥ 1 article), dans l'ordre documenté. */
  filters: CategoryFilter[];
  articles: ArticleSummary[];
  seo: ContentSeo;
}

/** Ressource vedette : requiert un titre, sinon section masquée. */
export function mapFeaturedResource(
  raw: RawResourcesPage["featured_resource"],
  assetBase: string,
): FeaturedResource | null {
  if (!raw || typeof raw !== "object") return null;
  const title = str(raw.title);
  if (!title) return null;
  const requiresEmail = raw.requires_email === true;
  return {
    title,
    description: str(raw.description) || null,
    coverUrl: fileUrl(raw.cover_image, assetBase),
    requiresEmail,
    // Lien direct seulement si non gaté (sinon le fichier passe par l'inscription).
    downloadUrl: requiresEmail ? null : fileUrl(raw.file, assetBase),
  };
}

/** Filtres = groupes documentés effectivement présents parmi les articles. */
export function buildFilters(articles: ArticleSummary[]): CategoryFilter[] {
  const present = new Set(articles.map((a) => a.categoryGroup).filter(Boolean));
  return Object.entries(GROUP_LABELS)
    .filter(([group]) => present.has(group))
    .map(([group, label]) => ({ group, label }));
}

/** Compose le payload de l'index (pur). */
export function mapResourcesContent(
  page: RawResourcesPage,
  articlesRaw: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
): ResourcesContent {
  const articles = mapArticles(articlesRaw, assetBase);
  return {
    accrocheTitle: str(page.accroche_title) || null,
    accrocheBody: str(page.accroche_body) || null,
    featured: mapFeaturedResource(page.featured_resource, assetBase),
    filters: buildFilters(articles),
    articles,
    seo: mapSeo(page, settings, assetBase),
  };
}

/** Charge et compose l'index Ressources (Directus published, lecture seule). */
export async function loadResourcesContent(): Promise<ResourcesContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [page, articles, settings] = await Promise.all([
    client.request(
      readSingleton("resources_page", {
        fields: [
          "accroche_title",
          "accroche_body",
          // m2o resources : fichiers en ID brut (directus_files hors Schema typé).
          {
            featured_resource: [
              "title",
              "description",
              "slug",
              "requires_email",
              "file",
              "cover_image",
            ],
          },
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
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapResourcesContent(
    page as unknown as RawResourcesPage,
    articles as unknown as RawArticle[],
    settings as unknown as RawSiteDefaults,
    assetBase,
  );
}
