<script setup lang="ts">
// Prise de RDV en modale — docs/09-contact.md.
// L'embed inline (BookingEmbed) se tassait dans une colonne étroite ; on lui
// donne toute la largeur dans une Dialog Reka (focus trap / Escape / ARIA natifs).
// Centrage par FLEX (pas de transform de position → pas de saut à l'ouverture) ;
// animation opacité seule → le panneau a sa taille définitive dès le 1er frame,
// donc Cal.com mesure correctement son conteneur (sinon calendrier vide).
// Le consentement tiers reste géré par BookingEmbed à l'intérieur.
defineProps<{ url: string }>();
const open = ref(false);
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger
      class="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      Voir les disponibilités
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="booking-overlay fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm" />
      <DialogContent
        class="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
        @pointerdown.self="open = false"
      >
        <div
          class="booking-panel flex max-h-[92dvh] w-[min(96vw,960px)] flex-col overflow-hidden rounded-3xl bg-paper shadow-soft"
        >
          <div class="flex items-center justify-between border-b border-ink/5 px-6 py-4">
            <DialogTitle class="font-display text-lg font-semibold text-ink">
              Réserver un appel découverte
            </DialogTitle>
            <DialogDescription class="sr-only">
              Calendrier de prise de rendez-vous
            </DialogDescription>
            <DialogClose
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-teal-700 hover:bg-teal-50"
              aria-label="Fermer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </DialogClose>
          </div>

          <div class="flex-1 overflow-auto p-4 sm:p-6">
            <BookingEmbed :url="url" />
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
@keyframes booking-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.booking-overlay[data-state="open"] {
  animation: booking-fade-in 0.2s ease-out;
}
.booking-panel {
  animation: booking-fade-in 0.2s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .booking-overlay[data-state],
  .booking-panel {
    animation: none;
  }
}
</style>
