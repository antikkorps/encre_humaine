<script setup lang="ts">
// Bloc d'appel à l'action — docs/00-global.md (CTA final de page).
// `variant` aligne l'accent sur le public : teal (organisations) / orange (particuliers).
const props = withDefaults(
  defineProps<{
    title: string;
    ctaLabel: string;
    to: string;
    description?: string;
    variant?: "teal" | "orange";
  }>(),
  { variant: "teal" },
);

const surface = computed(() => (props.variant === "orange" ? "bg-orange-50" : "bg-teal-50"));
const button = computed(() =>
  props.variant === "orange"
    ? "bg-orange-600 text-white hover:bg-orange-700"
    : "bg-teal-700 text-white hover:bg-teal-800",
);
</script>

<template>
  <section :class="surface" class="rounded-2xl px-6 py-12 text-center">
    <h2 class="font-display text-2xl font-bold text-teal-900 sm:text-3xl">
      {{ title }}
    </h2>
    <p v-if="description" class="mx-auto mt-3 max-w-2xl text-teal-700">
      {{ description }}
    </p>
    <NuxtLink
      :to="to"
      class="mt-6 inline-flex items-center rounded-full px-6 py-3 font-medium transition-colors"
      :class="button"
    >
      {{ ctaLabel }}
    </NuxtLink>
  </section>
</template>
