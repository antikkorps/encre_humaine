<script setup lang="ts">
// Bloc d'appel à l'action — docs/00-global.md (CTA final de page).
//
// Mise en page validée par Éléonore sur la maquette du Laboratoire, et retenue
// pour TOUTES les pages : panneau marine, grand poulpe doré translucide à
// GAUCHE, discours + bouton au centre, tentacules à DROITE. Le slot par défaut
// permet de remplacer le bouton par autre chose (ex. le formulaire newsletter).
const props = withDefaults(
  defineProps<{
    title: string;
    /** Optionnel : sans lien, on attend un contenu dans le slot par défaut. */
    ctaLabel?: string;
    to?: string;
    description?: string;
    /** Surtitre doré au-dessus du titre (ex. « 🐙 Les Tentacules »). */
    eyebrow?: string;
    /** Réassurance sous le bouton (ex. « 30 minutes, sans engagement »). */
    subtext?: string;
    variant?: "teal" | "orange";
    /**
     * `center` (défaut) : discours empilé au centre — CTA final de page.
     * `split` : bandeau deux colonnes, discours à gauche (poulpe doré à sa
     * gauche) et slot à droite. Conçu pour le formulaire newsletter, qui
     * doublait la hauteur du bloc en s'empilant sous le texte (maquette
     * Éléonore, 2026-08-06).
     */
    layout?: "center" | "split";
  }>(),
  { variant: "orange", layout: "center" },
);

const split = computed(() => props.layout === "split");

const button = computed(() =>
  props.variant === "orange"
    ? "bg-orange-400 text-ink hover:bg-sand-500"
    : "bg-paper text-ink hover:bg-white",
);
</script>

<template>
  <section
    class="bg-ink-gradient relative isolate overflow-hidden rounded-3xl px-6 shadow-lift sm:px-12"
    :class="split ? 'py-10 sm:py-12' : 'py-14 sm:py-16'"
  >
    <!-- Décor : poulpe doré à gauche, tentacules à droite (maquette Éléonore). -->
    <!-- Poulpe doré translucide, centré verticalement pour tenir aussi bien dans
         un petit panneau (CTA de page) que dans un grand (formulaire).
         En `split`, le poulpe est un élément de la colonne de gauche (net, pas
         en filigrane) : ce décor de fond ferait doublon. -->
    <OctopusLogo
      v-if="!split"
      aria-hidden="true"
      class="pointer-events-none absolute left-2 top-1/2 -z-10 hidden h-40 w-auto -translate-y-1/2 text-sand-400/25 xl:block"
    />
    <TentacleAccent
      side="right"
      name="tentacule-2-trait"
      class="absolute -right-24 -top-10 -z-10 hidden w-[30rem] text-sand-300/[0.18] lg:block"
    />
    <TentacleAccent
      side="right"
      name="tentacule-5-trait"
      class="absolute -bottom-16 -right-16 -z-10 hidden w-[26rem] text-sand-300/[0.12] lg:block"
    />
    <InkBlob class="absolute -right-12 -top-16 -z-10 h-56 w-56 text-teal-500/20" />

    <!-- Bandeau deux colonnes : poulpe + discours à gauche, slot à droite.
         Le titre porte le message, le surtitre passe SOUS lui en signature
         (« Les Tentacules de L'Encre Humaine ») comme sur la maquette. -->
    <div v-if="split" class="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
      <div class="flex items-center gap-6">
        <OctopusLogo
          aria-hidden="true"
          class="hidden h-28 w-auto flex-none text-sand-400 sm:block"
        />
        <div class="text-left">
          <h2 class="font-display text-2xl font-bold text-paper sm:text-3xl">
            <AccentText :text="title" tone="dark" />
          </h2>
          <p v-if="eyebrow" class="mt-1 font-display text-lg text-paper/85 sm:text-xl">
            {{ eyebrow }}
          </p>
          <span aria-hidden="true" class="mt-4 block h-0.5 w-16 rounded-full bg-sand-400" />
          <p v-if="description" class="mt-4 text-left text-sm leading-relaxed text-paper/70">
            <AccentText :text="description" tone="dark" />
          </p>
        </div>
      </div>
      <div>
        <slot />
        <p v-if="subtext" class="mt-4 whitespace-pre-line text-left text-sm text-paper/60">
          <AccentText :text="subtext" tone="dark" />
        </p>
      </div>
    </div>

    <!-- Colonne de discours centrée, mais dégagée du poulpe sur grand écran. -->
    <div v-else class="relative mx-auto max-w-3xl text-center lg:pl-16">
      <p
        v-if="eyebrow"
        class="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-sand-300"
      >
        {{ eyebrow }}
      </p>
      <h2 class="font-display text-3xl font-bold text-paper sm:text-4xl">
        <AccentText :text="title" tone="dark" />
      </h2>
      <p v-if="description" class="mx-auto mt-4 max-w-2xl text-center text-paper/75">
        <AccentText :text="description" tone="dark" />
      </p>
      <NuxtLink
        v-if="ctaLabel && to"
        :to="to"
        class="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold shadow-soft transition-colors"
        :class="button"
      >
        {{ ctaLabel }}
        <span aria-hidden="true">→</span>
      </NuxtLink>
      <!-- Contenu libre (ex. formulaire d'inscription) à la place du bouton. -->
      <div v-if="$slots.default" class="mt-8">
        <slot />
      </div>
      <p v-if="subtext" class="mt-5 whitespace-pre-line text-center text-sm text-paper/60">
        <AccentText :text="subtext" tone="dark" />
      </p>
    </div>
  </section>
</template>
