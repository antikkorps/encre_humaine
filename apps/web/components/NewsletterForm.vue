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
  <div v-if="status === 'success'" role="status" class="rounded-2xl border border-teal-100 bg-teal-50 p-6 text-teal-800">
    <p class="font-medium">Presque terminé !</p>
    <p class="mt-1 text-sm">
      Vérifiez votre boîte mail et cliquez sur le lien de confirmation pour finaliser l'inscription.
    </p>
  </div>

  <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
    <p v-if="formError" role="alert" class="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
      {{ formError }}
    </p>

    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="sm:w-1/3">
        <label for="nf-firstName" class="sr-only">Prénom (optionnel)</label>
        <input
          id="nf-firstName"
          v-model="form.firstName"
          type="text"
          autocomplete="given-name"
          placeholder="Prénom (optionnel)"
          class="w-full rounded-lg border border-teal-200 px-3 py-2 focus:border-teal-500"
        />
      </div>
      <div class="flex-1">
        <label for="nf-email" class="sr-only">E-mail</label>
        <input
          id="nf-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          placeholder="vous@exemple.com"
          :aria-invalid="!!errors.email"
          :aria-describedby="errors.email ? 'nf-email-err' : undefined"
          class="w-full rounded-lg border border-teal-200 px-3 py-2 focus:border-teal-500"
        />
      </div>
    </div>
    <p v-if="errors.email" id="nf-email-err" role="alert" class="text-sm text-orange-700">
      {{ errors.email }}
    </p>

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
      class="rounded-full bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
    >
      {{ status === "submitting" ? "Inscription…" : "Je m'abonne" }}
    </button>

    <p class="text-xs text-teal-600">
      Double opt-in, désinscription en un clic. Vos données ne sont jamais cédées.
    </p>
  </form>
</template>
