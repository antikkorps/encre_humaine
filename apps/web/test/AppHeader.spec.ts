// Nav principale — tout lien doit porter un TEXTE : un lien réduit à une icône
// est lu « / » par les robots qui extraient le texte (audit SEO, 2026-10-22).
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AppHeader from "~/components/AppHeader.vue";

describe("AppHeader", () => {
  it("donne un texte à chaque lien vers l'accueil", async () => {
    const wrapper = await mountSuspended(AppHeader);
    const homeLinks = wrapper.findAll('a[href="/"]');
    expect(homeLinks.length).toBeGreaterThan(0);
    for (const link of homeLinks) expect(link.text().trim()).not.toBe("");
    expect(homeLinks.some((link) => link.text().trim() === "Accueil")).toBe(true);
  });
});
