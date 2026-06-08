<script setup lang="ts">
// Nav principale — docs/00-global.md §Layout. Menu mobile accessible = item BACKLOG.
const nav = [
  { label: "Accueil", to: "/" },
  { label: "À propos", to: "/a-propos" },
  { label: "Pour les organisations", to: "/organisations" },
  { label: "Pour les particuliers", to: "/particuliers" },
  { label: "Ressources", to: "/ressources" },
  { label: "Travaillons ensemble", to: "/contact" },
];
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-teal-100 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <NuxtLink to="/" class="font-display text-lg font-semibold text-teal-700">
        🐙 L'Encre Humaine
      </NuxtLink>

      <nav aria-label="Navigation principale" class="hidden md:block">
        <ul class="flex items-center gap-5 text-sm">
          <li v-for="item in nav" :key="item.to">
            <NuxtLink :to="item.to" class="hover:text-teal-600">{{ item.label }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <NuxtLink
        to="/contact"
        class="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Prendre RDV
      </NuxtLink>
    </div>
  </header>
</template>
