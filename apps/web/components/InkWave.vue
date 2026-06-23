<script setup lang="ts">
// Séparateur « vague d'encre » entre deux sections. Décoratif (aria-hidden).
// Prend la couleur via currentColor : le parent fixe `text-<couleur>` = la couleur
// de la section vers laquelle l'encre « coule ». `flip` retourne la vague.
withDefaults(defineProps<{ flip?: boolean; height?: string }>(), {
  flip: false,
  height: "h-12 sm:h-16",
});
</script>

<template>
  <div aria-hidden="true" class="w-full overflow-hidden leading-[0]" :class="height">
    <svg
      class="h-full w-full"
      :class="flip ? 'rotate-180' : ''"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      fill="currentColor"
    >
      <path
        d="M0 46C160 86 320 96 540 70C760 44 920 8 1140 14C1280 18 1380 34 1440 46L1440 100L0 100Z"
      />
    </svg>
  </div>
</template>
