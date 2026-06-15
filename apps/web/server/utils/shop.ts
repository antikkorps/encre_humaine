import { readItems } from "@directus/sdk";
import type Stripe from "stripe";

/**
 * Catalogue boutique — docs/05-shop.md §2. Source de vérité partagée :
 * Directus = éditorial (published), Stripe = prix actifs. On n'expose QUE les
 * produits présents et actifs des DEUX côtés (docs/05 §8.1-8.2). Jamais de prix
 * en dur. Les fonctions de merge sont pures (testables) ; `loadCatalog` orchestre
 * les appels réseau.
 */

/** Sous-ensemble des champs Directus nécessaires au merge (cf. schema.gen Products). */
export interface CatalogProductInput {
  id: string;
  slug: string;
  name: string | null;
  tagline: string | null;
  description: string | null;
  audience: string | null;
  featured: boolean;
  stripe_product_id: string;
  status: string;
  images?: Array<{ directus_files_id: string | { id: string } | null }> | string[] | null;
}

/** Produit exposé au front (prix résolu depuis Stripe). */
export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  images: string[];
  audience: string | null;
  featured: boolean;
  stripeProductId: string;
  priceId: string;
  unitAmount: number; // centimes
  currency: string;
}

export interface ActivePrice {
  priceId: string;
  unitAmount: number;
  currency: string;
}

/**
 * Indexe les prix Stripe actifs par id de produit (produit étendu requis).
 * Ignore : prix inactifs, produits archivés/supprimés, prix sans montant.
 * Premier prix actif retenu par produit (phase 1 : un prix par produit).
 */
export function buildPriceMap(prices: Stripe.Price[]): Map<string, ActivePrice> {
  const map = new Map<string, ActivePrice>();
  for (const price of prices) {
    if (!price.active || price.unit_amount == null) continue;
    const product = price.product;
    if (typeof product === "string") continue; // produit non étendu
    if ("deleted" in product && product.deleted) continue;
    if ("active" in product && !product.active) continue;
    if (!map.has(product.id)) {
      map.set(product.id, {
        priceId: price.id,
        unitAmount: price.unit_amount,
        currency: price.currency,
      });
    }
  }
  return map;
}

/** Construit les URLs d'assets Directus depuis la galerie d'images (jonction). */
function imageUrls(images: CatalogProductInput["images"], assetBase: string): string[] {
  if (!Array.isArray(images)) return [];
  const urls: string[] = [];
  for (const img of images) {
    if (typeof img === "string") continue; // id de jonction non résolu → ignoré
    const ref = img.directus_files_id;
    const fileId = typeof ref === "string" ? ref : ref?.id;
    if (fileId) urls.push(`${assetBase}/assets/${fileId}`);
  }
  return urls;
}

/**
 * Merge Directus + Stripe : ne garde que les produits published ayant un prix
 * actif correspondant. L'ordre d'entrée (tri Directus) est préservé.
 */
export function mergeCatalog(
  products: CatalogProductInput[],
  priceMap: Map<string, ActivePrice>,
  assetBase: string,
): ShopProduct[] {
  const catalog: ShopProduct[] = [];
  for (const p of products) {
    if (p.status !== "published") continue; // défense (le token ne voit que published)
    const price = priceMap.get(p.stripe_product_id);
    if (!price) continue; // pas de prix actif → non achetable
    catalog.push({
      id: p.id,
      slug: p.slug,
      name: p.name ?? "",
      tagline: p.tagline,
      description: p.description,
      images: imageUrls(p.images, assetBase),
      audience: p.audience,
      featured: p.featured,
      stripeProductId: p.stripe_product_id,
      priceId: price.priceId,
      unitAmount: price.unitAmount,
      currency: price.currency,
    });
  }
  return catalog;
}

/** Charge et merge le catalogue (Directus published + prix Stripe actifs). */
export async function loadCatalog(): Promise<ShopProduct[]> {
  const products = (await directusServer().request(
    readItems("products", {
      filter: { status: { _eq: "published" } },
      fields: [
        "id",
        "slug",
        "name",
        "tagline",
        "description",
        "audience",
        "featured",
        "stripe_product_id",
        "status",
        { images: ["directus_files_id"] },
      ],
      sort: ["sort"],
      limit: -1,
    }),
  )) as unknown as CatalogProductInput[];

  const prices = await stripe().prices.list({ active: true, limit: 100, expand: ["data.product"] });
  const assetBase = useRuntimeConfig().public.directusPublicUrl;
  return mergeCatalog(products, buildPriceMap(prices.data), assetBase);
}
