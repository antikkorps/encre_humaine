import { readItems, readSingleton } from "@directus/sdk";

/**
 * Source dynamique du sitemap (@nuxtjs/sitemap) — docs/00-global.md §SEO.
 * Les routes statiques (accueil, hubs, contact, légal…) sont auto-découvertes ;
 * ici on ajoute les pages pilotées par Directus, sinon absentes : articles,
 * offres (chemin selon l'audience), produits (si la boutique est activée).
 * Dégradation propre : si Directus est indisponible, on renvoie [] (le sitemap
 * garde au moins les routes statiques).
 */
type SitemapEntry = { loc: string; lastmod?: string };

const audiencePath = (a: unknown): string =>
  a === "organisation" ? "organisations" : "particuliers";

export default defineEventHandler(async (): Promise<SitemapEntry[]> => {
  try {
    const directus = directusServer();
    const entries: SitemapEntry[] = [];

    // Articles publiés → /ressources/{slug}
    const articles = await directus.request(
      readItems("articles", {
        filter: { status: { _eq: "published" } },
        fields: ["slug", "published_at", "date_updated"],
        limit: -1,
      }),
    );
    for (const a of articles) {
      if (!a.slug) continue;
      entries.push({
        loc: `/ressources/${a.slug}`,
        lastmod: a.date_updated ?? a.published_at ?? undefined,
      });
    }

    // Offres publiées → /{organisations|particuliers}/{slug}
    const offers = await directus.request(
      readItems("offers", {
        filter: { status: { _eq: "published" } },
        fields: ["slug", "audience", "date_updated"],
        limit: -1,
      }),
    );
    for (const o of offers) {
      if (!o.slug) continue;
      entries.push({
        loc: `/${audiencePath(o.audience)}/${o.slug}`,
        lastmod: o.date_updated ?? undefined,
      });
    }

    // Produits → /laboratoire/{slug}, uniquement si la boutique est activée.
    const shop = await directus.request(readSingleton("shop_page", { fields: ["shop_enabled"] }));
    if (shop?.shop_enabled === true) {
      const products = await directus.request(
        readItems("products", {
          filter: { status: { _eq: "published" } },
          fields: ["slug", "date_updated"],
          limit: -1,
        }),
      );
      for (const p of products) {
        if (!p.slug) continue;
        entries.push({ loc: `/laboratoire/${p.slug}`, lastmod: p.date_updated ?? undefined });
      }
    }

    return entries;
  } catch (err) {
    console.error("[sitemap] sources dynamiques indisponibles :", err);
    return [];
  }
});
