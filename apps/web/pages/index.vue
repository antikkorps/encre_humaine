<script setup lang="ts">
// Accueil — docs/01-accueil.md. Contenu depuis `home_page` + 3 derniers articles
// + témoignage vedette, via l'endpoint serveur caché `/api/content/home` (le token
// Directus reste serveur). Rendu SSG/ISR. Les sections dynamiques se masquent
// proprement si vides ; en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/home", {
  query: usePreviewQuery(),
});

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
      tagline: [] as string[],
      proofs: [] as string[],
      ctaPrimaryLabel: "Prendre rendez-vous",
      ctaSecondaryLabel: "Découvrir l'approche",
    },
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
      <!-- Décor : filigrane poulpe (accent identitaire fort) + taches d'encre. -->
      <OctopusWatermark
        class="absolute -right-24 top-1/2 -z-10 hidden h-[40rem] -translate-y-1/2 rotate-6 text-sand-300/[0.2] md:block"
      />
      <InkBlob class="absolute -left-20 top-10 -z-10 h-72 w-72 -rotate-45 text-teal-500/15" />
      <InkBlob class="absolute -bottom-10 left-1/4 -z-10 h-56 w-56 text-orange-400/10" />

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
        <!-- Ligne d'expertise (domaines couverts) -->
        <p
          v-if="hero.tagline.length"
          class="mx-auto mt-5 max-w-2xl text-sm font-medium uppercase tracking-[0.1em] text-teal-200/90"
        >
          {{ hero.tagline.join(" • ") }}
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-3">
          <NuxtLink
            to="/contact"
            class="rounded-full bg-paper px-6 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
          >
            {{ hero.ctaPrimaryLabel }}
          </NuxtLink>
          <a
            href="#approche"
            class="rounded-full border border-paper/25 bg-paper/5 px-6 py-3.5 font-semibold text-paper transition-colors hover:bg-paper/10"
          >
            {{ hero.ctaSecondaryLabel }}
          </a>
        </div>
        <!-- Micro-preuves rapides -->
        <ul
          v-if="hero.proofs.length"
          class="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-paper/75"
        >
          <li v-for="proof in hero.proofs" :key="proof" class="inline-flex items-center gap-1.5">
            <svg
              class="h-4 w-4 shrink-0 text-teal-300"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clip-rule="evenodd"
              />
            </svg>
            {{ proof }}
          </li>
        </ul>
      </div>

      <!-- La vague « coule » vers la 1re section claire, quelle qu'elle soit :
           fond crème des stats si présentes, sinon la section Problème (paper-2).
           Robuste si les stats reviennent — pas de liseré au raccord. -->
      <InkWave
        :class="content?.stats.length ? 'text-paper' : 'text-paper-2'"
        height="h-12 sm:h-20"
      />
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

      <!-- 3. Problème : « Vous vous reconnaissez ? » -->
      <!-- Pas de v-reveal ici : la translation rouvrirait un liseré sous la vague
           du hero (le raccord doit rester collé). -->
      <section v-if="content.recognition" class="bg-paper-2">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.recognition.title"
            :subtitle="content.recognition.subtitle ?? undefined"
            eyebrow="Le constat"
          />
          <ul
            v-if="content.recognition.items.length"
            class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <li
              v-for="(item, i) in content.recognition.items"
              :key="i"
              class="flex gap-3 rounded-2xl border border-ink/5 bg-white p-5 shadow-soft"
            >
              <span
                aria-hidden="true"
                class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400"
              ></span>
              <span class="leading-relaxed text-ink/75">{{ item }}</span>
            </li>
          </ul>
          <p
            v-if="content.recognition.conclusion"
            class="mt-10 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-ink/80"
          >
            {{ content.recognition.conclusion }}
          </p>
        </div>
      </section>

      <!-- 4. Promesse / Offre : « Ce que je vous aide à construire » (#offres) -->
      <section v-if="content.build" id="offres" v-reveal class="scroll-mt-24">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.build.title" eyebrow="Mon offre" />
          <div class="mt-12 grid gap-6 md:grid-cols-3">
            <article
              v-for="(block, i) in content.build.blocks"
              :key="i"
              class="flex flex-col rounded-3xl border border-ink/5 bg-white p-8 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span aria-hidden="true" class="h-1.5 w-10 rounded-full bg-teal-500"></span>
              <h3 class="mt-4 font-display text-xl font-bold text-ink">{{ block.title }}</h3>
              <p v-if="block.body" class="mt-3 flex-1 leading-relaxed text-ink/65">
                {{ block.body }}
              </p>
            </article>
          </div>
          <div v-if="content.build.ctaLabel" class="mt-10">
            <NuxtLink
              :to="content.build.ctaUrl"
              class="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-paper shadow-soft transition-transform hover:-translate-y-0.5"
            >
              {{ content.build.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 5. Ma méthode (#approche) — étapes numérotées -->
      <section
        v-if="content.method"
        id="approche"
        v-reveal
        class="relative isolate scroll-mt-24 overflow-hidden bg-teal-50"
      >
        <TentacleAccent
          name="tentacule-5-plein"
          class="absolute -right-20 -top-16 -z-10 hidden w-[28rem] text-teal-600/[0.07] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.method.title"
            :subtitle="content.method.subtitle ?? undefined"
            eyebrow="Ma méthode"
          />
          <ol class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="(step, i) in content.method.steps" :key="i" class="relative">
              <span class="font-display text-5xl font-bold text-teal-600/30">{{ i + 1 }}</span>
              <h3 class="mt-2 font-display text-xl font-bold text-ink">{{ step.title }}</h3>
              <p v-if="step.body" class="mt-2 leading-relaxed text-ink/70">{{ step.body }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 6. Signature / Positionnement : double expertise -->
      <section v-if="content.why" v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="content.why.title"
          :subtitle="content.why.subtitle ?? undefined"
          eyebrow="Ma signature"
        />
        <div class="mt-12 grid gap-6 md:grid-cols-3">
          <article
            v-for="(item, i) in content.why.items"
            :key="i"
            class="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft"
          >
            <h3 class="font-display text-xl font-bold text-ink">{{ item.title }}</h3>
            <p v-if="item.body" class="mt-3 leading-relaxed text-ink/65">{{ item.body }}</p>
          </article>
        </div>
        <p
          v-if="content.why.conclusion"
          class="mt-10 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ink/80"
        >
          {{ content.why.conclusion }}
        </p>
      </section>

      <!-- 7. À propos -->
      <section v-if="content.intro" v-reveal class="relative isolate overflow-hidden bg-paper-2">
        <InkBlob class="absolute -right-24 -top-16 -z-10 h-80 w-80 text-teal-500/10" />
        <TentacleAccent
          name="tentacule-2-trait"
          class="absolute -left-16 bottom-0 -z-10 hidden w-[34rem] rotate-6 text-teal-700/[0.08] lg:block"
        />
        <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <!-- alt vide admis : portrait illustratif jouxtant le titre/texte qui portent le sens (a11y). -->
          <div v-if="content.intro.photo" class="relative">
            <span
              aria-hidden="true"
              class="absolute -left-3 -top-3 -z-10 h-full w-full rounded-3xl bg-teal-100"
            ></span>
            <NuxtImg
              :src="content.intro.photo.url"
              :alt="content.intro.photo.alt"
              :width="content.intro.photo.width ?? 640"
              :height="content.intro.photo.height ?? 480"
              fit="cover"
              format="webp"
              sizes="100vw md:50vw lg:560px"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
          <div :class="content.intro.photo ? '' : 'md:col-span-2 max-w-3xl'">
            <p class="text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
              À propos
            </p>
            <h2 class="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              {{ content.intro.title }}
            </h2>
            <p
              v-if="content.intro.text"
              class="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink/70"
            >
              {{ content.intro.text }}
            </p>
            <NuxtLink
              to="/a-propos"
              class="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-700 transition-colors hover:text-teal-800"
            >
              {{ content.intro.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 8. Particuliers : 2 axes d'accompagnement -->
      <section v-if="content.b2c" v-reveal class="relative isolate overflow-hidden bg-orange-50">
        <InkBlob class="absolute -left-16 -bottom-10 -z-10 h-64 w-64 text-orange-400/10" />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.b2c.title" eyebrow="Particuliers" />
          <p
            v-if="content.b2c.text"
            class="mt-4 max-w-2xl text-lg leading-relaxed text-ink/70"
          >
            {{ content.b2c.text }}
          </p>
          <div
            v-if="content.b2c.cards.length"
            class="mt-10 grid max-w-3xl gap-6 sm:grid-cols-2"
          >
            <article
              v-for="(card, i) in content.b2c.cards"
              :key="i"
              class="rounded-3xl border border-orange-200/60 bg-white p-8 shadow-soft"
            >
              <h3 class="font-display text-xl font-bold text-ink">{{ card.title }}</h3>
              <p v-if="card.body" class="mt-2 leading-relaxed text-ink/65">{{ card.body }}</p>
            </article>
          </div>
          <div class="mt-10">
            <NuxtLink
              to="/particuliers"
              class="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-orange-600"
            >
              {{ content.b2c.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 9. Témoignage vedette — section masquée si absent -->
      <section
        v-if="content.featuredTestimonial"
        class="mx-auto max-w-3xl px-4 py-20"
        aria-label="Témoignage"
      >
        <p class="mb-6 text-sm font-semibold uppercase tracking-[0.12em] text-brand-accent">
          Elles &amp; ils en parlent
        </p>
        <TestimonialCard :testimonial="content.featuredTestimonial" />
      </section>

      <!-- 10. Ressources — 3 derniers articles, masquée si aucun -->
      <section v-if="content.articles.length" v-reveal class="relative isolate overflow-hidden bg-teal-50">
        <TentacleAccent
          name="tentacule-3-trait"
          class="absolute -left-20 -top-16 -z-10 hidden w-[28rem] text-teal-600/[0.07] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.resources.title" eyebrow="Ressources" :subtitle="content.resources.subtitle ?? undefined" />
          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard
              v-for="article in content.articles"
              :key="article.slug"
              :article="article"
            />
          </div>
          <div class="mt-10">
            <NuxtLink
              to="/ressources"
              class="inline-flex items-center gap-1.5 font-semibold text-teal-700 transition-colors hover:text-teal-800"
            >
              {{ content.resources.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 11. CTA final -->
      <section v-if="content.finalCta" v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <CtaBlock
          :title="content.finalCta.title"
          :description="content.finalCta.description ?? undefined"
          :cta-label="content.finalCta.label"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
