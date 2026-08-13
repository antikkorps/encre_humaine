// Rendu de la convention `**…**` — docs/00-global.md §Typographie éditoriale.
// Le piège de ce composant est l'ESPACE PARASITE : un template sur plusieurs
// lignes insérerait un blanc entre les segments et abîmerait les phrases.
// On vérifie donc le texte rendu au caractère près, plus le ton doré.
//
// ⚠️ On lit `element.textContent` (le DOM réel) et non `wrapper.text()` : la
// racine du composant est un fragment, et `text()` recolle les nœuds racines
// APRÈS les avoir élagués — il « mange » les espaces de bord et ferait échouer
// le test sur un rendu pourtant correct.
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import AccentText from "~/components/AccentText.vue";

describe("AccentText", () => {
  it("rend la phrase intacte, marques retirées", async () => {
    const wrapper = await mountSuspended(AccentText, {
      props: { text: "Vous avez besoin de **visibilité**, de méthode." },
    });
    expect(wrapper.element.textContent).toBe("Vous avez besoin de visibilité, de méthode.");
    expect(wrapper.find("strong").text()).toBe("visibilité");
  });

  it("met le fragment en doré selon le fond (AA)", async () => {
    const light = await mountSuspended(AccentText, { props: { text: "**a**" } });
    expect(light.find("strong").classes()).toContain("text-orange-500");

    const dark = await mountSuspended(AccentText, {
      props: { text: "**a**", tone: "dark" },
    });
    expect(dark.find("strong").classes()).toContain("text-sand-300");
  });

  it("ne rend rien de superflu sans marque ni texte", async () => {
    const plain = await mountSuspended(AccentText, { props: { text: "Sans mise en avant" } });
    expect(plain.element.textContent).toBe("Sans mise en avant");
    expect(plain.find("strong").exists()).toBe(false);

    const empty = await mountSuspended(AccentText, { props: { text: null } });
    expect(empty.element.textContent).toBe("");
  });
});
