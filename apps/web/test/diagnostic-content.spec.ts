// @vitest-environment node
//
// Contenu d'un diagnostic (docs/11-diagnostics.md) : textes Directus fusionnés
// avec la référence du cahier des charges + agenda du bon public.
import { B2B_TEXTS, B2C_TEXTS } from "@encre/shared/diagnostics";
import { describe, expect, it } from "vitest";
import { mapDiagnosticContent } from "../server/utils/content/diagnostic";

const SETTINGS = {
  booking_url: "https://cal.com/e/defaut",
  booking_url_org: "https://cal.com/e/rdv-30",
  booking_url_b2c: "",
};

describe("mapDiagnosticContent", () => {
  it("B2B : textes de l'admin par-dessus la référence, agenda des organisations", () => {
    const c = mapDiagnosticContent("b2b", { title: "Vos RH, en vrai" }, SETTINGS);
    expect(c.texts.title).toBe("Vos RH, en vrai");
    expect(c.texts.intro).toBe(B2B_TEXTS.intro);
    expect(c.bookingUrl).toBe("https://cal.com/e/rdv-30");
  });

  it("B2C : référence quand l'admin est vide, agenda par défaut sans agenda dédié", () => {
    const c = mapDiagnosticContent("b2c", null, SETTINGS);
    expect(c.texts.title).toBe(B2C_TEXTS.title);
    expect(c.bookingUrl).toBe("https://cal.com/e/defaut");
  });

  it("écarte un lien d'agenda non sûr", () => {
    expect(mapDiagnosticContent("b2b", {}, { booking_url_org: "javascript:x" }).bookingUrl).toBe(
      "",
    );
  });
});
