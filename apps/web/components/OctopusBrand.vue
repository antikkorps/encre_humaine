<script setup lang="ts">
// LE poulpe de la marque — le dessin déposé à l'INPI, fourni par Éléonore.
// À utiliser là où l'on montre la marque elle-même (pied de page, section
// « pourquoi un poulpe ? ») ; les tracés SVG maison (OctopusLogo/OctopusMark)
// restent pour le décoratif (filigranes, pastilles, vignettes d'articles).
//
// Deux fichiers livrés, d'où `with-text` : le dessin surmonté du mot-symbole
// « L'Encre Humaine », ou le poulpe seul quand le nom est déjà écrit à côté.

import marqueSeule from "~/assets/marque/Logo-marque.webp";
import marqueAvecTexte from "~/assets/marque/marque.webp";

const props = withDefaults(defineProps<{ withText?: boolean; title?: string }>(), {
  withText: false,
  title: "",
});

// Dimensions intrinsèques des fichiers : elles réservent la place avant
// chargement (pas de saut de mise en page).
const visual = computed(() =>
  props.withText
    ? { src: marqueAvecTexte, width: 663, height: 658 }
    : { src: marqueSeule, width: 663, height: 577 },
);
</script>

<template>
  <img
    :src="visual.src"
    :width="visual.width"
    :height="visual.height"
    :alt="title"
    :aria-hidden="title ? undefined : true"
    loading="lazy"
    decoding="async"
    class="select-none object-contain"
  />
</template>
