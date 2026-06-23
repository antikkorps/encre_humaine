<script setup lang="ts">
// Sommaire / navigation rapide — partagé article (docs/07) & pages légales (docs/10).
// Deux rendus selon `mobile` :
//  - mobile=false → <nav> destiné à une colonne aside (le parent ajoute `sticky`) :
//    accessible même en bas de page. Ergonomie > carte figée en haut.
//  - mobile=true  → **bouton flottant bas-droite** (FAB) ouvrant un popover des
//    sections (Reka Popover : focus trap / Escape / clic-extérieur natifs). On tape
//    la section voulue → scroll + fermeture. Joignable quel que soit le scroll.
interface TocEntry {
  id: string;
  text: string;
}

withDefaults(
  defineProps<{
    items: TocEntry[];
    readingTime?: number | null;
    mobile?: boolean;
  }>(),
  { readingTime: null, mobile: false },
);

// Le FAB mobile est en bas à droite ; tant que le bandeau de consentement (bas,
// z-50) est affiché, on remonte le bouton pour ne pas le masquer. Il redescend
// une fois le choix fait.
const { decided } = useConsent();
</script>

<template>
  <PopoverRoot v-if="mobile">
    <PopoverTrigger
      class="fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lift transition-all hover:scale-105 focus-visible:scale-105 lg:hidden"
      :class="decided ? 'bottom-6' : 'bottom-32'"
      aria-label="Naviguer dans l'article"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        side="top"
        align="end"
        :side-offset="12"
        :collision-padding="16"
        class="toc-pop z-50 max-h-[60vh] w-64 overflow-y-auto rounded-2xl border border-ink/10 bg-paper p-2 shadow-lift"
      >
        <p class="px-3 pb-1 pt-2 font-display text-sm font-semibold text-ink">
          Sur cette page
          <span v-if="readingTime" class="font-normal text-ink/45">· {{ readingTime }} min</span>
        </p>
        <ul class="text-sm">
          <li v-for="entry in items" :key="entry.id">
            <PopoverClose as-child>
              <a
                :href="`#${entry.id}`"
                class="block rounded-lg px-3 py-2 leading-snug text-ink/70 transition-colors hover:bg-teal-50 hover:text-teal-700"
              >
                {{ entry.text }}
              </a>
            </PopoverClose>
          </li>
        </ul>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>

  <nav v-else class="border-l border-ink/10 pl-5 text-sm" aria-label="Sur cette page">
    <p class="font-display font-semibold text-ink">Sur cette page</p>
    <p v-if="readingTime" class="mt-1 text-xs text-ink/45">{{ readingTime }} min de lecture</p>
    <ul class="mt-4 space-y-2.5">
      <li v-for="entry in items" :key="entry.id">
        <a
          :href="`#${entry.id}`"
          class="block leading-snug text-ink/60 transition-colors hover:text-teal-700"
        >
          {{ entry.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
/* Apparition douce du popover (désactivée si prefers-reduced-motion). */
.toc-pop[data-state="open"] {
  animation: toc-in 0.16s ease-out;
}
@keyframes toc-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
}
@media (prefers-reduced-motion: reduce) {
  .toc-pop[data-state] {
    animation: none;
  }
}
</style>
