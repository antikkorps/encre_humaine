<script setup lang="ts">
// Cas concret — « Preuve par l'exemple » (accueil, run 15). Réponse au reproche
// central de l'audit : le site n'exposait aucun « j'ai fait ça, comme ça, et voilà
// ce que ça a donné ». La carte impose donc les trois temps du récit — la
// situation, ce qui a été mis en place, le résultat — dans cet ordre, et le
// résultat est le seul mis en avant visuellement : c'est lui la preuve.
//
// `full` = cas unique, présenté en pleine largeur (deux colonnes) ; sinon carte de
// carrousel, en colonne.
import type { CaseStudyItem } from "~/types/content";

const props = withDefaults(defineProps<{ caseStudy: CaseStudyItem; full?: boolean }>(), {
  full: false,
});

const STEPS = [
  { key: "situation", label: "La situation", icon: "material-symbols:insights" },
  { key: "actions", label: "Ce qui a été mis en place", icon: "material-symbols:checklist" },
] as const;

/** Étapes réellement renseignées (une entrée vide ne laisse pas d'intertitre orphelin). */
const steps = computed(() =>
  STEPS.map((s) => ({ ...s, body: props.caseStudy[s.key] })).filter((s) => s.body),
);
</script>

<template>
  <article
    class="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft"
    :class="full && caseStudy.image ? 'lg:grid lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch' : ''"
  >
    <div class="flex flex-1 flex-col p-7 sm:p-9">
      <p
        v-if="caseStudy.sector || caseStudy.periodLabel"
        class="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600"
      >
        <span v-if="caseStudy.sector">{{ caseStudy.sector }}</span>
        <span v-if="caseStudy.sector && caseStudy.periodLabel" aria-hidden="true">•</span>
        <span v-if="caseStudy.periodLabel">{{ caseStudy.periodLabel }}</span>
      </p>
      <h3 class="mt-3 font-display text-2xl font-bold text-ink">
        <AccentText :text="caseStudy.title" />
      </h3>
      <p v-if="caseStudy.summary" class="mt-2 leading-relaxed text-ink/60">
        <AccentText :text="caseStudy.summary" />
      </p>

      <dl class="mt-7 space-y-5">
        <div v-for="step in steps" :key="step.key">
          <dt
            class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-teal-800"
          >
            <Icon :name="step.icon" class="h-4 w-4" />
            {{ step.label }}
          </dt>
          <dd class="mt-1.5 whitespace-pre-line leading-relaxed text-ink/70">
            <AccentText :text="step.body" />
          </dd>
        </div>
      </dl>

      <!-- Le résultat : encadré doré, seul élément mis en avant de la carte. -->
      <div
        v-if="caseStudy.result"
        class="mt-7 rounded-2xl border border-sand-400/40 bg-orange-50 p-5"
      >
        <p
          class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-orange-600"
        >
          <Icon name="material-symbols:trending-up" class="h-4 w-4" />
          Le résultat
        </p>
        <p class="mt-1.5 whitespace-pre-line font-display text-lg leading-relaxed text-ink">
          <AccentText :text="caseStudy.result" />
        </p>
      </div>
    </div>

    <div v-if="caseStudy.image" :class="full ? '' : 'order-first'">
      <NuxtImg
        :src="caseStudy.image"
        :alt="caseStudy.imageAlt ?? ''"
        width="640"
        height="800"
        fit="cover"
        format="webp"
        sizes="100vw lg:420px"
        loading="lazy"
        decoding="async"
        class="h-56 w-full object-cover lg:h-full"
      />
    </div>
  </article>
</template>
