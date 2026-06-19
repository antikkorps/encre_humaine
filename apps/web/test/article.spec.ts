// @vitest-environment node
//
// Composition d'un article — docs/07-ressources.md.
// Vérifie : corps rich text assaini (injecté), cover, catégorie résolue/non,
// articles liés mappés, SEO.
import { describe, expect, it } from "vitest";
import { mapArticleContent } from "../server/utils/content/article";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapArticleContent", () => {
  it("assainit le corps, résout cover/catégorie, mappe les liés et le SEO", () => {
    const c = mapArticleContent(
      {
        title: "Recruter sans se tromper",
        excerpt: "Méthode.",
        body: "<p>Contenu</p>",
        cover_image: { id: "c1", title: "Couv" },
        category: { id: "cat1", name: "Organisations", slug: "orga", group: "organisations" },
        reading_time: 6,
        published_at: "2026-03-14",
        meta_title: "",
      },
      [{ title: "Lié", slug: "lie", category: { name: "Organisations" } }],
      { brand_name: "L'Encre Humaine", default_meta_description: "RH." },
      BASE,
      wrap,
    );
    expect(c.title).toBe("Recruter sans se tromper");
    expect(c.bodyHtml).toBe("clean(<p>Contenu</p>)");
    expect(c.cover).toEqual({ url: `${BASE}/assets/c1`, alt: "Couv", width: null, height: null });
    expect(c.category).toEqual({ name: "Organisations", slug: "orga", group: "organisations" });
    expect(c.readingTime).toBe(6);
    expect(c.related).toHaveLength(1);
    expect(c.related[0]?.slug).toBe("lie");
    expect(c.seo.title).toBe("L'Encre Humaine");
  });

  it("catégorie nulle si non résolue, corps vide → chaîne vide", () => {
    const c = mapArticleContent({ category: "uuid" }, [], {}, BASE, wrap);
    expect(c.category).toBeNull();
    expect(c.bodyHtml).toBe("");
    expect(c.cover).toBeNull();
    expect(c.related).toEqual([]);
  });
});
