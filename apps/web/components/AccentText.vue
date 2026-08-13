<script setup lang="ts">
// Affiche un texte simple de Directus en interprétant la convention `**…**`
// (cf. `utils/accent.ts`) : le fragment marqué passe en GRAS DORÉ.
//
// Deux tons, comme `SectionHeading`, pour rester lisible (AA) des deux côtés :
//   - `light` (défaut) : doré antique `orange-500` — ~4.9:1 sur crème/blanc ;
//     le doré vif (`sand-400`) y tomberait à 2.3:1, donc illisible.
//   - `dark` : doré vif `sand-300` sur les fonds marine.
//
// Rendu en `<strong>` (mise en avant = importance, pas décoration) et en nœuds
// Vue — jamais de `v-html` : aucun HTML éditeur n'est injecté ici.
//
// ⚠️ Le template tient sur une ligne À DESSEIN : un retour à la ligne entre les
// segments ajouterait une espace parasite au milieu des phrases.
const props = withDefaults(
  defineProps<{
    text?: string | null;
    tone?: "light" | "dark";
  }>(),
  { text: "", tone: "light" },
);

const segments = computed(() => parseAccent(props.text ?? ""));
</script>

<template><template v-for="(segment, i) in segments" :key="i"><strong v-if="segment.accent" class="font-bold" :class="tone === 'dark' ? 'text-sand-300' : 'text-orange-500'">{{ segment.text }}</strong><template v-else>{{ segment.text }}</template></template></template>
