<script setup lang="ts">
// Inscription newsletter « Le Fil » — docs/08-newsletter.md, docs/03-api-contracts.md §3.1.
// Double opt-in : le succès = « vérifiez votre boîte mail », pas « inscrit ».
// Schéma valibot partagé + Turnstile + honeypot.

import type { ErrorCode } from "@encre/shared/errors";
import { NewsletterSubscribeSchema } from "@encre/shared/validation";
import * as v from "valibot";

const form = reactive({
  firstName: "",
  email: "",
  website: "", // honeypot
});

const errors = reactive<Record<string, string>>({});
const status = ref<"idle" | "submitting" | "success" | "error">("idle");
const formError = ref("");

const turnstileEl = ref<HTMLElement | null>(null);
const { token, ready, failed, siteKey, reset: resetTurnstile } = useTurnstile(turnstileEl);

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  validation_error: "Adresse e-mail invalide.",
  turnstile_failed: "La vérification anti-robot a échoué. Réessayez.",
  rate_limited: "Trop de tentatives. Patientez une minute.",
  internal_error: "Une erreur est survenue. Réessayez.",
};

function clearErrors() {
  for (const k of Object.keys(errors)) delete errors[k];
  formError.value = "";
}

async function onSubmit() {
  clearErrors();

  if (form.website) {
    status.value = "success"; // honeypot → bot, faux succès
    return;
  }

  const payload = {
    firstName: form.firstName || undefined,
    email: form.email,
    turnstileToken: token.value,
  };

  const result = v.safeParse(NewsletterSubscribeSchema, payload);
  if (!result.success) {
    for (const issue of result.issues) {
      const key = issue.path?.[0]?.key;
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
    }
    if (errors.turnstileToken) formError.value = "Merci de valider la vérification anti-robot.";
    return;
  }

  status.value = "submitting";
  try {
    await $fetch("/api/newsletter/subscribe", { method: "POST", body: result.output });
    status.value = "success";
  } catch (err: unknown) {
    status.value = "error";
    const code = (err as { data?: { error?: { code?: ErrorCode } } }).data?.error?.code;
    formError.value = (code && ERROR_MESSAGES[code]) ?? "L'inscription a échoué. Réessayez.";
    resetTurnstile();
  }
}
</script>

<template>
  <div v-if="status === 'success'" role="status" class="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-ink">
    <p class="font-display text-lg font-semibold text-teal-700">Presque terminé !</p>
    <p class="mt-1 text-sm text-ink/70">
      Vérifiez votre boîte mail et cliquez sur le lien de confirmation pour finaliser l'inscription.
    </p>
  </div>

  <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
    <p v-if="formError" role="alert" class="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
      {{ formError }}
    </p>

    <div>
      <label for="nf-firstName" class="block text-sm font-medium text-ink">
        Prénom <span class="font-normal text-ink/45">(optionnel)</span>
      </label>
      <input
        id="nf-firstName"
        v-model="form.firstName"
        type="text"
        autocomplete="given-name"
        placeholder="Votre prénom"
        class="mt-1 w-full rounded-xl border border-ink/15 bg-paper/40 px-3.5 py-2.5 text-ink transition-colors focus:border-teal-500 focus:bg-white"
      />
    </div>
    <div>
      <label for="nf-email" class="block text-sm font-medium text-ink">E-mail</label>
      <input
        id="nf-email"
        v-model="form.email"
        type="email"
        autocomplete="email"
        required
        placeholder="vous@exemple.com"
        :aria-invalid="!!errors.email"
        :aria-describedby="errors.email ? 'nf-email-err' : undefined"
        class="mt-1 w-full rounded-xl border border-ink/15 bg-paper/40 px-3.5 py-2.5 text-ink transition-colors focus:border-teal-500 focus:bg-white"
      />
      <p v-if="errors.email" id="nf-email-err" role="alert" class="mt-1 text-sm text-orange-700">
        {{ errors.email }}
      </p>
    </div>

    <!-- Honeypot -->
    <div class="absolute -left-[9999px]" aria-hidden="true">
      <label>Ne pas remplir<input v-model="form.website" type="text" tabindex="-1" autocomplete="off" /></label>
    </div>

    <div ref="turnstileEl" class="min-h-[65px]" />
    <p v-if="!siteKey || failed" class="text-sm text-orange-700">
      Vérification anti-robot indisponible pour le moment.
    </p>

    <button
      type="submit"
      :disabled="status === 'submitting' || (!!siteKey && !ready)"
      class="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800 disabled:opacity-60"
    >
      {{ status === "submitting" ? "Inscription…" : "Je m'abonne" }}
    </button>

    <p class="text-xs text-ink/55">
      Double opt-in, désinscription en un clic. Vos données ne sont jamais cédées.
    </p>
  </form>
</template>
