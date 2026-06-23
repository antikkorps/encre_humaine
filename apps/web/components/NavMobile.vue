<script setup lang="ts">
// Menu mobile accessible — docs/00-global.md §Layout.
// Reka Dialog : focus trap, fermeture Escape, clic overlay, ARIA — natifs.
// Plein viewport (h-dvh) + animations douces entrée/sortie (data-state),
// désactivées si prefers-reduced-motion (a11y).
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
      class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50 lg:hidden"
      aria-label="Ouvrir le menu"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="nav-overlay fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm" />
      <DialogContent
        class="nav-panel fixed inset-0 z-50 flex h-dvh w-screen flex-col bg-paper px-6 pb-10 pt-4 focus:outline-none"
      >
        <div class="flex items-center justify-between">
          <DialogTitle class="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <OctopusMark class="h-7 w-7 text-teal-700" />
            L'Encre Humaine
          </DialogTitle>
          <DialogDescription class="sr-only">
            Navigation principale du site
          </DialogDescription>
          <DialogClose
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50"
            aria-label="Fermer le menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </DialogClose>
        </div>

        <nav aria-label="Navigation principale" class="mt-10 flex-1">
          <ul class="space-y-1">
            <li v-for="item in items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="block rounded-xl px-3 py-3 font-display text-2xl text-ink transition-colors hover:bg-teal-50 aria-[current=page]:bg-teal-50 aria-[current=page]:font-semibold aria-[current=page]:text-teal-700"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <NuxtLink
          to="/contact"
          class="mt-auto rounded-full bg-orange-500 px-4 py-3.5 text-center font-semibold text-white shadow-soft hover:bg-orange-600"
        >
          Prendre RDV
        </NuxtLink>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
@keyframes nav-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes nav-overlay-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes nav-panel-in {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes nav-panel-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(10px) scale(0.98); }
}

.nav-overlay[data-state="open"] {
  animation: nav-overlay-in 0.25s ease-out;
}
.nav-overlay[data-state="closed"] {
  animation: nav-overlay-out 0.2s ease-in;
}
.nav-panel[data-state="open"] {
  animation: nav-panel-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-panel[data-state="closed"] {
  animation: nav-panel-out 0.2s ease-in;
}

@media (prefers-reduced-motion: reduce) {
  .nav-overlay[data-state],
  .nav-panel[data-state] {
    animation: none;
  }
}
</style>
