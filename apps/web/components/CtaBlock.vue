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
  }>(),
  { variant: "orange" },
);

const button = computed(() =>
  props.variant === "orange"
    ? "bg-orange-400 text-ink hover:bg-sand-500"
    : "bg-paper text-ink hover:bg-white",
);
</script>

<template>
  <section
    class="bg-ink-gradient relative isolate overflow-hidden rounded-3xl px-6 py-14 shadow-lift sm:px-12 sm:py-16"
  >
    <!-- Décor : poulpe doré à gauche, tentacules à droite (maquette Éléonore). -->
    <!-- Poulpe doré translucide, centré verticalement pour tenir aussi bien dans
         un petit panneau (CTA de page) que dans un grand (formulaire). -->
    <OctopusLogo
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

    <!-- Colonne de discours centrée, mais dégagée du poulpe sur grand écran. -->
    <div class="relative mx-auto max-w-3xl text-center lg:pl-16">
      <p
        v-if="eyebrow"
        class="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-sand-300"
      >
        {{ eyebrow }}
      </p>
      <h2 class="font-display text-3xl font-bold text-paper sm:text-4xl">
        {{ title }}
      </h2>
      <p v-if="description" class="mx-auto mt-4 max-w-2xl text-center text-paper/75">
        {{ description }}
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
      <!-- `text-center` : la justification globale des paragraphes de `main`
           l'emporterait sur l'alignement hérité du panneau. -->
      <p v-if="subtext" class="mt-5 text-center text-sm text-paper/60">{{ subtext }}</p>
    </div>
  </section>
</template>
