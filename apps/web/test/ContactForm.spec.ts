// Formulaire de contact — docs/09-contact.md, docs/03-api-contracts.md §2.
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
    expect(wrapper.text()).not.toContain("votre message est bien parti");
    const alerts = wrapper.findAll('[role="alert"]');
    expect(alerts.length).toBeGreaterThan(0);
    // Sans token Turnstile, l'erreur globale anti-robot doit apparaître.
    expect(wrapper.text()).toContain("vérification anti-robot");
  });

  it("signale un e-mail malformé sur le champ concerné", async () => {
    const wrapper = await mountSuspended(ContactForm);
    await wrapper.find("#cf-firstName").setValue("Camille");
    await wrapper.find("#cf-email").setValue("pas-un-email");
    await wrapper.find("#cf-message").setValue("Un message suffisamment long pour passer.");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const emailErr = wrapper.find("#cf-email-err");
    expect(emailErr.exists()).toBe(true);
  });

  it("simule un succès silencieux quand le honeypot est rempli (bot)", async () => {
    const wrapper = await mountSuspended(ContactForm);
    // Champ honeypot : hors tabulation, jamais rempli par un humain.
    await wrapper.find('input[tabindex="-1"]').setValue("http://spam.example");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("votre message est bien parti");
  });
});
