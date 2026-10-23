<script setup lang="ts">
// « Pour aller plus loin » — contenus liés à une page (maillage interne, audit SEO
// du 2026-10-22). Les liens viennent d'un répéteur Directus (titre, phrase, URL) :
// un article aujourd'hui, un carnet ou un guide du Laboratoire demain, sans
// retoucher le code. Un chemin du site navigue côté client, le reste s'ouvre à part.
import type { FurtherSection } from "~/types/content";

defineProps<{ section: FurtherSection }>();

const isExternal = (url: string) => /^(https?:|mailto:)/.test(url);
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-20">
    <SectionHeading
      :title="section.title"
      :subtitle="section.intro ?? undefined"
      eyebrow="Ressources"
    />
    <ul class="mt-10 grid gap-6 md:grid-cols-2">
      <li v-for="(link, i) in section.links" :key="i">
        <NuxtLink
          :to="link.url"
          :target="isExternal(link.url) ? '_blank' : undefined"
          :rel="isExternal(link.url) ? 'noopener' : undefined"
          class="group flex h-full flex-col rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          <span class="font-display text-lg font-bold text-ink group-hover:text-teal-700">
            <AccentText :text="link.title" />
          </span>
          <span v-if="link.body" class="mt-2 flex-1 leading-relaxed text-ink/65">
            <AccentText :text="link.body" />
          </span>
          <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600">
            Lire
            <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
