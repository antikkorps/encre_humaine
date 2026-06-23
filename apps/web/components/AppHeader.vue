<script setup lang="ts">
// Nav principale — docs/00-global.md §Layout. Partagée avec le menu mobile (NavMobile).
// Le lien « Boutique » n'apparaît que si la boutique est activée (shop_page,
// piloté par Eléonore) — sinon la boutique reste masquée de la navigation.
import type { NavItem } from "~/types/content";

const { data: shop } = await useShopPage();

// Nav desktop : sections principales, libellés courts (1 ligne, cohérents). Pas
// d'« Accueil » (le logo y mène) ni de « Contact » (le bouton « Prendre RDV » le couvre).
const nav = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { label: "À propos", to: "/a-propos" },
    { label: "Organisations", to: "/organisations" },
    { label: "Particuliers", to: "/particuliers" },
    { label: "Ressources", to: "/ressources" },
  ];
  if (shop.value?.enabled) items.push({ label: "Boutique", to: "/boutique" });
  return items;
});

// Menu mobile : on préfixe « Accueil » (pas de logo cliquable dans le panneau) ;
// le CTA « Prendre RDV » en bas du panneau couvre le contact.
const mobileNav = computed<NavItem[]>(() => [{ label: "Accueil", to: "/" }, ...nav.value]);
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <NuxtLink
        to="/"
        class="group flex items-center gap-2.5 text-ink"
        aria-label="L'Encre Humaine — accueil"
      >
        <OctopusMark class="h-8 w-8 text-teal-700 transition-transform group-hover:-rotate-6" />
        <span class="font-display text-lg font-semibold leading-none tracking-tight">
          L'Encre <span class="text-teal-700">Humaine</span>
        </span>
      </NuxtLink>

      <nav aria-label="Navigation principale" class="hidden lg:block">
        <ul class="flex items-center gap-7 text-sm font-medium text-ink/75">
          <li>
            <NuxtLink
              to="/"
              class="flex items-center text-ink/70 transition-colors hover:text-teal-700 aria-[current=page]:text-teal-700"
              aria-label="Accueil"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 11.5 12 4l9 7.5M5.5 10v9.5a1 1 0 0 0 1 1H10v-5.5h4V20.5h3.5a1 1 0 0 0 1-1V10"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </NuxtLink>
          </li>
          <li v-for="item in nav" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="whitespace-nowrap transition-colors hover:text-teal-700 aria-[current=page]:text-teal-700 aria-[current=page]:font-semibold"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/contact"
          class="hidden whitespace-nowrap rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-orange-600 sm:inline-flex"
        >
          Prendre RDV
        </NuxtLink>
        <NavMobile :items="mobileNav" />
      </div>
    </div>
  </header>
</template>
