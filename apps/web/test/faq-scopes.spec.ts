// @vitest-environment node
//
// Garde-fou de cohérence CMS ↔ site pour les périmètres de FAQ.
//
// Le risque couvert est SILENCIEUX : un périmètre proposé dans la liste déroulante
// de l'admin mais qu'aucune page ne charge. L'éditrice y range des questions, les
// publie, et elles n'apparaissent jamais nulle part — sans erreur, sans alerte.
// Ce test relie la source des choix (`FAQ_SCOPE`, packages/directus/src/schema.ts)
// à la liste des périmètres réellement rendus par une page.
//
// Si ce test casse après l'ajout d'un choix dans schema.ts : c'est le rappel qu'il
// faut brancher une page dessus (et inscrire le périmètre ci-dessous), pas
// simplement rendre le test vert.
import { FAQ_SCOPE } from "@encre/directus/schema-def";
import { describe, expect, it } from "vitest";
import { FAQ_SCOPE_BY_SLUG } from "../server/utils/content/offer";

/**
 * Périmètres chargés par une page, hors gabarit d'offre. Miroir des filtres
 * `faq_items` dans les `load*Content()` correspondants :
 *  - `contact` → server/utils/content/contact.ts
 *  - `b2c`     → server/utils/content/b2c-hub.ts (hub /particuliers)
 *  - `org`     → server/utils/content/org-hub.ts (hub /organisations)
 * `general` est ajouté à toute offre par `faqScopesForSlug` (offer.ts).
 */
const HUB_SCOPES = ["contact", "b2c", "org"];
const RENDERED = new Set([...HUB_SCOPES, ...Object.values(FAQ_SCOPE_BY_SLUG), "general"]);

describe("périmètres de FAQ", () => {
  it("tout choix proposé dans l'admin est rendu par au moins une page", () => {
    const orphelins = FAQ_SCOPE.map((c) => c.value).filter((v) => !RENDERED.has(v));
    expect(orphelins).toEqual([]);
  });

  it("tout périmètre rendu par une page est proposé dans l'admin", () => {
    const offerts = new Set(FAQ_SCOPE.map((c) => c.value));
    expect([...RENDERED].filter((v) => !offerts.has(v))).toEqual([]);
  });

  it("le libellé annonce la ou les pages d'affichage, pas un thème", () => {
    const label = (value: string) => FAQ_SCOPE.find((c) => c.value === value)?.text ?? "";
    // `b2c` alimente DEUX pages : le libellé doit le dire, sinon l'éditrice croit
    // n'en modifier qu'une (retour Éléonore 2026-08-06).
    expect(label("b2c")).toContain("/particuliers");
    expect(label("b2c")).toContain("Clarifier");
    // `general` ne sort que sur les pages d'offre — jamais sur les hubs ni /contact.
    expect(label("general")).toContain("offres");
    expect(label("general")).not.toContain("Général");
  });
});
