<script setup lang="ts">
// Second bouton du hub, à côté de « Prendre rendez-vous » (mail d'Éléonore du
// 2026-10-26) : le rendez-vous reste l'appel principal pour ceux qui sont prêts,
// le diagnostic s'adresse aux autres — d'où le contour, sur le bandeau marine.
// Repris dans le haut des pages d'offre (retour du 2026-10-27) : `from` distingue
// les deux emplacements dans Umami.
import type { DiagnosticPromo } from "~/types/content";

withDefaults(defineProps<{ promo: DiagnosticPromo; from?: "hub" | "offer-hero" }>(), {
  from: "hub",
});
const track = useTrack();
</script>

<template>
  <NuxtLink
    :to="promo.path"
    class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-orange-300 px-7 py-3 font-semibold text-paper transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
    @click="track('diagnostic_link_click', { from, path: promo.path })"
  >
    {{ promo.hubLabel }}
    <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
  </NuxtLink>
</template>
