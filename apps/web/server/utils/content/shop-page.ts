import { readSingleton } from "@directus/sdk";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapPhoto,
  mapSeo,
  type RawSiteDefaults,
  records,
  safeHref,
  str,
} from "./_shared";

/**
 * Contenu de « Le Laboratoire » — `shop_page` (singleton Directus).
 *
 * La page est une **vitrine** de ce qui se prépare (familles d'outils, chantier
 * en cours, parti pris du jeu) ; `shop_enabled` n'ouvre que la VENTE (catalogue
 * produits + paiement) à l'intérieur de cette page. Chaque section éditoriale se
 * masque proprement tant qu'elle est vide, de sorte que la page reste correcte
 * pendant qu'Eléonore la remplit. Le rich text est **assaini côté serveur**
 * (sanitizer injecté, docs/06 §1).
 */

/** Item d'une famille d'outils (§2) ou d'un parti pris (§5). */
export interface LabItem {
  icon: string;
  title: string;
  body: string;
  /** Statut affiché en pied de carte (ex. « En cours de conception »). */
  status: string;
}

export interface RawShopPage {
  shop_enabled?: boolean | null;
  title?: string | null;
  intro?: string | null;
  hero_body?: string | null; // rich text
  hero_image?: FileField;
  empty_message?: string | null;
  catalog_title?: string | null;
  catalog_items?: unknown; // répéteur { icon, status, title, body }
  focus_eyebrow?: string | null;
  focus_title?: string | null;
  focus_body?: string | null; // rich text
  focus_image?: FileField;
  focus_cta_label?: string | null;
  focus_cta_url?: string | null;
  manifesto_title?: string | null;
  manifesto_subtitle?: string | null;
  manifesto_body?: string | null; // rich text
  manifesto_image?: FileField;
  why_title?: string | null;
  why_items?: unknown; // répéteur { icon, title, body }
  newsletter_title?: string | null;
  newsletter_body?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface ShopPageContent {
  /** La VENTE est-elle ouverte (catalogue + paiement) ? */
  enabled: boolean;
  title: string;
  intro: string | null;
  /** Paragraphes d'introduction (rich text assaini) ; `null` si vide. */
  heroBodyHtml: string | null;
  heroImage: ContentPhoto | null;
  /** Message quand la vente est ouverte mais qu'aucun produit n'est disponible. */
  emptyMessage: string;
  /** §2 — familles d'outils ; `null` si aucun item. */
  catalog: { title: string | null; items: LabItem[] } | null;
  /** §3 — chantier en cours ; `null` si ni titre ni corps. */
  focus: {
    eyebrow: string | null;
    title: string | null;
    bodyHtml: string;
    image: ContentPhoto | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
  } | null;
  /** §4 — parti pris du jeu ; `null` si ni titre ni corps. */
  manifesto: {
    title: string | null;
    subtitle: string | null;
    bodyHtml: string;
    image: ContentPhoto | null;
  } | null;
  /** §5 — optionnel, masqué tant qu'aucun item n'est saisi. */
  why: { title: string | null; items: LabItem[] } | null;
  /** §6 — invitation à la newsletter (libellés ; le formulaire est mutualisé). */
  newsletter: { title: string | null; body: string | null };
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Items d'un répéteur du Laboratoire : gardés s'ils ont un titre OU un corps. */
export function mapLabItems(raw: unknown): LabItem[] {
  return records(raw)
    .map((item) => ({
      icon: str(item.icon),
      title: str(item.title),
      body: str(item.body),
      status: str(item.status),
    }))
    .filter((item) => item.title || item.body);
}

/** Compose le contenu du Laboratoire (pur ; `sanitize` injecté pour le rich text). */
export function mapShopPage(
  raw: RawShopPage,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): ShopPageContent {
  const catalogItems = mapLabItems(raw.catalog_items);
  const whyItems = mapLabItems(raw.why_items);
  const focusTitle = str(raw.focus_title);
  const focusHtml = sanitize(raw.focus_body);
  const manifestoTitle = str(raw.manifesto_title);
  const manifestoHtml = sanitize(raw.manifesto_body);

  return {
    enabled: raw.shop_enabled === true,
    title: str(raw.title) || "Le Laboratoire",
    intro: str(raw.intro) || null,
    heroBodyHtml: sanitize(raw.hero_body) || null,
    heroImage: mapPhoto(raw.hero_image, assetBase),
    emptyMessage:
      str(raw.empty_message) || "Les premiers outils arrivent bientôt. Revenez très vite !",
    catalog: catalogItems.length
      ? { title: str(raw.catalog_title) || null, items: catalogItems }
      : null,
    focus:
      focusTitle || focusHtml
        ? {
            eyebrow: str(raw.focus_eyebrow) || null,
            title: focusTitle || null,
            bodyHtml: focusHtml,
            image: mapPhoto(raw.focus_image, assetBase),
            ctaLabel: str(raw.focus_cta_label) || null,
            ctaUrl: safeHref(raw.focus_cta_url) || null,
          }
        : null,
    manifesto:
      manifestoTitle || manifestoHtml
        ? {
            title: manifestoTitle || null,
            subtitle: str(raw.manifesto_subtitle) || null,
            bodyHtml: manifestoHtml,
            image: mapPhoto(raw.manifesto_image, assetBase),
          }
        : null,
    why: whyItems.length ? { title: str(raw.why_title) || null, items: whyItems } : null,
    newsletter: {
      title: str(raw.newsletter_title) || null,
      body: str(raw.newsletter_body) || null,
    },
    seo: mapSeo(raw, settings, assetBase),
  };
}

/** Sous-champs demandés pour une image expansée (dimensions natives + alt). */
const PHOTO_FIELDS = ["id", "width", "height", "title", "description"] as const;

/** Charge le contenu du Laboratoire (Directus published, lecture seule). */
export async function loadShopPage(): Promise<ShopPageContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [page, settings] = await Promise.all([
    client.request(
      readSingleton("shop_page", {
        fields: [
          "shop_enabled",
          "title",
          "intro",
          "hero_body",
          // Visuels expansés (dimensions natives) → servis entiers, sans rognage.
          { hero_image: PHOTO_FIELDS },
          "empty_message",
          "catalog_title",
          "catalog_items",
          "focus_eyebrow",
          "focus_title",
          "focus_body",
          { focus_image: PHOTO_FIELDS },
          "focus_cta_label",
          "focus_cta_url",
          "manifesto_title",
          "manifesto_subtitle",
          "manifesto_body",
          { manifesto_image: PHOTO_FIELDS },
          "why_title",
          "why_items",
          "newsletter_title",
          "newsletter_body",
          "meta_title",
          "meta_description",
          // Champ fichier = ID brut (directus_files hors Schema typé) → URL d'asset.
          "og_image",
          "no_index",
        ],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapShopPage(
    page as unknown as RawShopPage,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
