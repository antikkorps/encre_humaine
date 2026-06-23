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

// Met le dernier mot du titre en avant (souligné « encre ») — effet générique
// quel que soit le contenu Directus. Un seul mot → tout est mis en avant.
const heroTitle = computed(() => {
  const words = hero.value.title.trim().split(/\s+/);
  const tail = words.pop() ?? hero.value.title;
  // Espace inclus dans la valeur (interpolation) → non rogné par la condensation
  // de blancs des templates Vue.
  return { head: words.length ? `${words.join(" ")} ` : "", tail };
});
</script>

<template>
  <div>
    <!-- 1. Hero (au-dessus de la ligne de flottaison, h1 = hero_title) -->
    <section class="bg-ink-gradient relative isolate overflow-hidden text-paper">
      <!-- Décor « taches d'encre » purement esthétique. -->
      <InkBlob class="absolute -right-16 -top-20 -z-10 h-80 w-80 rotate-12 text-teal-400/15" />
      <InkBlob class="absolute -left-20 top-10 -z-10 h-72 w-72 -rotate-45 text-teal-500/15" />
      <InkBlob class="absolute -bottom-10 right-1/4 -z-10 h-56 w-56 text-orange-400/10" />

      <div class="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
        <p
          class="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-4 py-1.5 text-sm font-medium text-paper/80"
        >
          <OctopusMark class="h-4 w-4 text-teal-300" />
          Conseil RH &amp; accompagnement
        </p>
        <h1 class="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
          <span v-if="heroTitle.head">{{ heroTitle.head }}</span
          ><span class="ink-underline text-paper">{{ heroTitle.tail }}</span>
        </h1>
        <p v-if="hero.subtitle" class="mx-auto mt-6 max-w-2xl text-lg text-paper/80 sm:text-xl">
          {{ hero.subtitle }}
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-3">
          <NuxtLink
            to="/organisations"
            class="rounded-full bg-paper px-6 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
          >
            {{ hero.ctaB2bLabel }}
          </NuxtLink>
          <NuxtLink
            to="/particuliers"
            class="rounded-full bg-orange-500 px-6 py-3.5 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-orange-600"
          >
            {{ hero.ctaB2cLabel }}
          </NuxtLink>
        </div>
      </div>

      <!-- Transition « vague d'encre » du hero sombre vers le fond papier. -->
      <InkWave class="text-paper" height="h-12 sm:h-20" />
    </section>

    <!-- État d'erreur sobre : le hero reste affiché, le reste est remplacé par un mot. -->
    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Ligne de crédibilité (stats) — masquée si vide (StatRow) -->
      <section v-if="content.stats.length" class="mx-auto max-w-5xl px-4 pb-4 pt-10">
        <StatRow :stats="content.stats" />
      </section>

      <!-- 3. Ce que je fais : deux blocs B2B / B2C -->
      <section v-if="blocks.length" class="mx-auto max-w-6xl px-4 py-16">
        <div class="grid gap-6 md:grid-cols-2">
          <article
            v-for="block in blocks"
            :key="block.to"
            class="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white p-8 pl-9 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span
              aria-hidden="true"
              class="absolute inset-y-0 left-0 w-1.5"
              :class="block.to.includes('organisations') ? 'bg-teal-500' : 'bg-orange-400'"
            ></span>
            <p
              class="text-xs font-semibold uppercase tracking-[0.12em]"
              :class="block.to.includes('organisations') ? 'text-teal-700' : 'text-orange-600'"
            >
              {{ block.to.includes("organisations") ? "Organisations" : "Particuliers" }}
            </p>
            <h2 class="mt-1.5 font-display text-2xl font-bold text-ink">{{ block.title }}</h2>
            <p v-if="block.text" class="mt-3 flex-1 leading-relaxed text-ink/65">{{ block.text }}</p>
            <ul v-if="block.tags.length" class="mt-5 flex flex-wrap gap-2">
              <li
                v-for="tag in block.tags"
                :key="tag"
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="
                  block.to.includes('organisations')
                    ? 'bg-teal-50 text-teal-700'
                    : 'bg-orange-50 text-orange-700'
                "
              >
                {{ tag }}
              </li>
            </ul>
            <NuxtLink
              :to="block.to"
              class="mt-6 inline-flex items-center gap-1.5 font-semibold transition-colors"
              :class="
                block.to.includes('organisations')
                  ? 'text-teal-700 hover:text-teal-800'
                  : 'text-orange-600 hover:text-orange-700'
              "
            >
              En savoir plus
              <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
              <span class="sr-only"> — {{ block.title }}</span>
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- 4. Qui je suis -->
      <section v-if="content.intro" class="relative isolate overflow-hidden bg-paper-2">
        <InkBlob class="absolute -right-24 -top-16 -z-10 h-80 w-80 text-teal-500/10" />
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <!-- alt vide admis : portrait illustratif jouxtant le titre/texte qui portent le sens (a11y). -->
          <div v-if="content.intro.photo" class="relative">
            <span
              aria-hidden="true"
              class="absolute -left-3 -top-3 -z-10 h-full w-full rounded-3xl bg-teal-100"
            ></span>
            <img
              :src="content.intro.photo.url"
              :alt="content.intro.photo.alt"
              :width="content.intro.photo.width ?? undefined"
              :height="content.intro.photo.height ?? undefined"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
          <div :class="content.intro.photo ? '' : 'md:col-span-2 mx-auto max-w-2xl text-center'">
            <p class="text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
              À propos
            </p>
            <h2 class="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              {{ content.intro.title }}
            </h2>
            <p v-if="content.intro.text" class="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink/70">
              {{ content.intro.text }}
            </p>
            <NuxtLink
              to="/a-propos"
              class="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-700 transition-colors hover:text-teal-800"
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
        class="mx-auto max-w-3xl px-4 py-20"
        aria-label="Témoignage"
      >
        <p class="mb-6 text-center text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
          Elles &amp; ils en parlent
        </p>
        <TestimonialCard :testimonial="content.featuredTestimonial" />
      </section>

      <!-- 6. Derniers articles — masquée si aucun -->
      <section v-if="content.articles.length" class="bg-teal-50">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            title="Derniers articles"
            eyebrow="Ressources"
            subtitle="Des repères concrets sur les organisations et les transitions."
          />
          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard
              v-for="article in content.articles"
              :key="article.slug"
              :article="article"
            />
          </div>
        </div>
      </section>

      <!-- 7. CTA final -->
      <section v-if="content.finalCta" class="mx-auto max-w-6xl px-4 py-20">
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
