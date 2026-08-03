<script setup lang="ts">
// Bloc d'appel à l'action — docs/00-global.md (CTA final de page).
// Panneau « encre » sombre et illustré. `variant` aligne l'accent du bouton sur
// le public : teal/papier (organisations) / orange (particuliers).
const props = withDefaults(
  defineProps<{
    title: string;
    ctaLabel: string;
    to: string;
    description?: string;
    /** Réassurance sous le bouton (ex. « 30 minutes, sans engagement »). */
    subtext?: string;
    variant?: "teal" | "orange";
  }>(),
  { variant: "teal" },
);

const button = computed(() =>
  props.variant === "orange"
    ? "bg-orange-500 text-white hover:bg-orange-600"
    : "bg-paper text-ink hover:bg-white",
);
</script>

<template>
  <section
    class="bg-ink-gradient relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center shadow-lift sm:px-12 sm:py-16"
  >
    <InkBlob class="absolute -right-12 -top-16 -z-10 h-56 w-56 text-teal-500/20" />
    <InkBlob class="absolute -bottom-20 -left-10 -z-10 h-52 w-52 text-orange-400/15" />

    <h2 class="font-display text-3xl font-bold text-paper sm:text-4xl">
      {{ title }}
    </h2>
    <p v-if="description" class="mx-auto mt-4 max-w-2xl text-paper/75">
      {{ description }}
    </p>
    <NuxtLink
      :to="to"
      class="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold shadow-soft transition-colors"
      :class="button"
    >
      {{ ctaLabel }}
      <span aria-hidden="true">→</span>
    </NuxtLink>
    <!-- `text-center` : la justification globale des paragraphes de `main`
         l'emporterait sur l'alignement hérité du panneau. -->
    <p v-if="subtext" class="mt-5 text-center text-sm text-paper/60">{{ subtext }}</p>
  </section>
</template>
