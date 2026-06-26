<script setup lang="ts">
// En-tête de page réutilisable (pages intérieures) — docs/00-global.md §Layout.
// Hero clair mais affirmé : eyebrow + grand titre Fraunces + taches d'encre.
// `variant` aligne l'accent sur le public : teal (orga) / orange (particuliers) / neutre.
// Le hero sombre de l'accueil reste la pièce maîtresse — ici on garde de la légèreté.
withDefaults(
  defineProps<{
    title: string;
    eyebrow?: string;
    body?: string;
    variant?: "teal" | "orange" | "neutral";
  }>(),
  { variant: "neutral" },
);

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
const accent: Record<string, string> = {
  teal: "text-teal-700",
  orange: "text-orange-600",
  neutral: "text-brand-accent",
};
const dash: Record<string, string> = {
  teal: "bg-teal-400",
  orange: "bg-orange-300",
  neutral: "bg-orange-300",
};
// Filigrane tentacule (ADN encre), teinté selon le public — très discret.
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
      class="absolute -bottom-8 -right-10 -z-10 hidden w-[32rem] lg:block"
      :class="tentacle[variant]"
    />

    <div class="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
      <slot name="top" />
      <p
        v-if="eyebrow"
        class="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em]"
        :class="accent[variant]"
      >
        <span aria-hidden="true" class="h-px w-6" :class="dash[variant]"></span>
        {{ eyebrow }}
      </p>
      <h1 class="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">{{ title }}</h1>
      <p
        v-if="body"
        class="mx-auto mt-5 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-ink/70"
      >
        {{ body }}
      </p>
      <slot />
    </div>
  </section>
</template>
