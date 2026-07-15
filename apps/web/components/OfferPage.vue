<script setup lang="ts">
// Gabarit page Offre (B2B & B2C) — docs/05-offres-gabarit.md. **Une seule
// implémentation** pour les 5 offres (DRY) : les pages route `/organisations/[slug]`
// et `/particuliers/[slug]` montent ce composant avec leur `audience`. Contenu via
// l'endpoint serveur caché `/api/content/offer/:slug` (rich text déjà assaini
// serveur). 404 si l'offre n'existe pas ou si son audience ne correspond pas à la
// route. Mise en forme éditoriale : marine (`teal-*`) + doré (`orange-*`), chiffres,
// icônes Material Symbols, panneaux sombres. Orga = marine dominant / B2C = doré.
import type { Audience } from "@encre/shared/validation";

const props = defineProps<{ audience: Audience }>();

const route = useRoute();
const { data: content, error } = await useFetch(() => `/api/content/offer/${route.params.slug}`, {
  query: usePreviewQuery(),
});

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage || "Contenu momentanément indisponible",
    fatal: true,
  });
}
if (!content.value || content.value.audience !== props.audience) {
  throw createError({ statusCode: 404, statusMessage: "Offre introuvable", fatal: true });
}

const isB2c = computed(() => props.audience === "particulier");

// Registre : orga = fonds froids (teal-50) ; B2C = fonds chauds (orange-50). Les
// accents dorés et les panneaux marine sont communs (charte navy + or).
const theme = computed(() =>
  isB2c.value
    ? { soft: "bg-orange-50", band: "bg-paper-2" }
    : { soft: "bg-teal-50", band: "bg-paper-2" },
);
const hub = computed(() =>
  isB2c.value
    ? { to: "/particuliers", label: "Pour les particuliers" }
    : { to: "/organisations", label: "Pour les organisations" },
);
// Kickers dorés par offre. Éléonore veut un titre de section *parlant* plutôt que
// l'étiquette générique (« Bénéfices », « Le constat »…) : le libellé change donc
// d'une offre à l'autre. Les valeurs manquantes retombent sur le défaut générique
// passé au rendu, ce qui garde une offre non listée ici parfaitement fonctionnelle.
type OfferEyebrows = Partial<
  Record<
    "outcomes" | "context" | "approche" | "background" | "mission" | "format" | "takeaways",
    string
  >
>;
const EYEBROWS: Record<string, OfferEyebrows> = {
  "audit-rh": {
    outcomes: "Ce que cet audit change concrètement",
    context: "Ce que je vois très souvent en entreprise",
  },
  "competences-parcours": {
    outcomes: "Ce que cet accompagnement change concrètement",
    context: "Ce que j'observe le plus souvent",
    approche: "Une approche qui relie compétences et parcours",
  },
  "managers-equipes": {
    outcomes: "Ce que cet accompagnement change concrètement",
    context: "Ce que j'observe le plus souvent",
    approche: "Une approche qui relie management, RH et réalité du terrain",
    // Une thématique au choix, pas un package : d'où « thématiques » et non « mission ».
    mission: "Les thématiques d'accompagnement",
    format: "Le format",
  },
  "clarifier-avancer": {
    outcomes: "Ce que cet accompagnement peut changer",
    approche: "Derrière le flou, il y a souvent déjà des réponses",
    mission: "Ce que nous travaillons ensemble",
    background: "Une approche à la croisée des parcours et des RH",
    format: "Le format",
    takeaways: "Ce que vous emportez avec vous",
  },
  "booster-recherche": {
    outcomes: "Ce qui se joue vraiment dans une recherche d'emploi",
    context: "Clarifier vs booster : deux moments différents",
    mission: "Ce que nous travaillons ensemble",
    background: "La lecture RH des recruteurs",
    format: "Format de l'accompagnement",
    takeaways: "Vous repartez avec",
  },
};
const eyebrows = computed<OfferEyebrows>(() => EYEBROWS[String(route.params.slug)] ?? {});

const missionHeading = computed(
  () =>
    eyebrows.value.mission ??
    (isB2c.value ? "Ce qu'on fait ensemble" : "Ce que comprend la mission"),
);
const formatHeading = computed(() => (isB2c.value ? "Le format" : "Comment ça se passe"));

/** Clé Material Symbols d'un item, avec repli par section. */
const icon = (key: string | undefined, fallback: string) => `material-symbols:${key || fallback}`;
const num = (i: number) => String(i + 1).padStart(2, "0");

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? content.value?.seo.title ?? "Offre");
const eyebrow = computed(() => content.value?.title ?? hub.value.label);

useSeoMeta({
  title: () => content.value?.seo.title ?? `${heading.value} — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? heading.value,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: "Accueil", item: "/" },
      { name: isB2c.value ? "Particuliers" : "Organisations", item: hub.value.to },
      { name: heading.value },
    ],
  }),
]);
</script>

<template>
  <div v-if="content">
    <!-- 1. Accroche — même gabarit que les hubs : PageHero 2 colonnes, discours à
         gauche, texte d'accroche en carte givrée à droite (au lieu du paragraphe
         nu qui flottait sous le hero). -->
    <PageHero
      :title="heading"
      :eyebrow="eyebrow"
      :body="content.accrocheSubtitle ?? undefined"
      :variant="isB2c ? 'orange' : 'teal'"
    >
      <template #top>
        <nav class="mb-6 text-sm font-medium text-orange-600" aria-label="Fil d'Ariane">
          <NuxtLink :to="hub.to" class="underline-offset-2 hover:underline">← {{ hub.label }}</NuxtLink>
        </nav>
      </template>
      <template v-if="content.accrocheBody" #aside>
        <figure
          class="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white/70 p-8 shadow-lift backdrop-blur-sm"
        >
          <div
            class="absolute -right-10 -top-10 h-28 w-28 rounded-full"
            :class="isB2c ? 'bg-teal-100/70' : 'bg-orange-100/70'"
            aria-hidden="true"
          ></div>
          <span
            class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-900 text-orange-300 shadow-soft"
          >
            <Icon name="material-symbols:lightbulb" class="h-6 w-6" />
          </span>
          <p class="relative mt-5 whitespace-pre-line text-[1.05rem] leading-relaxed text-ink/75">
            {{ content.accrocheBody }}
          </p>
        </figure>
      </template>
    </PageHero>

    <!-- Signature d'accroche → bandeau marine + CTA -->
    <section v-if="content.accrocheSignature" v-reveal class="mx-auto max-w-6xl px-4 py-14">
      <div
        class="flex flex-col gap-6 rounded-3xl bg-teal-900 p-8 shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-10"
      >
        <p class="max-w-2xl whitespace-pre-line font-display text-xl font-medium leading-relaxed text-paper">
          <Icon name="material-symbols:format-quote" class="mb-1 block h-8 w-8 text-orange-300" />
          {{ content.accrocheSignature }}
        </p>
        <NuxtLink
          to="/contact"
          class="inline-flex flex-none items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
        >
          {{ content.ctaLabel }}
          <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
        </NuxtLink>
      </div>
    </section>

    <!-- 2. Ce que ça change (bénéfices numérotés) -->
    <section v-if="content.outcomes.length" v-reveal :class="theme.soft">
      <div class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="content.outcomesTitle || 'Ce que vous en retirez'"
          :subtitle="content.outcomesIntro ?? undefined"
          :eyebrow="eyebrows.outcomes ?? 'Bénéfices'"
        />
        <ol class="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="(outcome, i) in content.outcomes" :key="i">
            <div class="flex items-center gap-3">
              <span class="font-display text-4xl font-bold text-orange-300">{{ num(i) }}</span>
              <Icon
                v-if="outcome.icon"
                :name="icon(outcome.icon, 'check-circle')"
                class="h-7 w-7 text-orange-600"
              />
            </div>
            <h3 v-if="outcome.title" class="mt-4 font-display text-lg font-semibold text-ink">
              {{ outcome.title }}
            </h3>
            <p v-if="outcome.body" class="mt-2 text-sm leading-relaxed text-ink/65">{{ outcome.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- 3. Ce que je vois souvent (contexte, cartes à icônes) -->
    <section v-if="content.context" v-reveal :class="theme.band">
      <div class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="content.context.title || 'Ce que je vois souvent'"
          :eyebrow="eyebrows.context ?? 'Le constat'"
        />
        <div v-if="content.context.items.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(item, i) in content.context.items"
            :key="i"
            class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"
          >
            <span
              class="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200"
            >
              <Icon :name="icon(item.icon, 'lightbulb')" class="h-6 w-6" />
            </span>
            <h3 v-if="item.title" class="mt-4 font-display text-base font-semibold text-ink">
              {{ item.title }}
            </h3>
            <p v-if="item.body" class="mt-1.5 text-sm leading-relaxed text-ink/65">{{ item.body }}</p>
          </article>
        </div>
        <p
          v-if="content.context.conclusion"
          class="mx-auto mt-10 max-w-2xl whitespace-pre-line text-center text-lg leading-relaxed text-ink/80"
        >
          {{ content.context.conclusion }}
        </p>
      </div>
    </section>

    <!-- 3bis. Une approche qui relie (optionnel) — narratif + encadré citation -->
    <section v-if="content.approche" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading
        :title="content.approche.title || 'Mon approche'"
        :eyebrow="eyebrows.approche ?? 'Approche'"
      />
      <RichText v-if="content.approche.bodyHtml" :html="content.approche.bodyHtml" class="mt-5" />
      <aside
        v-if="content.approche.signature"
        class="mt-8 rounded-3xl border border-orange-200 bg-orange-50/60 p-6"
      >
        <Icon name="material-symbols:format-quote" class="h-7 w-7 text-orange-500" />
        <p class="mt-2 whitespace-pre-line font-display text-lg leading-relaxed text-ink/85">
          {{ content.approche.signature }}
        </p>
      </aside>
    </section>

    <!-- 4bis. Un regard / une expérience (optionnel) -->
    <section v-if="content.background" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading
        :title="content.background.title || 'Mon expérience'"
        :eyebrow="eyebrows.background ?? 'Expérience'"
      />
      <RichText v-if="content.background.bodyHtml" :html="content.background.bodyHtml" class="mt-5" />
    </section>

    <!-- 4 + 6. Ce que comprend la mission (panneau marine) + Pour qui (clair) -->
    <section
      v-if="content.missionIncludes.length || content.audienceFit.length || content.audienceFitExclude.length || content.audienceFitConclusion"
      v-reveal
      class="mx-auto max-w-6xl px-4 py-20"
    >
      <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
        <!-- Mission — panneau marine sombre -->
        <div
          v-if="content.missionIncludes.length"
          class="rounded-3xl bg-teal-900 p-8 text-paper shadow-lift sm:p-10"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
            {{ missionHeading }}
          </p>
          <h2 class="mt-3 font-display text-2xl font-bold text-paper">
            {{ content.missionTitle || missionHeading }}
          </h2>
          <p v-if="content.missionIntro" class="mt-2 text-paper/70">{{ content.missionIntro }}</p>
          <ul class="mt-8 space-y-5">
            <li v-for="(item, i) in content.missionIncludes" :key="i" class="flex items-start gap-4">
              <span
                class="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/10 text-orange-300"
              >
                <Icon :name="icon(item.icon, 'check-circle')" class="h-6 w-6" />
              </span>
              <div>
                <p v-if="item.title" class="font-display font-semibold text-paper">{{ item.title }}</p>
                <p v-if="item.body" class="mt-0.5 text-sm leading-relaxed text-paper/65">{{ item.body }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Pour qui — panneau clair -->
        <div
          v-if="content.audienceFit.length || content.audienceFitExclude.length || content.audienceFitConclusion"
          class="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft sm:p-10"
        >
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-orange-600">Pour qui ?</p>
          <h2 class="mt-3 font-display text-2xl font-bold text-ink">
            {{ content.audienceFitTitle || 'Cette mission est faite pour vous si…' }}
          </h2>
          <ul v-if="content.audienceFit.length" class="mt-6 space-y-3">
            <li v-for="(item, i) in content.audienceFit" :key="i" class="flex items-start gap-3 text-ink/80">
              <Icon
                name="material-symbols:check-circle-rounded"
                class="mt-0.5 h-5 w-5 flex-none text-orange-500"
              />
              <span>{{ item }}</span>
            </li>
          </ul>
          <template v-if="content.audienceFitExclude.length">
            <p class="mt-8 font-display font-semibold text-ink">
              Cet accompagnement n'est probablement pas adapté si…
            </p>
            <ul class="mt-3 space-y-3">
              <li
                v-for="(item, i) in content.audienceFitExclude"
                :key="i"
                class="flex items-start gap-3 text-ink/55"
              >
                <Icon name="material-symbols:cancel" class="mt-0.5 h-5 w-5 flex-none text-ink/30" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </template>
          <p
            v-if="content.audienceFitConclusion"
            class="mt-8 whitespace-pre-line rounded-2xl bg-paper-2 p-4 text-sm leading-relaxed text-ink/75"
          >
            {{ content.audienceFitConclusion }}
          </p>
        </div>
      </div>
    </section>

    <!-- 5. Comment ça se passe / Le format (optionnel) -->
    <section v-if="content.formatBodyHtml" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading
        :title="content.formatTitle || formatHeading"
        :eyebrow="eyebrows.format ?? 'Déroulé'"
      />
      <RichText :html="content.formatBodyHtml" class="mt-5" />
    </section>

    <!-- 6bis. Ce que vous emportez (livrables ✓) — masqué si vide -->
    <section v-if="content.takeaways" v-reveal :class="theme.soft">
      <div class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading
          :title="content.takeaways.title || 'Ce que vous emportez'"
          :subtitle="content.takeaways.intro ?? undefined"
          :eyebrow="eyebrows.takeaways ?? 'Livrables'"
        />
        <ul class="mt-8 space-y-3">
          <li v-for="(item, i) in content.takeaways.items" :key="i" class="flex items-start gap-3 text-ink/80">
            <Icon name="material-symbols:check-circle-rounded" class="mt-0.5 h-5 w-5 flex-none text-orange-500" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 7. Investissement — panneau marine : le montant *est* le titre, format et
         conditions en soutien (les deux cartes blanches côte à côte diluaient le
         prix dans une étiquette « Tarif » grise). -->
    <section
      v-if="content.priceLabel || content.priceNote || content.durationLabel"
      v-reveal
      class="mx-auto max-w-4xl px-4 py-20"
    >
      <div class="relative isolate overflow-hidden rounded-[1.75rem] bg-teal-900 p-8 shadow-lift sm:p-10">
        <InkBlob class="absolute -right-16 -top-20 -z-10 h-72 w-72 rotate-12 text-orange-300/[0.07]" />
        <SectionHeading tone="dark" eyebrow="Investissement" :title="content.priceLabel || 'Sur devis'" />
        <dl class="mt-8 grid gap-6 sm:grid-cols-2">
          <div v-if="content.durationLabel" class="rounded-2xl bg-white/5 p-6 ring-1 ring-inset ring-white/10">
            <dt class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
              <Icon name="material-symbols:event" class="h-5 w-5" />
              Format
            </dt>
            <dd class="mt-2 font-display text-lg font-semibold text-paper">{{ content.durationLabel }}</dd>
          </div>
          <div v-if="content.priceNote" class="rounded-2xl bg-white/5 p-6 ring-1 ring-inset ring-white/10">
            <dt class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-300">
              <Icon name="material-symbols:payments" class="h-5 w-5" />
              Conditions
            </dt>
            <dd class="mt-2 whitespace-pre-line text-sm leading-relaxed text-paper/70">
              {{ content.priceNote }}
            </dd>
          </div>
        </dl>
        <!-- Franchise en base de TVA (docs/05 §6, ADR #4). -->
        <p class="mt-6 text-xs text-paper/45">TVA non applicable, art. 293 B du CGI.</p>
      </div>
    </section>

    <!-- 8. FAQ (faq_items par scope) -->
    <section v-if="content.faq.length" v-reveal :class="theme.band">
      <div class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading title="Questions fréquentes" eyebrow="FAQ" />
        <div class="mt-10">
          <FaqAccordion :items="content.faq" />
        </div>
      </div>
    </section>

    <!-- 9. Témoignages (centralisés par audience de l'offre) — masqué si vide -->
    <section
      v-if="content.testimonials.length"
      v-reveal
      class="mx-auto max-w-5xl px-4 py-20"
      aria-label="Témoignages"
    >
      <SectionHeading title="Ce qu'en disent les personnes accompagnées" eyebrow="Témoignages" />
      <div class="mt-10 grid gap-6 md:grid-cols-2">
        <TestimonialCard
          v-for="(testimonial, i) in content.testimonials"
          :key="i"
          :testimonial="testimonial"
        />
      </div>
    </section>

    <!-- 10. CTA final → contact (bandeau marine mutualisé) -->
    <section v-reveal class="mx-auto max-w-6xl px-4 py-16">
      <CtaBanner
        :title="content.ctaTitle || 'Travaillons ensemble'"
        :body="content.ctaBody ?? undefined"
        :cta-label="content.ctaLabel"
        to="/contact"
        :subtext="content.ctaSubtext ?? undefined"
      />
    </section>
  </div>
</template>
