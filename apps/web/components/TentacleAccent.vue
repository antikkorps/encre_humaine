<script setup lang="ts">
// Tentacule décoratif (encre). Purement esthétique (aria-hidden).
// Couleur via currentColor → classe text-* ; à poser en absolu, opacité réduite.
// 5 tentacules (1..5) × 2 déclinaisons : « plein » (silhouette) ou « trait » (contour).
type TentacleName =
  | "tentacule-1-plein"
  | "tentacule-1-trait"
  | "tentacule-2-plein"
  | "tentacule-2-trait"
  | "tentacule-3-plein"
  | "tentacule-3-trait"
  | "tentacule-4-plein"
  | "tentacule-4-trait"
  | "tentacule-5-plein"
  | "tentacule-5-trait";

const props = defineProps<{ name: TentacleName }>();

// Import brut (inline) de tous les SVG : indispensable pour que currentColor
// hérite de la couleur du parent (un <img> ne le permettrait pas).
const svgs = import.meta.glob("../assets/tentacules/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const markup = computed(() => {
  const entry = Object.entries(svgs).find(([path]) => path.endsWith(`/${props.name}.svg`));
  // On retire le prologue XML (invalide en contexte HTML via v-html).
  return entry ? entry[1].replace(/<\?xml[^>]*\?>\s*/i, "") : "";
});
</script>

<template>
  <span
    aria-hidden="true"
    class="tentacle-accent pointer-events-none select-none"
    v-html="markup"
  />
</template>

<style scoped>
.tentacle-accent {
  display: block;
}
.tentacle-accent :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
