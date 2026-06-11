<script setup lang="ts">
// Menu mobile accessible — docs/00-global.md §Layout.
// Reka Dialog : focus trap, fermeture Escape, clic overlay, ARIA — natifs.
import type { NavItem } from "~/types/content";

defineProps<{ items: NavItem[] }>();

const open = ref(false);
const route = useRoute();
// Ferme le panneau après navigation.
watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger
      class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50 md:hidden"
      aria-label="Ouvrir le menu"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-teal-900/40 backdrop-blur-sm" />
      <DialogContent
        class="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col bg-white p-6 shadow-xl focus:outline-none"
      >
        <DialogTitle class="font-display text-lg font-semibold text-teal-800">
          Menu
        </DialogTitle>
        <DialogDescription class="sr-only">
          Navigation principale du site
        </DialogDescription>

        <DialogClose
          class="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50"
          aria-label="Fermer le menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </DialogClose>

        <nav aria-label="Navigation principale" class="mt-8">
          <ul class="space-y-1">
            <li v-for="item in items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="block rounded-lg px-3 py-2 text-teal-800 hover:bg-teal-50 aria-[current=page]:bg-teal-50 aria-[current=page]:font-medium"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <NuxtLink
          to="/contact"
          class="mt-auto rounded-full bg-orange-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700"
        >
          Prendre RDV
        </NuxtLink>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
