<script setup lang="ts">
// Accueil de choix des diagnostics, pour les visiteurs du site (facultatif
// d'après le cahier des charges) : les liens directs restent la voie principale.
// Titres et intros viennent des textes de chaque diagnostic (Directus).
import { DIAGNOSTIC_PATHS } from "@encre/shared/diagnostics";
import type { DiagnosticContent } from "~/types/content";

const [{ data: b2b }, { data: b2c }] = await Promise.all([
  useFetch<DiagnosticContent>("/api/content/diagnostic/b2b"),
  useFetch<DiagnosticContent>("/api/content/diagnostic/b2c"),
]);
const choices = computed(() => [
  { to: DIAGNOSTIC_PATHS.b2b, eyebrow: "Je représente une organisation", content: b2b.value },
  {
    to: DIAGNOSTIC_PATHS.b2c,
    eyebrow: "Je suis en transition professionnelle",
    content: b2c.value,
  },
]);

useSeoMeta({
  title: "Faire le point en quatre minutes — L'Encre Humaine",
  description: "Deux diagnostics courts, gratuits, avec des conseils concrets à la fin.",
});
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-12 sm:py-16">
    <h1 class="font-display text-4xl font-bold text-ink sm:text-5xl">Faire le point en quatre minutes</h1>
    <p class="mt-4 text-lg text-ink/70">
      Deux diagnostics courts, un rapport avec des conseils concrets à la fin. Choisissez celui qui vous correspond.
    </p>
    <ul class="mt-10 grid gap-6 sm:grid-cols-2">
      <li v-for="choice in choices" :key="choice.to">
        <NuxtLink
          :to="choice.to"
          class="flex h-full flex-col rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          <span class="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">{{ choice.eyebrow }}</span>
          <span class="mt-2 font-display text-xl font-bold text-ink">{{ choice.content?.texts.title }}</span>
          <span class="mt-2 flex-1 leading-relaxed text-ink/65">{{ choice.content?.texts.intro }}</span>
          <span class="mt-4 font-semibold text-teal-700">Commencer <span aria-hidden="true">→</span></span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
