// Formulaire « Être rappelé·e » — docs/09-contact.md, docs/03-api-contracts.md §2.
// Vérifie la validation client (schéma valibot PARTAGÉ) et le piège honeypot.
// La vérif serveur reste la source de vérité (couverte par les tests d'endpoint
// en Phase 1) ; ici on valide le confort client et le court-circuit anti-bot.
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ContactForm from "~/components/ContactForm.vue";

describe("ContactForm", () => {
  it("bloque une soumission vide et signale les champs invalides", async () => {
    const wrapper = await mountSuspended(ContactForm);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    // Toujours sur le formulaire (pas de bascule succès) + messages d'erreur.
    expect(wrapper.find("form").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("c'est noté");
    const alerts = wrapper.findAll('[role="alert"]');
    expect(alerts.length).toBeGreaterThan(0);
    // Sans token Turnstile, l'erreur globale anti-robot doit apparaître.
    expect(wrapper.text()).toContain("vérification anti-robot");
  });

  it("signale un e-mail malformé sur le champ concerné", async () => {
    const wrapper = await mountSuspended(ContactForm);
    await wrapper.find("#cf-firstName").setValue("Camille");
    await wrapper.find("#cf-phone").setValue("06 12 34 56 78");
    await wrapper.find("#cf-email").setValue("pas-un-email");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find("#cf-email-err").exists()).toBe(true);
    expect(wrapper.find("#cf-phone-err").exists()).toBe(false);
  });

  it("exige un numéro de téléphone et un créneau ; le message reste facultatif", async () => {
    const wrapper = await mountSuspended(ContactForm);
    await wrapper.find("#cf-phone").setValue("06 12");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find("#cf-phone-err").exists()).toBe(true);
    expect(wrapper.text()).toContain("Choisissez au moins un jour.");
    expect(wrapper.text()).toContain("Choisissez un moment de la journée.");
    expect(wrapper.find("#cf-message-err").exists()).toBe(false);
  });

  it("« Peu importe » et un jour précis s'excluent", async () => {
    const wrapper = await mountSuspended(ContactForm);
    const day = (value: string) => wrapper.find(`input[type="checkbox"][value="${value}"]`);

    await day("mardi").setValue(true);
    await day("jeudi").setValue(true);
    await day("peu importe").setValue(true);
    expect((day("mardi").element as HTMLInputElement).checked).toBe(false);
    expect((day("jeudi").element as HTMLInputElement).checked).toBe(false);
    expect((day("peu importe").element as HTMLInputElement).checked).toBe(true);

    await day("lundi").setValue(true);
    expect((day("peu importe").element as HTMLInputElement).checked).toBe(false);
    expect((day("lundi").element as HTMLInputElement).checked).toBe(true);
  });

  it("simule un succès silencieux quand le honeypot est rempli (bot)", async () => {
    const wrapper = await mountSuspended(ContactForm);
    // Champ honeypot : hors tabulation, jamais rempli par un humain.
    await wrapper.find('input[tabindex="-1"]').setValue("http://spam.example");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("c'est noté");
  });
});
