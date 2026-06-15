// @vitest-environment node
//
// Merge catalogue boutique — docs/05-shop.md §2, §8.1-8.2.
// Vérifie qu'on n'expose QUE les produits présents et actifs des deux côtés
// (Directus published + prix Stripe actif), sans jamais de prix en dur.
import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { buildPriceMap, type CatalogProductInput, mergeCatalog } from "../server/utils/shop";

const ASSET_BASE = "https://cms.example.fr";

function price(p: {
  id?: string;
  active?: boolean;
  unit_amount?: number;
  product: unknown;
}): Stripe.Price {
  return {
    active: true,
    unit_amount: 2900,
    currency: "eur",
    id: "price_x",
    ...p,
  } as unknown as Stripe.Price;
}

function product(over: Partial<CatalogProductInput>): CatalogProductInput {
  return {
    id: "d1",
    slug: "jeu",
    name: "Jeu",
    tagline: null,
    description: null,
    audience: null,
    featured: false,
    stripe_product_id: "prod_1",
    status: "published",
    ...over,
  };
}

describe("buildPriceMap", () => {
  it("ignore prix inactifs, produits archivés/supprimés et prix non étendus", () => {
    const map = buildPriceMap([
      price({ id: "p_ok", product: { id: "prod_1", active: true } }),
      price({ id: "p_inactive", active: false, product: { id: "prod_2", active: true } }),
      price({ id: "p_archived", product: { id: "prod_3", active: false } }),
      price({ id: "p_deleted", product: { id: "prod_4", deleted: true } }),
      price({ id: "p_string", product: "prod_5" }),
    ]);
    expect([...map.keys()]).toEqual(["prod_1"]);
    expect(map.get("prod_1")).toEqual({ priceId: "p_ok", unitAmount: 2900, currency: "eur" });
  });
});

describe("mergeCatalog", () => {
  const priceMap = buildPriceMap([price({ id: "p_ok", product: { id: "prod_1", active: true } })]);

  it("expose un produit published avec prix actif (prix résolu depuis Stripe)", () => {
    const out = mergeCatalog([product({})], priceMap, ASSET_BASE);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ slug: "jeu", priceId: "p_ok", unitAmount: 2900 });
  });

  it("exclut un produit sans prix Stripe actif (non achetable)", () => {
    const out = mergeCatalog([product({ stripe_product_id: "prod_absent" })], priceMap, ASSET_BASE);
    expect(out).toEqual([]);
  });

  it("exclut un produit non published (défense en profondeur)", () => {
    const out = mergeCatalog([product({ status: "draft" })], priceMap, ASSET_BASE);
    expect(out).toEqual([]);
  });

  it("résout les images de la galerie en URLs d'assets", () => {
    const out = mergeCatalog(
      [product({ images: [{ directus_files_id: "file-abc" }, { directus_files_id: null }] })],
      priceMap,
      ASSET_BASE,
    );
    expect(out[0]?.images).toEqual([`${ASSET_BASE}/assets/file-abc`]);
  });
});
