<script setup lang="ts">
// Filigrane décoratif — l'illustration détaillée du poulpe (OctopusLogo) posée
// en accent ample et discret (hero, pied de page, séparateurs de sections).
// Purement esthétique : OctopusLogo est déjà aria-hidden sans `title`, on
// neutralise seulement pointeur + sélection. Taille / position / opacité /
// couleur se pilotent par les classes passées au composant, p. ex. :
//   <OctopusWatermark class="absolute -right-24 top-0 -z-10 h-[34rem] text-teal-300/10" />
// Règle d'usage : un seul filigrane ample par écran (accent, pas trame).
</script>

<template>
  <OctopusLogo class="pointer-events-none select-none" />
</template>
