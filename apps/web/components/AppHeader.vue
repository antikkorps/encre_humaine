<script setup lang="ts">
// Nav principale — docs/00-global.md §Layout. Partagée avec le menu mobile (NavMobile).
// Le lien « Boutique » n'apparaît que si la boutique est activée (shop_page,
// piloté par Eléonore) — sinon la boutique reste masquée de la navigation.
import type { NavItem } from "~/types/content";

const { data: shop } = await useShopPage();

const nav = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { label: "Accueil", to: "/" },
    { label: "À propos", to: "/a-propos" },
    { label: "Pour les organisations", to: "/organisations" },
    { label: "Pour les particuliers", to: "/particuliers" },
    { label: "Ressources", to: "/ressources" },
  ];
  if (shop.value?.enabled) items.push({ label: "Boutique", to: "/boutique" });
  items.push({ label: "Travaillons ensemble", to: "/contact" });
  return items;
});
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

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/contact"
          class="hidden rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 sm:inline-flex"
        >
          Prendre RDV
        </NuxtLink>
        <NavMobile :items="nav" />
      </div>
    </div>
  </header>
</template>
