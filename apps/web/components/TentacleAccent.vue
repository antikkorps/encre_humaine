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

/**
 * Côté du dessin où se trouve la BASE (le trait de coupe franc, par opposition à
 * la pointe fine). Toutes les tentacules ont leur base à gauche… sauf la n° 3,
 * dessinée en miroir. C'est ce que `side` exploite : on retourne le dessin quand
 * il le faut pour que la coupe sorte du cadre — sinon elle « flotte » au milieu
 * de la page (retour Éléonore/Franck). Connaissance centralisée ICI : les pages
 * déclarent seulement de quel bord la tentacule entre.
 */
const BASE_SIDE: Record<TentacleName, "left" | "right"> = {
  "tentacule-1-plein": "left",
  "tentacule-1-trait": "left",
  "tentacule-2-plein": "left",
  "tentacule-2-trait": "left",
  "tentacule-3-plein": "right",
  "tentacule-3-trait": "right",
  "tentacule-4-plein": "left",
  "tentacule-4-trait": "left",
  "tentacule-5-plein": "left",
  "tentacule-5-trait": "left",
};

const props = defineProps<{
  name: TentacleName;
  /** Bord par lequel la tentacule entre dans la page (= où doit sortir sa base). */
  side?: "left" | "right";
}>();

/** Retourné horizontalement quand la base n'est pas déjà du bon côté. */
const mirrored = computed(() => !!props.side && BASE_SIDE[props.name] !== props.side);

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
    class="tentacle-accent motion-drift-slow pointer-events-none select-none"
    :class="mirrored ? '-scale-x-100' : ''"
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
