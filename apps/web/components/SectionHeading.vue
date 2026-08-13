<script setup lang="ts">
// Titre de section réutilisable — docs/00-global.md §a11y (hiérarchie de titres).
// `level` choisit la balise (un seul h1/page → ici h2 par défaut).
//
// `eyebrow` = le « titre jaune » demandé par Éléonore : une pastille dorée qui
// pète (kicker) au-dessus du titre navy. Deux tons selon le fond :
//   - `tone="light"` (défaut) : pastille dorée claire + texte doré profond (AA
//     sur crème/blanc).
//   - `tone="dark"` : pastille dorée translucide + texte doré vif (fonds sombres,
//     ex. section méthode).
// Titre ET sous-titre passent par `AccentText` : un fragment encadré de `**`
// dans Directus (ex. `**Des parcours mieux compris.**`) s'affiche en gras doré,
// sans toucher au code (cf. `utils/accent.ts`).
withDefaults(
  defineProps<{
    title: string;
    eyebrow?: string;
    subtitle?: string;
    align?: "left" | "center";
    tone?: "light" | "dark";
    level?: 2 | 3;
    /** Élargit le sous-titre (max-w-4xl) pour qu'il « prenne la page » (méthode). */
    wide?: boolean;
  }>(),
  { align: "left", tone: "light", level: 2, wide: false },
);
</script>

<template>
  <div :class="align === 'center' ? 'text-center' : ''">
    <p
      v-if="eyebrow"
      class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"
      :class="
        tone === 'dark'
          ? 'bg-orange-300/15 text-orange-200 ring-1 ring-inset ring-orange-300/25'
          : 'bg-orange-100 text-orange-600 ring-1 ring-inset ring-orange-300/50'
      "
    >
      <span
        aria-hidden="true"
        class="h-1.5 w-1.5 rounded-full"
        :class="tone === 'dark' ? 'bg-orange-300' : 'bg-sand-400'"
      ></span>
      {{ eyebrow }}
    </p>
    <component
      :is="level === 3 ? 'h3' : 'h2'"
      class="mt-4 font-display text-3xl font-bold sm:text-4xl"
      :class="tone === 'dark' ? 'text-paper' : 'text-ink'"
    >
      <AccentText :text="title" :tone="tone" />
    </component>
    <p
      v-if="subtitle"
      class="mt-3 text-lg"
      :class="[
        wide ? 'max-w-4xl' : 'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : '',
        tone === 'dark' ? 'text-paper/75' : 'text-ink/70',
      ]"
    >
      <AccentText :text="subtitle" :tone="tone" />
    </p>
  </div>
</template>
