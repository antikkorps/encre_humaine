<script setup lang="ts">
// Signature de l'autrice (E-E-A-T, audit SEO 2026-10-22) : un visage, un nom, une
// fonction et le lien LinkedIn, pour que lecteurs, Google et IA sachent qui parle.
// `compact` = ligne discrète sous les CTA du héros sombre de l'accueil ;
// `card` = encadré clair « Écrit par » en fin de ressource.
// Logo LinkedIn en SVG inline : seules les Material Symbols sont embarquées.
import type { AuthorInfo } from "~/types/content";

withDefaults(defineProps<{ author: AuthorInfo; variant?: "compact" | "card" }>(), {
  variant: "compact",
});
</script>

<template>
  <div
    v-if="variant === 'compact'"
    class="flex items-center gap-3 text-sm text-paper/80"
  >
    <NuxtImg
      v-if="author.photo"
      :src="author.photo.url"
      :alt="author.photo.alt"
      width="44"
      height="44"
      fit="cover"
      format="webp"
      class="h-11 w-11 flex-none rounded-full object-cover ring-2 ring-sand-400/60"
    />
    <p class="leading-snug">
      <span class="font-semibold text-paper">{{ author.name }}</span>
      <template v-if="author.title"><br />{{ author.title }}</template>
    </p>
    <a
      v-if="author.linkedinUrl"
      :href="author.linkedinUrl"
      target="_blank"
      rel="noopener me"
      class="ml-1 inline-flex items-center gap-1.5 rounded-full border border-paper/20 px-3 py-1.5 font-semibold text-paper/90 transition-colors hover:border-sand-300 hover:text-sand-300"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.83v1.54h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.97c0-1.19-.02-2.71-1.65-2.71-1.65 0-1.9 1.29-1.9 2.62V21h-4V9.75Z" />
      </svg>
      LinkedIn
    </a>
  </div>

  <aside
    v-else
    class="flex flex-col gap-5 rounded-3xl border border-ink/5 bg-white p-7 shadow-soft sm:flex-row sm:items-center"
    aria-label="À propos de l'autrice"
  >
    <NuxtImg
      v-if="author.photo"
      :src="author.photo.url"
      :alt="author.photo.alt"
      width="88"
      height="88"
      fit="cover"
      format="webp"
      class="h-20 w-20 flex-none rounded-full object-cover ring-2 ring-orange-300"
    />
    <div>
      <p class="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Écrit par</p>
      <p class="mt-1 font-display text-xl font-bold text-ink">{{ author.name }}</p>
      <p v-if="author.title" class="text-ink/70">{{ author.title }}</p>
      <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <NuxtLink to="/a-propos" class="text-teal-700 hover:underline">Mon parcours</NuxtLink>
        <a
          v-if="author.linkedinUrl"
          :href="author.linkedinUrl"
          target="_blank"
          rel="noopener me"
          class="inline-flex items-center gap-1.5 text-teal-700 hover:underline"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.83v1.54h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.13V21h-4v-4.97c0-1.19-.02-2.71-1.65-2.71-1.65 0-1.9 1.29-1.9 2.62V21h-4V9.75Z" />
          </svg>
          LinkedIn
        </a>
      </div>
    </div>
  </aside>
</template>
