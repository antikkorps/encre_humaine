// Bandeau de consentement — docs/06-security.md §7.
// Vérifie : affichage tant qu'aucun choix n'est fait, puis disparition après
// accord/refus, la valeur de `thirdParty` selon le choix (gate des embeds), et le
// panneau de réglages fin (« Je règle les tentacules »).
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import ConsentBanner from "~/components/ConsentBanner.vue";
import { useConsent } from "~/composables/useConsent";

function clearConsentCookie() {
  // Nettoyage entre tests (happy-dom) : la Cookie Store API n'y est pas dispo.
  // biome-ignore lint/suspicious/noDocumentCookie: réinitialisation de test, hors runtime app.
  document.cookie = "eh_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

function findButton(wrapper: VueWrapper, label: string) {
  const btn = wrapper.findAll("button").find((b) => b.text().includes(label));
  if (!btn) throw new Error(`bouton "${label}" introuvable`);
  return btn;
}

describe("ConsentBanner", () => {
  beforeEach(() => {
    clearConsentCookie();
  });

  it("s'affiche tant qu'aucun choix n'a été fait", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    const region = wrapper.find('[role="region"]');
    expect(region.exists()).toBe(true);
    expect(region.attributes("aria-label")).toBe("Contrôle des cookies");
  });

  it("disparaît et autorise les tiers après acceptation", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    await findButton(wrapper, "J'autorise l'embarquement").trigger("click");
    await flushPromises();

    expect(wrapper.find('[role="region"]').exists()).toBe(false);
    expect(useConsent().thirdParty.value).toBe(true);
  });

  it("disparaît sans autoriser les tiers après refus", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    await findButton(wrapper, "Je poursuis sans cookies optionnels").trigger("click");
    await flushPromises();

    expect(wrapper.find('[role="region"]').exists()).toBe(false);
    expect(useConsent().thirdParty.value).toBe(false);
    // Un choix explicite a bien été enregistré (pas de réaffichage).
    expect(useConsent().decided.value).toBe(true);
  });

  it("enregistre le choix fin depuis le panneau de réglages", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    await findButton(wrapper, "Je règle les tentacules").trigger("click");
    await flushPromises();

    // Active le toggle « optionnel » puis enregistre.
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await findButton(wrapper, "Enregistrer mes choix").trigger("click");
    await flushPromises();

    expect(wrapper.find('[role="region"]').exists()).toBe(false);
    expect(useConsent().thirdParty.value).toBe(true);
    expect(useConsent().decided.value).toBe(true);
  });
});
