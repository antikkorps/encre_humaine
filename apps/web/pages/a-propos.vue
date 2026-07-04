<script setup lang="ts">
// À propos — docs/02-a-propos.md. Contenu depuis `about_page` via l'endpoint
// serveur caché `/api/content/about` (rich text déjà assaini serveur). Rendu
// SSG/ISR. Sections vides masquées ; en cas d'échec de fetch, message sobre.
const { data: content, error } = await useFetch("/api/content/about", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
// h1 = titre de l'accroche (docs/02 §A11y) ; fallback d'affichage si vide.
const heading = computed(() => content.value?.accroche?.title ?? "À propos");

useSeoMeta({
  title: () => content.value?.seo.title ?? `À propos — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `À propos — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});

// Person (Eléonore) — fondatrice, reliée à l'Organization du site (schemaOrg config).
useSchemaOrg([
  definePerson({
    name: "Eléonore Morée",
    jobTitle: "Conseil RH & accompagnement des parcours professionnels",
    url: "/a-propos",
    sameAs: ["https://www.linkedin.com/in/eleonore-moree"],
  }),
]);
</script>

<template>
  <div>
    <!-- 1. Accroche (h1 + chapeau) -->
    <PageHero :title="heading" eyebrow="À propos" variant="neutral" />

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <section v-if="content.accroche?.bodyHtml" class="mx-auto max-w-3xl px-4 pt-16">
        <RichText :html="content.accroche.bodyHtml" />
      </section>

      <!-- 2. Mon parcours (photo gauche / texte droite desktop) -->
      <section v-if="content.story" class="mx-auto max-w-6xl px-4 py-20">
        <div class="grid items-start gap-10 md:grid-cols-2">
          <div v-if="content.story.photo" class="relative">
            <span
              aria-hidden="true"
              class="absolute -left-3 -top-3 -z-10 h-full w-full rounded-3xl bg-teal-100"
            ></span>
            <NuxtImg
              :src="content.story.photo.url"
              :alt="content.story.photo.alt"
              width="480"
              height="600"
              fit="cover"
              format="webp"
              sizes="100vw md:50vw lg:480px"
              loading="lazy"
              decoding="async"
              class="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
          <div :class="content.story.photo ? '' : 'md:col-span-2 mx-auto max-w-2xl'">
            <SectionHeading :title="content.story.title || 'Mon parcours'" eyebrow="Parcours" />
            <RichText :html="content.story.bodyHtml" class="mt-5" />
          </div>
        </div>
      </section>

      <!-- 3. Pourquoi L'Encre Humaine ? -->
      <section v-if="content.why" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading :title="content.why.title || 'Pourquoi L\'Encre Humaine ?'" />
          <RichText :html="content.why.bodyHtml" class="mt-5" />
        </div>
      </section>

      <!-- 3b. Le poulpe (clin d'œil à la mascotte) -->
      <section v-if="content.octopus" class="relative isolate overflow-hidden">
        <div class="mx-auto grid max-w-5xl items-center gap-8 px-4 py-20 md:grid-cols-[auto_1fr]">
          <OctopusLogo class="mx-auto h-32 w-32 text-teal-600 md:h-40 md:w-40" />
          <div>
            <SectionHeading
              :title="content.octopus.subtitle || 'Et pourquoi un poulpe ?'"
              eyebrow="Pourquoi ce nom"
            />
            <RichText :html="content.octopus.bodyHtml" class="mt-5" />
          </div>
        </div>
      </section>

      <!-- 4. Mes convictions -->
      <section v-if="content.convictions" class="bg-paper-2">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.convictions.title || 'Mes convictions'" align="center" />
          <ul class="mt-10 grid gap-6 sm:grid-cols-2">
            <li
              v-for="(conviction, i) in content.convictions.items"
              :key="i"
              class="rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
            >
              <h3 v-if="conviction.title" class="font-display text-lg font-semibold text-ink">
                {{ conviction.title }}
              </h3>
              <p
                v-if="conviction.body"
                class="mt-2 whitespace-pre-line leading-relaxed text-ink/65"
              >
                {{ conviction.body }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <!-- 5. Ma manière d'accompagner -->
      <section v-if="content.work" class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading :title="content.work.title || 'Comment je travaille'" />
        <p
          v-if="content.work.intro"
          class="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink/70"
        >
          {{ content.work.intro }}
        </p>
        <ul v-if="content.work.principles.length" class="mt-8 space-y-6">
          <li
            v-for="(principle, i) in content.work.principles"
            :key="i"
            class="border-l-2 border-orange-200 pl-4"
          >
            <h3 v-if="principle.title" class="font-display text-lg font-semibold text-ink">
              {{ principle.title }}
            </h3>
            <p v-if="principle.body" class="mt-1 whitespace-pre-line leading-relaxed text-ink/65">
              {{ principle.body }}
            </p>
          </li>
        </ul>
        <p
          v-if="content.work.location"
          class="mt-8 rounded-2xl bg-teal-50 px-5 py-4 leading-relaxed text-ink/75"
        >
          {{ content.work.location }}
        </p>
      </section>

      <!-- 6. Ce que je ne fais pas -->
      <section v-if="content.whatIDontDo" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading :title="content.whatIDontDo.title || 'Ce que je ne fais pas'" />
          <ul class="mt-8 space-y-3">
            <li
              v-for="(item, i) in content.whatIDontDo.items"
              :key="i"
              class="flex items-start gap-3 text-ink/80"
            >
              <span
                class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600"
                aria-hidden="true"
                >✗</span
              >
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 7. Portrait + citation (optionnel) -->
      <section
        v-if="content.portrait"
        class="mx-auto max-w-4xl px-4 py-20"
        aria-label="Portrait"
      >
        <figure class="flex flex-col items-center gap-6 text-center">
          <NuxtImg
            v-if="content.portrait.photo"
            :src="content.portrait.photo.url"
            :alt="content.portrait.photo.alt"
            width="160"
            height="160"
            fit="cover"
            format="webp"
            sizes="160px"
            loading="lazy"
            decoding="async"
            class="h-40 w-40 rounded-full object-cover shadow-lift ring-4 ring-teal-100"
          />
          <blockquote v-if="content.portrait.quote" class="max-w-2xl">
            <p class="font-display text-2xl leading-relaxed text-ink">
              «&#160;{{ content.portrait.quote }}&#160;»
            </p>
          </blockquote>
        </figure>
      </section>

      <!-- 8. CTA -->
      <section class="mx-auto max-w-6xl px-4 pb-20">
        <CtaBlock
          :title="content.cta.title || 'Travaillons ensemble'"
          :description="content.cta.body ?? undefined"
          :cta-label="content.cta.label"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
