<script setup lang="ts">
// Encart de déblocage du rapport (docs/11-diagnostics.md §Parcours) : email,
// consentement OBLIGATOIRE non coché, newsletter FACULTATIVE non cochée,
// Turnstile. Le serveur recalcule le résultat, enregistre, envoie l'email et
// renvoie le jeton du lien de rapport.
import { type Answers, SENSITIVE_ANSWERS } from "@encre/shared/diagnostics";
import type { DiagnosticContent } from "~/types/content";

const props = defineProps<{ content: DiagnosticContent; answers: Answers }>();
const emit = defineEmits<{ unlocked: [token: string] }>();
const route = useRoute();

const email = ref("");
const consent = ref(false);
const newsletter = ref(false);
const website = ref(""); // honeypot
const error = ref("");
const pending = ref(false);
const turnstileEl = ref<HTMLElement | null>(null);
const { token, reset: resetTurnstile } = useTurnstile(turnstileEl);
const unlock = computed(() => props.content.texts.unlock);

const withoutSensitive = (answers: Answers): Answers =>
  Object.fromEntries(
    Object.entries(answers).filter(
      ([id]) => !(SENSITIVE_ANSWERS as readonly string[]).includes(id),
    ),
  );

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Message d'erreur du formulaire, ou "" s'il peut partir. */
function validationError(): string {
  if (!EMAIL_RE.test(email.value.trim())) return "Saisissez une adresse email valide.";
  if (!consent.value) return "Cochez la case pour recevoir votre rapport.";
  return "";
}

async function submit() {
  error.value = validationError();
  if (error.value) return;
  pending.value = true;
  try {
    const res = await $fetch<{ token: string }>("/api/diagnostics/unlock", {
      method: "POST",
      body: {
        kind: props.content.kind,
        // La réponse sensible ne quitte jamais le navigateur.
        answers: withoutSensitive(props.answers),
        email: email.value.trim(),
        consentReport: consent.value,
        consentNewsletter: newsletter.value,
        source: typeof route.query.source === "string" ? route.query.source : undefined,
        turnstileToken: token.value,
        website: website.value,
      },
    });
    emit("unlocked", res.token);
  } catch {
    error.value = "Le rapport n'a pas pu être débloqué. Vérifiez vos informations et réessayez.";
    resetTurnstile();
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <form class="rounded-3xl border border-ink/10 bg-white p-6 shadow-lift sm:p-8" novalidate @submit.prevent="submit">
    <h3 class="font-display text-2xl font-bold text-ink">{{ unlock.title }}</h3>
    <p class="mt-2 text-sm leading-relaxed text-ink/70">{{ unlock.body }}</p>

    <label for="diag-email" class="mt-5 block text-sm font-semibold text-ink">Votre email</label>
    <input
      id="diag-email"
      v-model="email"
      type="email"
      autocomplete="email"
      required
      class="mt-1 w-full rounded-2xl border border-ink/15 px-4 py-3 text-ink focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
      placeholder="vous@exemple.fr"
    />
    <label class="mt-4 flex items-start gap-3 text-sm leading-relaxed text-ink/80">
      <input v-model="consent" type="checkbox" required class="mt-1 h-4 w-4 flex-none accent-teal-700" />
      <span>
        {{ unlock.consent }}
        <NuxtLink to="/confidentialite" target="_blank" class="underline underline-offset-2">(lire)</NuxtLink>
      </span>
    </label>
    <label class="mt-3 flex items-start gap-3 text-sm leading-relaxed text-ink/80">
      <input v-model="newsletter" type="checkbox" class="mt-1 h-4 w-4 flex-none accent-teal-700" />
      <span>{{ unlock.newsletter }}</span>
    </label>
    <input v-model="website" type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />
    <div ref="turnstileEl" class="mt-4 min-h-[65px]" />

    <p v-if="error" class="mt-3 text-sm text-red-700" role="alert">{{ error }}</p>
    <button
      type="submit"
      :disabled="pending"
      class="mt-4 w-full rounded-full bg-teal-800 px-6 py-3.5 font-semibold text-paper shadow-soft hover:bg-teal-900 disabled:opacity-60"
    >
      {{ unlock.button }}
    </button>
  </form>
</template>
