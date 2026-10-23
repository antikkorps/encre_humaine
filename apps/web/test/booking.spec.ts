// @vitest-environment node
//
// Décomposition de l'URL de RDV — utils/booking.ts (agnostique du provider).
import { describe, expect, it } from "vitest";
import { parseBookingUrl, pickBookingUrl } from "../utils/booking";

describe("parseBookingUrl", () => {
  it("vise app.cal.com (origin + script) pour Cal.com cloud", () => {
    expect(parseBookingUrl("https://cal.com/eleonore/decouverte")).toEqual({
      origin: "https://app.cal.com",
      calLink: "eleonore/decouverte",
      embedSrc: "https://app.cal.com/embed/embed.js",
    });
  });

  it("vise app.cal.eu pour l'instance UE (RGPD ; l'apex cal.eu redirige)", () => {
    expect(parseBookingUrl("https://cal.eu/encrehumaine/rdv-decouverte")).toEqual({
      origin: "https://app.cal.eu",
      calLink: "encrehumaine/rdv-decouverte",
      embedSrc: "https://app.cal.eu/embed/embed.js",
    });
  });

  it("supporte un domaine self-hosted (embed servi depuis le même origin)", () => {
    expect(parseBookingUrl("https://rdv.encrehumaine.fr/eleonore/30min")).toEqual({
      origin: "https://rdv.encrehumaine.fr",
      calLink: "eleonore/30min",
      embedSrc: "https://rdv.encrehumaine.fr/embed/embed.js",
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

// Un agenda par public : le bon lien selon d'où vient le visiteur, sinon le défaut.
describe("pickBookingUrl", () => {
  const booking = {
    url: "https://cal.com/e/defaut",
    byAudience: { organisation: "https://cal.com/e/rdv-30", particulier: null },
  };

  it("prend le lien du public demandé", () => {
    expect(pickBookingUrl(booking, "organisation")).toBe("https://cal.com/e/rdv-30");
  });

  it("retombe sur le lien par défaut sans public ou sans lien dédié", () => {
    expect(pickBookingUrl(booking, null)).toBe("https://cal.com/e/defaut");
    expect(pickBookingUrl(booking, "particulier")).toBe("https://cal.com/e/defaut");
  });
});
