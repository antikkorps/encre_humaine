<script setup lang="ts">
// Titre de section réutilisable — docs/00-global.md §a11y (hiérarchie de titres).
// `level` choisit la balise (un seul h1/page → ici h2 par défaut).
withDefaults(
  defineProps<{
    title: string;
    eyebrow?: string;
    subtitle?: string;
    align?: "left" | "center";
    level?: 2 | 3;
  }>(),
  { align: "left", level: 2 },
);
</script>

<template>
  <div :class="align === 'center' ? 'text-center' : ''">
    <p
      v-if="eyebrow"
      class="text-sm font-semibold uppercase tracking-wide text-brand-accent"
    >
      {{ eyebrow }}
    </p>
    <component
      :is="level === 3 ? 'h3' : 'h2'"
      class="font-display text-2xl font-bold text-teal-900 sm:text-3xl"
    >
      {{ title }}
    </component>
    <p
      v-if="subtitle"
      class="mt-3 max-w-2xl text-teal-700"
      :class="align === 'center' ? 'mx-auto' : ''"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
