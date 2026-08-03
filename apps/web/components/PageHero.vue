<script setup lang="ts">
// En-tête de page réutilisable (pages intérieures) — docs/00-global.md §Layout.
// Hero **éditorial** aligné à gauche, calqué sur la maquette : eyebrow + grand titre
// Fraunces (mot d'accent doré possible via `accent`) + chapô + CTA (slot défaut), et
// une **colonne de contenu à droite** (slot `aside` : carte constat, citation…) qui
// remplit le hero façon maquette. Sans `aside` → une seule colonne. Le hero sombre
// de l'accueil reste la pièce maîtresse. `variant` aligne l'accent sur le public.
withDefaults(
  defineProps<{
    title: string;
    /** Fragment du titre mis en doré (ex. « vraiment. ») — rendu après `title`. */
    accent?: string;
    eyebrow?: string;
    body?: string;
    variant?: "teal" | "orange" | "neutral";
    /** Côté du tentacule décoratif : à gauche quand la carte `aside` le rognerait. */
    tentacleSide?: "left" | "right";
  }>(),
  { variant: "neutral", tentacleSide: "right" },
);
const slots = useSlots();

const tint: Record<string, string> = {
  teal: "bg-teal-50",
  orange: "bg-orange-50",
  neutral: "bg-paper-2",
};
const blob: Record<string, string> = {
  teal: "text-teal-500/10",
  orange: "text-orange-400/12",
  neutral: "text-teal-500/8",
};
const accentColor: Record<string, string> = {
  teal: "text-orange-600",
  orange: "text-orange-600",
  neutral: "text-brand-accent",
};
const dash: Record<string, string> = {
  teal: "bg-orange-300",
  orange: "bg-orange-300",
  neutral: "bg-orange-300",
};
const tentacle: Record<string, string> = {
  teal: "text-teal-600/[0.07]",
  orange: "text-orange-500/[0.08]",
  neutral: "text-teal-700/[0.06]",
};
</script>

<template>
  <section class="relative isolate overflow-hidden" :class="tint[variant]">
    <InkBlob class="absolute -right-20 -top-24 -z-10 h-80 w-80 rotate-12" :class="blob[variant]" />
    <InkBlob class="absolute -left-24 -bottom-16 -z-10 h-64 w-64 -rotate-45" :class="blob[variant]" />
    <TentacleAccent
      name="tentacule-3-trait"
      class="absolute -bottom-8 -z-10 hidden w-[32rem] lg:block"
      :class="[
        tentacle[variant],
        // Le dessin a sa base COUPÉE à gauche et sa pointe à droite : posé à
        // droite, il faut le retourner pour que la coupe sorte du cadre (sinon
        // elle « flotte » au milieu de la page).
        tentacleSide === 'left' ? '-left-10' : '-right-10 -scale-x-100',
      ]"
    />

    <div class="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div class="grid items-center gap-10 lg:gap-14" :class="slots.aside ? 'lg:grid-cols-[1.05fr_0.95fr]' : ''">
        <div>
          <slot name="top" />
          <p
            v-if="eyebrow"
            class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]"
            :class="accentColor[variant]"
          >
            <span aria-hidden="true" class="h-px w-6" :class="dash[variant]"></span>
            {{ eyebrow }}
          </p>
          <h1 class="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
            {{ title }}<template v-if="accent"> <span :class="accentColor[variant]">{{ accent }}</span></template>
          </h1>
          <p
            v-if="body"
            class="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-ink/70"
          >
            {{ body }}
          </p>
          <slot />
        </div>

        <div v-if="slots.aside">
          <slot name="aside" />
        </div>
      </div>

      <!-- Bandeau pleine largeur SOUS les deux colonnes (phrase signature + CTA
           des hubs) : Éléonore veut ce bloc intégré au hero, pas en section à part. -->
      <div v-if="slots.below" class="mt-12">
        <slot name="below" />
      </div>
    </div>
  </section>
</template>
