<script setup lang="ts">
// À propos — docs/02-a-propos.md. Contenu depuis `about_page` via l'endpoint
// serveur caché `/api/content/about` (rich text déjà assaini serveur). Rendu
// SSG/ISR, 2 colonnes desktop / empilé mobile. Sections vides masquées ;
// en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/about");

const siteName = "L'Encre Humaine";
// h1 = titre de l'accroche (docs/02 §A11y) ; fallback d'affichage si vide.
const heading = computed(() => content.value?.accroche ?? "À propos");

useSeoMeta({
  title: () => content.value?.seo.title ?? `À propos — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `À propos — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche (h1) -->
    <section class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold text-teal-900 sm:text-4xl">{{ heading }}</h1>
      </div>
    </section>

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-teal-700"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Mon histoire (photo gauche / texte droite desktop) -->
      <section v-if="content.story" class="mx-auto max-w-6xl px-4 py-16">
        <div class="grid items-start gap-8 md:grid-cols-2">
          <img
            v-if="content.story.photo"
            :src="content.story.photo.url"
            :alt="content.story.photo.alt"
            loading="lazy"
            decoding="async"
            class="aspect-[4/5] w-full rounded-2xl object-cover"
          />
          <div :class="content.story.photo ? '' : 'md:col-span-2 mx-auto max-w-2xl'">
            <SectionHeading title="Mon histoire" eyebrow="À propos" />
            <RichText :html="content.story.bodyHtml" class="mt-4" />
          </div>
        </div>
      </section>

      <!-- 3. Pourquoi L'Encre Humaine -->
      <section v-if="content.why" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-16">
          <SectionHeading :title="content.why.title || 'Pourquoi L\'Encre Humaine'" />
          <RichText :html="content.why.bodyHtml" class="mt-4" />
        </div>
      </section>

      <!-- 4. Le poulpe (ton avec humour) -->
      <section v-if="content.octopusHtml" class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading title="Le poulpe" eyebrow="🐙" />
        <RichText :html="content.octopusHtml" class="mt-4" />
      </section>

      <!-- 5. Ce en quoi je crois -->
      <section v-if="content.convictions.length" class="bg-teal-50">
        <div class="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading title="Ce en quoi je crois" align="center" />
          <ul class="mt-8 grid gap-6 sm:grid-cols-2">
            <li
              v-for="(conviction, i) in content.convictions"
              :key="i"
              class="rounded-2xl border border-teal-100 bg-white p-6"
            >
              <h3 v-if="conviction.title" class="font-display text-lg font-semibold text-teal-900">
                {{ conviction.title }}
              </h3>
              <p v-if="conviction.body" class="mt-2 text-teal-700">{{ conviction.body }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- 6. Ma façon de travailler -->
      <section v-if="content.howIWork.length" class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading title="Ma façon de travailler" />
        <ul class="mt-6 space-y-3">
          <li
            v-for="(step, i) in content.howIWork"
            :key="i"
            class="flex gap-3 text-teal-700"
          >
            <span class="mt-1 text-brand-accent" aria-hidden="true">→</span>
            <span>{{ step }}</span>
          </li>
        </ul>
      </section>

      <!-- 7. Ce que je ne fais pas -->
      <section v-if="content.whatIDontDoHtml" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-16">
          <SectionHeading title="Ce que je ne fais pas" />
          <RichText :html="content.whatIDontDoHtml" class="mt-4" />
        </div>
      </section>

      <!-- 8. Portrait + citation -->
      <section
        v-if="content.portrait"
        class="mx-auto max-w-4xl px-4 py-16"
        aria-label="Portrait"
      >
        <figure class="flex flex-col items-center gap-6 text-center">
          <img
            v-if="content.portrait.photo"
            :src="content.portrait.photo.url"
            :alt="content.portrait.photo.alt"
            loading="lazy"
            decoding="async"
            class="h-40 w-40 rounded-full object-cover"
          />
          <blockquote v-if="content.portrait.quote" class="max-w-2xl">
            <p class="font-display text-xl text-teal-900 before:content-['«_'] after:content-['_»']">
              {{ content.portrait.quote }}
            </p>
          </blockquote>
        </figure>
      </section>

      <!-- 9. CTA -->
      <section class="mx-auto max-w-6xl px-4 pb-16">
        <CtaBlock
          title="Travaillons ensemble"
          :cta-label="content.ctaLabel"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
