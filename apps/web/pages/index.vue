<script setup lang="ts">
// Accueil — docs/01-accueil.md. Contenu depuis `home_page` + 3 derniers articles
// + témoignage vedette, via l'endpoint serveur caché `/api/content/home` (le token
// Directus reste serveur). Rendu SSG/ISR. Les sections dynamiques se masquent
// proprement si vides ; en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/home");

const siteName = "L'Encre Humaine";

useSeoMeta({
  title: () => content.value?.seo.title ?? siteName,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? siteName,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});

const hero = computed(
  () =>
    content.value?.hero ?? {
      title: siteName,
      subtitle: null,
      ctaB2bLabel: "Je suis une organisation",
      ctaB2cLabel: "Je suis un particulier",
    },
);

const blocks = computed(() =>
  [content.value?.blockB2b, content.value?.blockB2c].filter((b) => b != null),
);
</script>

<template>
  <div>
    <!-- 1. Hero (au-dessus de la ligne de flottaison, h1 = hero_title) -->
    <section class="bg-teal-700 text-white">
      <div class="mx-auto max-w-6xl px-4 py-20 text-center sm:py-24">
        <h1 class="font-display text-4xl font-bold sm:text-5xl">{{ hero.title }}</h1>
        <p v-if="hero.subtitle" class="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
          {{ hero.subtitle }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <NuxtLink
            to="/organisations"
            class="rounded-full bg-white px-6 py-3 font-medium text-teal-800 hover:bg-teal-50"
          >
            {{ hero.ctaB2bLabel }}
          </NuxtLink>
          <NuxtLink
            to="/particuliers"
            class="rounded-full bg-orange-600 px-6 py-3 font-medium text-white hover:bg-orange-700"
          >
            {{ hero.ctaB2cLabel }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- État d'erreur sobre : le hero reste affiché, le reste est remplacé par un mot. -->
    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-teal-700"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Ligne de crédibilité (stats) — masquée si vide (StatRow) -->
      <section v-if="content.stats.length" class="bg-teal-50">
        <div class="mx-auto max-w-6xl px-4 py-12">
          <StatRow :stats="content.stats" />
        </div>
      </section>

      <!-- 3. Ce que je fais : deux blocs B2B / B2C -->
      <section v-if="blocks.length" class="mx-auto max-w-6xl px-4 py-16">
        <div class="grid gap-6 md:grid-cols-2">
          <article
            v-for="block in blocks"
            :key="block.to"
            class="flex flex-col rounded-2xl border border-teal-100 bg-white p-6"
          >
            <h2 class="font-display text-xl font-bold text-teal-900">{{ block.title }}</h2>
            <p v-if="block.text" class="mt-3 flex-1 text-teal-700">{{ block.text }}</p>
            <ul v-if="block.tags.length" class="mt-4 flex flex-wrap gap-2">
              <li
                v-for="tag in block.tags"
                :key="tag"
                class="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
              >
                {{ tag }}
              </li>
            </ul>
            <NuxtLink
              :to="block.to"
              class="mt-5 inline-flex items-center gap-1 font-medium text-brand-accent hover:underline"
            >
              En savoir plus
              <span aria-hidden="true">→</span>
              <span class="sr-only"> — {{ block.title }}</span>
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- 4. Qui je suis -->
      <section v-if="content.intro" class="bg-teal-50">
        <div class="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <!-- alt vide admis : portrait illustratif jouxtant le titre/texte qui portent le sens (a11y). -->
          <img
            v-if="content.intro.photo"
            :src="content.intro.photo.url"
            :alt="content.intro.photo.alt"
            :width="content.intro.photo.width ?? undefined"
            :height="content.intro.photo.height ?? undefined"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div :class="content.intro.photo ? '' : 'md:col-span-2 mx-auto max-w-2xl text-center'">
            <h2 class="font-display text-2xl font-bold text-teal-900 sm:text-3xl">
              {{ content.intro.title }}
            </h2>
            <p v-if="content.intro.text" class="mt-4 whitespace-pre-line text-teal-700">
              {{ content.intro.text }}
            </p>
            <NuxtLink
              to="/a-propos"
              class="mt-6 inline-flex items-center gap-1 font-medium text-brand-accent hover:underline"
            >
              En savoir plus sur moi
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 5. Témoignage vedette — section masquée si absent -->
      <section
        v-if="content.featuredTestimonial"
        class="mx-auto max-w-3xl px-4 py-16"
        aria-label="Témoignage"
      >
        <TestimonialCard :testimonial="content.featuredTestimonial" />
      </section>

      <!-- 6. Derniers articles — masquée si aucun -->
      <section v-if="content.articles.length" class="bg-teal-50">
        <div class="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            title="Derniers articles"
            eyebrow="Ressources"
            subtitle="Des repères concrets sur les organisations et les transitions."
          />
          <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard
              v-for="article in content.articles"
              :key="article.slug"
              :article="article"
            />
          </div>
        </div>
      </section>

      <!-- 7. CTA final -->
      <section v-if="content.finalCta" class="mx-auto max-w-6xl px-4 py-16">
        <CtaBlock
          :title="content.finalCta.title"
          :cta-label="content.finalCta.label"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
