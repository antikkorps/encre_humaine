// Branchements des diagnostics sur le site (mail d'Éléonore du 2026-10-26) :
// encart en bas des pages d'offre et second bouton des hubs, tous deux vers la
// page du diagnostic du bon public.
import { B2B_TEXTS, B2C_TEXTS } from "@encre/shared/diagnostics";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import DiagnosticHubLink from "~/components/diagnostic/HubLink.vue";
import DiagnosticOfferNudge from "~/components/diagnostic/OfferNudge.vue";
import { mapDiagnosticPromo } from "../server/utils/content/diagnostic";

describe("mapDiagnosticPromo", () => {
  it("pointe chaque public vers la page de son diagnostic, avec les textes fusionnés", () => {
    expect(mapDiagnosticPromo("b2b", B2B_TEXTS)).toEqual({
      ...B2B_TEXTS.promo,
      path: "/organisations/diagnostic",
    });
    expect(mapDiagnosticPromo("b2c", B2C_TEXTS).path).toBe("/particuliers/diagnostic");
  });
});

const promo = { ...B2B_TEXTS.promo, path: "/organisations/diagnostic" };

describe("DiagnosticOfferNudge", () => {
  it("affiche titre, phrase et bouton vers le diagnostic", async () => {
    const wrapper = await mountSuspended(DiagnosticOfferNudge, { props: { promo } });
    expect(wrapper.text()).toContain(promo.title);
    expect(wrapper.text()).toContain(promo.body);
    expect(wrapper.get('a[href="/organisations/diagnostic"]').text()).toContain(promo.label);
  });
});

describe("DiagnosticHubLink", () => {
  it("mène au diagnostic avec le libellé du hub", async () => {
    const wrapper = await mountSuspended(DiagnosticHubLink, { props: { promo } });
    expect(wrapper.get('a[href="/organisations/diagnostic"]').text()).toContain(promo.hubLabel);
  });
});
