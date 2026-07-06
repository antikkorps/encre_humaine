<script setup lang="ts">
// Bandeau CTA éditorial — panneau marine sombre + bouton doré (charte navy + or).
// Mutualisé par les pages offres et les hubs (cohérence). Le bouton renvoie vers
// `to` (généralement /contact ou une ancre). `subtext` = réassurance optionnelle.
defineProps<{
  title: string;
  body?: string;
  ctaLabel: string;
  to: string;
  subtext?: string;
}>();
</script>

<template>
  <div class="relative isolate overflow-hidden rounded-3xl bg-teal-900 px-6 py-14 shadow-lift sm:px-12">
    <InkBlob class="absolute -right-10 -top-14 -z-10 h-56 w-56 text-orange-400/10" />
    <div class="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <h2 class="font-display text-2xl font-bold text-paper sm:text-3xl">{{ title }}</h2>
        <p v-if="body" class="mt-3 max-w-xl text-paper/75">{{ body }}</p>
      </div>
      <NuxtLink
        :to="to"
        class="inline-flex flex-none items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
      >
        {{ ctaLabel }}
        <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
      </NuxtLink>
    </div>
    <p v-if="subtext" class="mt-6 text-center text-sm text-paper/60 sm:text-left">{{ subtext }}</p>
  </div>
</template>
