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
  is404.value ? "Page introuvable" : "Une erreur est survenue",
);
const message = computed(() =>
  is404.value
    ? "Cette page a changé d'adresse ou n'existe plus — le poulpe a dû l'emporter dans les profondeurs."
    : "Quelque chose s'est mal passé de notre côté. Merci de réessayer dans un instant.",
);

const goHome = () => clearError({ redirect: "/" });

useSeoMeta({
  title: () => `${code.value} — L'Encre Humaine`,
  robots: "noindex, nofollow",
});
</script>

<template>
  <NuxtLayout>
    <section
      class="bg-ink-gradient relative isolate flex min-h-[60vh] items-center overflow-hidden text-paper"
    >
      <!-- Filigrane poulpe (accent identitaire) + tache d'encre. -->
      <OctopusWatermark
        class="absolute -right-24 top-1/2 -z-10 hidden h-[34rem] -translate-y-1/2 rotate-6 text-sand-300/[0.2] md:block"
      />
      <InkBlob
        class="absolute -bottom-10 -left-16 -z-10 h-72 w-72 -rotate-12 text-teal-500/15"
      />

      <div class="mx-auto max-w-2xl px-4 py-24 text-center">
        <p
          class="font-display text-7xl font-bold leading-none text-sand-400 sm:text-8xl"
        >
          {{ code }}
        </p>
        <h1 class="mt-5 font-display text-3xl font-bold sm:text-4xl">
          {{ title }}
        </h1>
        <p class="mx-auto mt-4 max-w-md leading-relaxed text-paper/80">
          {{ message }}
        </p>
        <button
          type="button"
          class="mt-9 inline-flex items-center gap-1.5 rounded-full bg-paper px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
          @click="goHome"
        >
          Retour à l'accueil
        </button>
      </div>
    </section>
  </NuxtLayout>
</template>
