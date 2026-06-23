<script setup lang="ts">
// Logo poulpe — marque de « L'Encre Humaine ». SVG mono-trait, prend la couleur
// du texte parent (currentColor) → réutilisable sur fond clair ou encre.
// Les yeux sont des découpes (fill-rule evenodd) → lisibles sur n'importe quel fond.
withDefaults(defineProps<{ title?: string }>(), { title: "" });
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    fill="none"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : true"
    :aria-label="title || undefined"
  >
    <title v-if="title">{{ title }}</title>
    <!-- Tête / manteau + yeux découpés (fill-rule evenodd → trous lisibles sur tout fond) -->
    <path
      fill="currentColor"
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M10.5 22.5C10.5 13.4 16.5 6.5 24 6.5C31.5 6.5 37.5 13.4 37.5 22.5V26C37.5 27.4 36.4 28.5 35 28.5H13C11.6 28.5 10.5 27.4 10.5 26V22.5ZM19.5 18.8C18.3 18.8 17.3 19.8 17.3 21C17.3 22.2 18.3 23.2 19.5 23.2C20.7 23.2 21.7 22.2 21.7 21C21.7 19.8 20.7 18.8 19.5 18.8ZM28.5 18.8C27.3 18.8 26.3 19.8 26.3 21C26.3 22.2 27.3 23.2 28.5 23.2C29.7 23.2 30.7 22.2 30.7 21C30.7 19.8 29.7 18.8 28.5 18.8Z"
    />
    <!-- Tentacules (les externes s'enroulent) -->
    <g stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <path d="M13.5 28.5C11.5 32 11.5 36 14.5 37.5C16.2 38.3 17 37 16 36" />
      <path d="M18.5 29C17.5 33 17 37 19.5 39.5" />
      <path d="M24 29C24 33 24 37 24 40.5" />
      <path d="M29.5 29C30.5 33 31 37 28.5 39.5" />
      <path d="M34.5 28.5C36.5 32 36.5 36 33.5 37.5C31.8 38.3 31 37 32 36" />
    </g>
  </svg>
</template>
