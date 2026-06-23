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
      class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent"
    >
      <span aria-hidden="true" class="h-px w-6 bg-orange-300"></span>
      {{ eyebrow }}
    </p>
    <component
      :is="level === 3 ? 'h3' : 'h2'"
      class="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl"
    >
      {{ title }}
    </component>
    <p
      v-if="subtitle"
      class="mt-3 max-w-2xl text-lg text-ink/70"
      :class="align === 'center' ? 'mx-auto' : ''"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
