// @vitest-environment node
//
// Interrupteurs globaux (`site_settings`) — l'ouverture du site et l'affichage
// des CGV sont pilotés par l'éditrice. Le seul invariant qui compte ici : tout ce
// qui n'est pas explicitement `true` laisse le site FERMÉ et les CGV masquées
// (champ absent parce que le bootstrap n'a pas encore tourné, valeur nulle,
// chaîne "false" d'une saisie exotique…).
import { describe, expect, it } from "vitest";
import { mapSiteFlags } from "../server/utils/content/site-flags";

describe("mapSiteFlags", () => {
  it("seul `true` ouvre", () => {
    expect(mapSiteFlags({ site_open: true, show_cgv: true })).toEqual({
      siteOpen: true,
      showCgv: true,
    });
  });

  it("absent, nul ou faux → fermé et CGV masquées", () => {
    const closed = { siteOpen: false, showCgv: false };
    expect(mapSiteFlags({})).toEqual(closed);
    expect(mapSiteFlags(null)).toEqual(closed);
    expect(mapSiteFlags(undefined)).toEqual(closed);
    expect(mapSiteFlags({ site_open: false, show_cgv: false })).toEqual(closed);
    expect(mapSiteFlags({ site_open: null, show_cgv: null })).toEqual(closed);
  });
});
