<script setup lang="ts">
// Encart « Pas sûr d'avoir besoin de ça ? » en bas des pages d'offre, juste avant
// le CTA de contact (mail d'Éléonore du 2026-10-26) : c'est là qu'un visiteur se
// demande si l'offre le concerne. Bouton en contour doré : le « Réserver » plein
// qui suit reste l'appel le plus marqué.
import type { DiagnosticPromo } from "~/types/content";

defineProps<{ promo: DiagnosticPromo }>();
const track = useTrack();
</script>

<template>
  <aside
    class="flex flex-col gap-6 rounded-3xl border border-sand-400/40 bg-orange-50 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9"
  >
    <div class="flex gap-4">
      <Icon name="material-symbols:schedule" class="mt-1 h-7 w-7 flex-none text-orange-600" />
      <div>
        <p class="font-display text-xl font-bold text-ink sm:text-2xl">
          <AccentText :text="promo.title" />
        </p>
        <p class="mt-1.5 leading-relaxed text-ink/70">
          <AccentText :text="promo.body" />
        </p>
      </div>
    </div>
    <NuxtLink
      :to="promo.path"
      class="inline-flex min-h-11 flex-none items-center gap-2 self-start rounded-full border-2 border-orange-400 bg-paper px-6 py-2.5 font-semibold text-ink transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:self-center"
      @click="track('diagnostic_link_click', { from: 'offer', path: promo.path })"
    >
      {{ promo.label }}
      <span aria-hidden="true">→</span>
    </NuxtLink>
  </aside>
</template>
