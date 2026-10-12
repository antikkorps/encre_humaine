<script setup lang="ts">
// Formulaire « Être rappelé·e » — docs/09-contact.md, docs/03-api-contracts.md §2.
// Remplace l'ancien « M'envoyer un message » (demande Éléonore, 2026-10) : le
// rappel exige un téléphone et un créneau, le message devient facultatif.
// Validation valibot PARTAGÉE (même schéma que l'endpoint, DRY) + Turnstile +
// honeypot. États idle/submitting/success/error. La vérif serveur reste la source
// de vérité ; la validation client n'est qu'un confort.

import type { ErrorCode } from "@encre/shared/errors";
import {
  type Audience,
  CALLBACK_DAYS,
  CALLBACK_SLOTS,
  type CallbackDay,
  type CallbackSlot,
  ContactPayloadSchema,
} from "@encre/shared/validation";
import * as v from "valibot";

const route = useRoute();

const ANY_DAY: CallbackDay = "peu importe";

const form = reactive({
  firstName: "",
  phone: "",
  email: "",
  audience: "" as "" | Audience,
  callbackDays: [] as CallbackDay[],
  callbackSlot: "" as "" | CallbackSlot,
  message: "",
  website: "", // honeypot — doit rester vide
});

// « Peu importe » et un jour précis s'excluent : cocher l'un décoche l'autre.
watch(
  () => [...form.callbackDays],
  (days, previous) => {
    const added = days.find((d) => !previous.includes(d));
    if (added === ANY_DAY && days.length > 1) form.callbackDays = [ANY_DAY];
    else if (added && added !== ANY_DAY && days.includes(ANY_DAY)) {
      form.callbackDays = days.filter((d) => d !== ANY_DAY);
    }
  },
);

const errors = reactive<Record<string, string>>({});
const status = ref<"idle" | "submitting" | "success" | "error">("idle");
const formError = ref("");

const turnstileEl = ref<HTMLElement | null>(null);
const { token, ready, failed, siteKey, reset: resetTurnstile } = useTurnstile(turnstileEl);

const ERROR_MESSAGES: Partial<Record<ErrorCode, string>> = {
  validation_error: "Certains champs sont invalides. Vérifiez votre saisie.",
  turnstile_failed: "La vérification anti-robot a échoué. Réessayez.",
  rate_limited: "Trop de tentatives. Patientez une minute avant de réessayer.",
  internal_error: "Une erreur est survenue. Réessayez dans un instant.",
};

/** Libellé affiché d'un choix (« peu importe » → « Peu importe »). */
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function clearErrors() {
  for (const k of Object.keys(errors)) delete errors[k];
  formError.value = "";
}

async function onSubmit() {
  clearErrors();

  // Honeypot rempli → bot probable : on simule un succès sans rien envoyer.
  if (form.website) {
    status.value = "success";
    return;
  }

  const payload = {
    firstName: form.firstName,
    phone: form.phone,
    email: form.email,
    audience: form.audience as Audience,
    callbackDays: form.callbackDays,
    callbackSlot: form.callbackSlot as CallbackSlot,
    message: form.message,
    sourcePage: route.path,
    turnstileToken: token.value,
  };

  const result = v.safeParse(ContactPayloadSchema, payload);
  if (!result.success) {
    for (const issue of result.issues) {
      const key = issue.path?.[0]?.key;
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
    }
    if (errors.turnstileToken) {
      formError.value = "Merci de valider la vérification anti-robot.";
    }
    return;
  }

  status.value = "submitting";
  try {
    await $fetch("/api/contact", { method: "POST", body: result.output });
    status.value = "success";
  } catch (err: unknown) {
    status.value = "error";
    const data = (err as { data?: { error?: { code?: ErrorCode } } }).data;
    const code = data?.error?.code;
    formError.value =
      (code && ERROR_MESSAGES[code]) ?? "L'envoi a échoué. Réessayez dans un instant.";
    resetTurnstile();
  }
}
</script>

<template>
  <div v-if="status === 'success'" role="status" class="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-ink">
    <p class="font-display text-lg font-semibold text-teal-700">Merci, c'est noté.</p>
    <p class="mt-1 text-sm text-ink/70">
      Je vous rappelle sous 48 heures ouvrées, au moment que vous avez choisi.
    </p>
  </div>

  <form v-else class="space-y-5" novalidate @submit.prevent="onSubmit">
    <p v-if="formError" role="alert" class="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
      {{ formError }}
    </p>

    <div>
      <label for="cf-firstName" class="block text-sm font-medium text-ink">Prénom</label>
      <input
        id="cf-firstName"
        v-model="form.firstName"
        type="text"
        autocomplete="given-name"
        required
        :aria-invalid="!!errors.firstName"
        :aria-describedby="errors.firstName ? 'cf-firstName-err' : undefined"
        class="mt-1 w-full rounded-xl border border-ink/15 bg-paper/40 px-3.5 py-2.5 text-ink transition-colors focus:border-teal-500 focus:bg-white"
      />
      <p v-if="errors.firstName" id="cf-firstName-err" role="alert" class="mt-1 text-sm text-orange-700">
        {{ errors.firstName }}
      </p>
    </div>

    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label for="cf-phone" class="block text-sm font-medium text-ink">Téléphone</label>
        <input
          id="cf-phone"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
          inputmode="tel"
          required
          :aria-invalid="!!errors.phone"
          :aria-describedby="errors.phone ? 'cf-phone-err' : undefined"
          class="mt-1 w-full rounded-xl border border-ink/15 bg-paper/40 px-3.5 py-2.5 text-ink transition-colors focus:border-teal-500 focus:bg-white"
        />
        <p v-if="errors.phone" id="cf-phone-err" role="alert" class="mt-1 text-sm text-orange-700">
          {{ errors.phone }}
        </p>
      </div>
      <div>
        <label for="cf-email" class="block text-sm font-medium text-ink">E-mail</label>
        <input
          id="cf-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          :aria-invalid="!!errors.email"
          :aria-describedby="errors.email ? 'cf-email-err' : undefined"
          class="mt-1 w-full rounded-xl border border-ink/15 bg-paper/40 px-3.5 py-2.5 text-ink transition-colors focus:border-teal-500 focus:bg-white"
        />
        <p v-if="errors.email" id="cf-email-err" role="alert" class="mt-1 text-sm text-orange-700">
          {{ errors.email }}
        </p>
      </div>
    </div>

    <fieldset>
      <legend class="text-sm font-medium text-ink">Vous êtes</legend>
      <div class="mt-2 flex flex-wrap gap-4">
        <label class="inline-flex items-center gap-2 text-sm text-ink/80">
          <input v-model="form.audience" type="radio" value="organisation" name="audience" />
          Une organisation
        </label>
        <label class="inline-flex items-center gap-2 text-sm text-ink/80">
          <input v-model="form.audience" type="radio" value="particulier" name="audience" />
          Un particulier
        </label>
      </div>
      <p v-if="errors.audience" role="alert" class="mt-1 text-sm text-orange-700">
        {{ errors.audience }}
      </p>
    </fieldset>

    <!-- Créneau de rappel : jours (plusieurs choix) + moment de la journée (un seul). -->
    <fieldset class="rounded-2xl border border-ink/10 bg-paper/40 p-4 sm:p-5">
      <legend class="px-1 font-display text-base font-semibold text-ink">
        Quand puis-je vous appeler ?
      </legend>

      <fieldset>
        <legend class="text-sm font-medium text-ink">Jour(s) de préférence</legend>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <label
            v-for="day in CALLBACK_DAYS"
            :key="day"
            class="inline-flex items-center gap-2 text-sm text-ink/80"
          >
            <input v-model="form.callbackDays" type="checkbox" :value="day" name="callbackDays" />
            {{ capitalize(day) }}
          </label>
        </div>
        <p v-if="errors.callbackDays" role="alert" class="mt-1 text-sm text-orange-700">
          {{ errors.callbackDays }}
        </p>
      </fieldset>

      <fieldset class="mt-4">
        <legend class="text-sm font-medium text-ink">Moment de la journée</legend>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <label
            v-for="slot in CALLBACK_SLOTS"
            :key="slot"
            class="inline-flex items-center gap-2 text-sm text-ink/80"
          >
            <input v-model="form.callbackSlot" type="radio" :value="slot" name="callbackSlot" />
            {{ capitalize(slot) }}
          </label>
        </div>
        <p v-if="errors.callbackSlot" role="alert" class="mt-1 text-sm text-orange-700">
          {{ errors.callbackSlot }}
        </p>
      </fieldset>
    </fieldset>

    <div>
      <label for="cf-message" class="block text-sm font-medium text-ink">
        En une ou deux phrases, ce qui vous amène
        <span class="font-normal text-ink/55">(facultatif)</span>
      </label>
      <textarea
        id="cf-message"
        v-model="form.message"
        rows="3"
        :aria-invalid="!!errors.message"
        :aria-describedby="errors.message ? 'cf-message-err' : undefined"
        class="mt-1 w-full rounded-xl border border-ink/15 bg-paper/40 px-3.5 py-2.5 text-ink transition-colors focus:border-teal-500 focus:bg-white"
      />
      <p v-if="errors.message" id="cf-message-err" role="alert" class="mt-1 text-sm text-orange-700">
        {{ errors.message }}
      </p>
    </div>

    <!-- Honeypot : invisible et hors tabulation. Un humain ne le remplit jamais. -->
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
      class="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-orange-600 disabled:opacity-60"
    >
      <template v-if="status === 'submitting'">Envoi…</template>
      <template v-else>Être rappelé·e <span aria-hidden="true">→</span></template>
    </button>
  </form>
</template>
