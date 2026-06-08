<script setup lang="ts">
// Placeholder Accueil — le contenu réel viendra de `home_page` (Directus).
// Spec complète : docs/01-accueil.md. À implémenter dans le run Pages.
useSeoMeta({
  title: "L'Encre Humaine — Conseil RH & accompagnement",
  description:
    "Conseil RH, accompagnement des organisations et des particuliers, et serious games.",
});
</script>

<template>
  <section class="bg-teal-700 text-white">
    <div class="mx-auto max-w-6xl px-4 py-20 text-center">
      <h1 class="font-display text-4xl font-bold sm:text-5xl">L'Encre Humaine</h1>
      <p class="mx-auto mt-4 max-w-2xl text-teal-50">
        Socle technique en place. Le contenu de cette page sera branché sur Directus
        (<code>home_page</code>) — voir <code>docs/01-accueil.md</code>.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <NuxtLink
          to="/organisations"
          class="rounded-full bg-white px-5 py-2.5 font-medium text-teal-800 hover:bg-teal-50"
        >
          Je suis une organisation
        </NuxtLink>
        <NuxtLink
          to="/particuliers"
          class="rounded-full bg-orange-600 px-5 py-2.5 font-medium text-white hover:bg-orange-700"
        >
          Je suis un particulier
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
