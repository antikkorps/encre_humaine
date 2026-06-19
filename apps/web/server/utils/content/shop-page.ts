import { readSingleton } from "@directus/sdk";
import { type ContentSeo, type FileField, mapSeo, type RawSiteDefaults, str } from "./_shared";

/**
 * Réglages éditoriaux de la boutique — `shop_page` (singleton Directus).
 * Porte l'**activation** (`shop_enabled`) ET les libellés (titre/intro/message
 * vide) pour que la boutique soit pilotée par Eléonore sans redéploiement et
 * sans être figée sur « jeux » (vision évolutive : elle peut vendre autre chose).
 * Consommé par le lien de navigation (`useShopPage`) et les pages `/boutique`.
 */

export interface RawShopPage {
  shop_enabled?: boolean | null;
  title?: string | null;
  intro?: string | null;
  empty_message?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface ShopPageContent {
  /** La boutique est-elle ouverte (lien nav + accès aux pages) ? */
  enabled: boolean;
  title: string;
  intro: string | null;
  /** Message quand la boutique est ouverte mais sans produit (ou fermée). */
  emptyMessage: string;
  seo: ContentSeo;
}

/** Compose les réglages boutique (pur) ; libellés génériques par défaut. */
export function mapShopPage(
  raw: RawShopPage,
  settings: RawSiteDefaults,
  assetBase: string,
): ShopPageContent {
  return {
    enabled: raw.shop_enabled === true,
    title: str(raw.title) || "La boutique",
    intro: str(raw.intro) || null,
    emptyMessage:
      str(raw.empty_message) || "La boutique ouvrira bientôt ses portes. Revenez très vite !",
    seo: mapSeo(raw, settings, assetBase),
  };
}

/** Charge les réglages boutique (Directus published, lecture seule). */
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
          "empty_message",
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
  );
}
