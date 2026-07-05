<script setup lang="ts">
// Page d'erreur globale (404 / 5xx) — remplace la page Nuxt par défaut. Reprend
// le ton « encre/poulpe » : bandeau sombre, filigrane poulpe, clin d'œil sur le 404.
// Enveloppée dans le layout par défaut → en-tête + pied de page conservés (l'usager
// garde la navigation pour repartir). Non indexée.
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const code = computed(() => props.error?.status ?? 500);
const is404 = computed(() => code.value === 404);

const title = computed(() =>
  is404.value ? "Erreur spatio-poulporelle détectée" : "Une erreur est survenue",
);

// Texte 404 signé Éléonore — une phrase d'accroche puis le récit décalé. Le 5xx
// garde un message court et rassurant (défaillance serveur, pas un clin d'œil).
const lead = computed(() =>
  is404.value
    ? "Nous avons un petit problème technique."
    : "Quelque chose s'est mal passé de notre côté.",
);
const body = computed(() =>
  is404.value
    ? [
        "Notre poulpe stagiaire, probablement un peu trop confiant dans ses capacités de navigation inter-dimensionnelle, a déplacé cette page sans laisser de trace exploitable.",
        "Résultat : vous venez de tomber dans une zone de flou numérique.",
        "Rassurez-vous, ce type d'incident reste rare (mais pas impossible quand on confie des réglages du site à un céphalopode en apprentissage).",
        "Notre équipe est déjà en train de rétablir la situation.",
      ]
    : ["Merci de réessayer dans un instant — nous rétablissons ça au plus vite."],
);

// Pied de carte façon rapport d'incident tamponné (404 uniquement). Le dernier
// point clignote pour signaler que la résolution est « en cours ».
const report = [
  { label: "Incident classé", value: "erreur spatio-poulporelle" },
  { label: "Niveau de flou", value: "temporaire" },
  { label: "Statut", value: "retour à la clarté en cours", live: true },
];

const goHome = () => clearError({ redirect: "/" });

useSeoMeta({
  title: () => `${code.value} — L'Encre Humaine`,
  robots: "noindex, nofollow",
});
</script>

<template>
  <NuxtLayout>
    <section
      class="bg-ink-gradient relative isolate grid min-h-[72vh] place-items-center overflow-hidden px-4 py-20 text-paper"
    >
      <!-- Filigrane poulpe (accent identitaire) + tache d'encre. -->
      <OctopusWatermark
        class="pointer-events-none absolute -right-28 top-1/2 -z-10 hidden h-[38rem] -translate-y-1/2 rotate-6 text-sand-300/[0.16] lg:block"
      />
      <InkBlob
        class="pointer-events-none absolute -bottom-16 -left-20 -z-10 h-80 w-80 -rotate-12 text-teal-500/15"
      />

      <div class="mx-auto w-full max-w-xl">
        <!-- Masthead : le code + le titre, centrés, comme une manchette. -->
        <div class="text-center">
          <p
            class="font-display text-[5.5rem] font-bold leading-none text-sand-400 sm:text-8xl"
          >
            {{ code }}
          </p>
          <h1 class="mt-4 font-display text-3xl font-bold sm:text-4xl">
            {{ title }}
          </h1>
        </div>

        <!-- Carte « rapport d'incident » : texte aligné à gauche (lisible) et,
             pour le 404, un pied tamponné qui ancre le clin d'œil. -->
        <div
          class="mt-9 overflow-hidden rounded-2xl border border-paper/10 bg-ink-950/40 text-left shadow-soft backdrop-blur-sm"
        >
          <div class="space-y-3 px-6 py-6 leading-relaxed text-paper/75 sm:px-8 sm:py-7">
            <p class="text-lg font-medium text-paper">{{ lead }}</p>
            <p v-for="(paragraph, index) in body" :key="index">{{ paragraph }}</p>
          </div>

          <dl
            v-if="is404"
            class="flex flex-col gap-2.5 border-t border-paper/10 px-6 py-4 font-mono text-[0.68rem] uppercase tracking-wider text-paper/45 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:px-8"
          >
            <div v-for="item in report" :key="item.label" class="flex items-center gap-2">
              <span
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-sand-400"
                :class="item.live && 'animate-pulse'"
              />
              <span>{{ item.label }} : <span class="text-paper/70">{{ item.value }}</span></span>
            </div>
          </dl>
        </div>

        <!-- Actions : retour accueil (icône maison de la navbar) + contact. -->
        <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-paper px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
            @click="goHome"
          >
            <!-- Icône maison identique à celle de la barre de navigation. -->
            <svg
              v-if="is404"
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 11.5 12 4l9 7.5M5.5 10v9.5a1 1 0 0 0 1 1H10v-5.5h4V20.5h3.5a1 1 0 0 0 1-1V10"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span v-if="is404">Retour à un espace plus structuré</span>
            <span v-else>Retour à l'accueil</span>
          </button>
          <NuxtLink
            v-if="is404"
            to="/contact"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-paper/40 px-7 py-3.5 font-semibold text-paper transition-colors hover:border-paper hover:bg-paper/10"
          >
            <!-- Icône enveloppe au trait, assortie à l'icône maison. -->
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM3.5 7l8.5 6 8.5-6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Contacter L'Encre Humaine
          </NuxtLink>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
