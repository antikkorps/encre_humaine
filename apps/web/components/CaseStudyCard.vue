<script setup lang="ts">
// Cas concret — « Preuve par l'exemple » (accueil, run 15). Réponse au reproche
// central de l'audit : le site n'exposait aucun « j'ai fait ça, comme ça, et voilà
// ce que ça a donné ». La carte impose donc les trois temps du récit — la
// situation, ce qui a été mis en place, le résultat — dans cet ordre, et le
// résultat est le seul mis en avant visuellement : c'est lui la preuve.
//
// `full` = cas unique, présenté en pleine largeur (deux colonnes) ; sinon carte de
// carrousel, en colonne.
//
// `compact` = accueil (audit SEO 2026-10-22) : carte résumée et bouton vers la
// page d'offre. Le récit complet ne vit qu'à un endroit, sinon Google voit le
// même texte deux fois. Depuis le mail d'Éléonore du 2026-10-26, la carte a ses
// propres champs (étiquette, situation, résultat, bouton) et rien n'y est coupé :
// le résultat chiffré doit se lire sans cliquer.
import type { CaseStudyItem } from "~/types/content";

const props = withDefaults(
  defineProps<{ caseStudy: CaseStudyItem; full?: boolean; compact?: boolean }>(),
  { full: false, compact: false },
);

const STEPS = [
  { key: "situation", label: "La situation", icon: "material-symbols:insights" },
  { key: "actions", label: "Ce qui a été mis en place", icon: "material-symbols:checklist" },
] as const;

// Réduite seulement si le cas complet est lisible ailleurs : sinon le récit
// disparaîtrait du site (cas sans offre publiée).
const reduced = computed(() => props.compact && !!props.caseStudy.readMoreUrl);

// Éléonore jugera la carte résumée sur les chiffres (clic sur un cas, puis
// réservation) après quelques semaines : le clic est donc mesuré.
const track = useTrack();

/** Carte résumée : chaque champ vide retombe sur son équivalent du cas complet. */
const teaser = computed(() => {
  const t = props.caseStudy.teaser;
  return {
    label: t?.label,
    situation: t?.situation || props.caseStudy.summary,
    result: t?.result,
    button: t?.button || "Lire le cas",
  };
});

/** Étapes réellement renseignées (une entrée vide ne laisse pas d'intertitre orphelin). */
const steps = computed(() =>
  STEPS.map((s) => ({ ...s, body: props.caseStudy[s.key] })).filter((s) => s.body),
);
</script>

<template>
  <article
    :id="reduced ? undefined : caseStudy.anchor"
    class="flex h-full scroll-mt-24 flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft"
    :class="full && caseStudy.image ? 'lg:grid lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch' : ''"
  >
    <div class="flex flex-1 flex-col p-7 sm:p-9">
      <p
        v-if="reduced && teaser.label"
        class="text-xs font-bold uppercase tracking-[0.14em] text-orange-600"
      >
        {{ teaser.label }}
      </p>
      <p
        v-else-if="caseStudy.sector || caseStudy.periodLabel"
        class="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600"
      >
        <!-- Le séparateur reste collé au secteur : sur un secteur long (« Secteur
             client : banque • Formatrice coach experte »), l'étiquette passe à la
             ligne et un « • » orphelin ouvrait la seconde. -->
        <span v-if="caseStudy.sector">
          {{ caseStudy.sector }}
          <span v-if="caseStudy.periodLabel" aria-hidden="true">•</span>
        </span>
        <span v-if="caseStudy.periodLabel">{{ caseStudy.periodLabel }}</span>
      </p>
      <h3 class="mt-3 font-display text-2xl font-bold text-ink">
        <AccentText :text="caseStudy.title" />
      </h3>
      <p v-if="reduced ? teaser.situation : caseStudy.summary" class="mt-2 leading-relaxed text-ink/60">
        <AccentText :text="reduced ? teaser.situation : caseStudy.summary" />
      </p>

      <template v-if="reduced">
        <p v-if="teaser.result" class="mt-5 rounded-2xl bg-orange-50 p-4 leading-relaxed text-ink">
          <!-- Espace explicite : Vue retire le blanc entre deux balises. -->
          <span class="font-bold text-orange-600">Résultat&nbsp;:</span>{{ " " }}<AccentText
            :text="teaser.result"
          />
        </p>
        <!-- Bouton secondaire (contour doré, fond clair) : « Réserver 30 min »,
             plein doré, reste l'appel le plus marqué de la page. 44 px minimum
             pour le toucher au doigt. -->
        <div class="mt-auto pt-6">
          <NuxtLink
            :to="caseStudy.readMoreUrl"
            @click="track('case_click', { case: caseStudy.anchor ?? caseStudy.title })"
            class="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-orange-400 bg-orange-50 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <span>{{ teaser.button }}</span>
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
      </template>

      <dl v-if="!reduced" class="mt-7 space-y-5">
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
        v-if="caseStudy.result && !reduced"
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

    <div v-if="caseStudy.image && !reduced" :class="full ? '' : 'order-first'">
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
