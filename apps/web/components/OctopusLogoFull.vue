<script setup lang="ts">
// Logo « L'Encre Humaine » DANS SES COULEURS — corps crème + trait bleu #015294,
// tel que le fichier fourni par Éléonore (assets/logo/logo.png, 774×674).
//
// Reconstitué en SVG (pas de PNG de 269 Ko) à partir des deux tracés qu'on a déjà,
// qui viennent du même dessin et partagent le viewBox :
//   - OctopusMark = le contour extérieur → sert de corps plein (le « blanc » du PNG) ;
//   - OctopusLogo = l'illustration détaillée (ventouses, hachures) → posée par-dessus
//     dans le bleu du logo.
// Le résultat est vectoriel, net à toute taille, et suit le thème (corps `text-paper`
// par défaut, surchargeable via la classe passée au corps).
//
// À utiliser quand on veut le logo *tel quel* ; pour un aplat monochrome qui prend la
// couleur du contexte, garder OctopusMark (petit) ou OctopusLogo (grand).
withDefaults(defineProps<{ title?: string; bodyClass?: string }>(), {
  title: "",
  bodyClass: "text-paper",
});
</script>

<template>
  <svg
    viewBox="0 0 774 674"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : true"
    :aria-label="title || undefined"
  >
    <title v-if="title">{{ title }}</title>
    <!-- Les deux <svg> imbriqués héritent du viewport parent (100 % × 100 %) et
         partagent le même viewBox : les tracés se superposent au pixel près. -->
    <OctopusMark :class="bodyClass" />
    <OctopusLogo class="text-logo" />
  </svg>
</template>
