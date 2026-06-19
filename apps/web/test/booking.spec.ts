// @vitest-environment node
//
// Décomposition de l'URL de RDV — utils/booking.ts (agnostique du provider).
import { describe, expect, it } from "vitest";
import { parseBookingUrl } from "../utils/booking";

describe("parseBookingUrl", () => {
  it("décompose une URL Cal.com cloud en origin + calLink", () => {
    expect(parseBookingUrl("https://cal.com/eleonore/decouverte")).toEqual({
      origin: "https://cal.com",
      calLink: "eleonore/decouverte",
    });
  });

  it("supporte un domaine self-hosted (origin préservé)", () => {
    expect(parseBookingUrl("https://rdv.encrehumaine.fr/eleonore/30min")).toEqual({
      origin: "https://rdv.encrehumaine.fr",
      calLink: "eleonore/30min",
    });
  });

  it("nettoie les slashs de début/fin du calLink", () => {
    expect(parseBookingUrl("https://cal.com/eleonore/")?.calLink).toBe("eleonore");
  });

  it("null si vide, invalide, ou sans chemin", () => {
    expect(parseBookingUrl("")).toBeNull();
    expect(parseBookingUrl(null)).toBeNull();
    expect(parseBookingUrl("pas-une-url")).toBeNull();
    expect(parseBookingUrl("https://cal.com")).toBeNull();
  });
});
