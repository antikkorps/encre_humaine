// @vitest-environment node
//
// Fiche autrice (E-E-A-T, audit SEO 2026-10-22) : nom, fonction, photo et
// LinkedIn, saisis une fois dans les Paramètres du site et affichés en haut de
// l'accueil et en signature des ressources.
import { describe, expect, it } from "vitest";
import { mapAuthor } from "../server/utils/content/author";

const BASE = "https://cms.example.fr";

describe("mapAuthor", () => {
  it("compose la fiche, lien LinkedIn validé", () => {
    expect(
      mapAuthor(
        {
          author_name: "Eléonore Morée",
          author_title: "Consultante RH",
          author_photo: "photo-id",
          linkedin_url: "https://www.linkedin.com/in/eleonore-moree",
        },
        BASE,
      ),
    ).toEqual({
      name: "Eléonore Morée",
      title: "Consultante RH",
      photo: { url: `${BASE}/assets/photo-id`, alt: "Eléonore Morée", width: null, height: null },
      linkedinUrl: "https://www.linkedin.com/in/eleonore-moree",
    });
  });

  it("écarte un lien non sûr et tolère l'absence de photo", () => {
    const author = mapAuthor({ author_name: "E. M.", linkedin_url: "javascript:x" }, BASE);
    expect(author).toEqual({ name: "E. M.", title: null, photo: null, linkedinUrl: null });
  });

  it("null sans nom : pas de fiche anonyme", () => {
    expect(mapAuthor({ author_title: "Consultante RH" }, BASE)).toBeNull();
  });
});
