<script setup lang="ts">
// LE poulpe de la marque — le dessin déposé à l'INPI, fourni par Éléonore.
// À utiliser là où l'on montre la marque elle-même (pied de page, section
// « pourquoi un poulpe ? ») ; les tracés SVG maison (OctopusLogo/OctopusMark)
// restent pour le décoratif (filigranes, pastilles, vignettes d'articles).
//
// C'est la version SANS le mot-symbole : le dessin s'y voit mieux, et partout
// où on l'affiche le nom « L'Encre Humaine » est déjà écrit juste à côté.
// Le fichier surmonté du mot-symbole reste dans assets/marque/marque.webp.
//
// Le tracé est bleu marine sur fond transparent : sur un fond sombre, le poser
// sur une pastille claire (cf. AppFooter), sinon il se noie.
import marque from "~/assets/marque/Logo-marque.webp";

defineProps<{ title?: string }>();
</script>

<template>
  <!-- Dimensions intrinsèques du fichier : elles réservent la place avant
       chargement (pas de saut de mise en page). -->
  <img
    :src="marque"
    width="663"
    height="577"
    :alt="title ?? ''"
    :aria-hidden="title ? undefined : true"
    loading="lazy"
    decoding="async"
    class="select-none object-contain"
  />
</template>
