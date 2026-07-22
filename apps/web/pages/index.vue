<script setup lang="ts">
// Accueil — docs/01-accueil.md. Contenu depuis `home_page` + 3 derniers articles
// + témoignage vedette, via l'endpoint serveur caché `/api/content/home` (le token
// Directus reste serveur). Rendu SSG/ISR. Les sections dynamiques se masquent
// proprement si vides ; en cas d'échec de fetch, message sobre (docs/00 §États).
//
// Design (refonte 2026-07, maquette Éléonore) : héro éditorial CLAIR aligné à
// gauche (titre navy + phrase signature dorée + micro-preuves + filigrane poulpe),
// « titres jaunes » (kickers dorés) sur chaque section, méthode sur fond sombre,
// portrait ovale à cadre doré. Le sombre se redistribue (héro clair, méthode + CTA
// final sombres). Voir mémoire [[encre-humaine-design-editorial]].
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
      signature: null,
      tagline: [] as string[],
      proofs: [] as string[],
      ctaPrimaryLabel: "Prendre rendez-vous",
      ctaSecondaryLabel: "Découvrir l'approche",
    },
);

// Met le dernier mot du titre en avant (souligné doré « encre ») — effet générique
// quel que soit le contenu Directus. Un seul mot → tout est mis en avant.
const heroTitle = computed(() => {
  const words = hero.value.title.trim().split(/\s+/);
  const tail = words.pop() ?? hero.value.title;
  // Espace inclus dans la valeur (interpolation) → non rogné par la condensation
  // de blancs des templates Vue.
  return { head: words.length ? `${words.join(" ")} ` : "", tail };
});

// Icônes cyclées sur les listes dynamiques (contenu Directus, nombre variable) :
// on remplace les puces/numéros par des pictos qui « parlent ». Cyclage modulo →
// robuste quel que soit le nombre d'items. ⚠️ Toute clé ajoutée ici doit figurer
// dans le clientBundle @nuxt/icon (nuxt.config.ts) sinon elle ne s'affiche pas.
const challengeIcons = [
  "material-symbols:psychology",
  "material-symbols:groups",
  "material-symbols:route",
  "material-symbols:insights",
  "material-symbols:schedule",
  "material-symbols:balance",
];
const buildIcons = [
  "material-symbols:visibility",
  "material-symbols:self-improvement",
  "material-symbols:timeline",
];
</script>

<template>
  <div>
    <!-- ============================================================= -->
    <!-- 1. HÉRO — sombre (marine), éditorial gauche (h1 = hero_title)  -->
    <!-- ============================================================= -->
    <section class="bg-ink-gradient relative isolate overflow-hidden text-paper">
      <!-- Filigrane poulpe doré, ample, à droite (accent identitaire). -->
      <OctopusWatermark
        class="pointer-events-none absolute -right-12 top-1/2 -z-10 hidden h-[44rem] -translate-y-1/2 text-sand-300/[0.10] lg:block"
      />
      <InkBlob class="absolute -left-20 top-10 -z-10 h-72 w-72 -rotate-45 text-teal-500/15" />
      <InkBlob class="absolute -bottom-12 right-1/4 -z-10 h-56 w-56 text-orange-400/10" />

      <div class="mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <div class="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <!-- Colonne texte (gauche) -->
          <div class="max-w-2xl">
            <p
              class="inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-4 py-1.5 text-sm font-medium text-paper/80"
            >
              <OctopusMark class="h-4 w-4 text-teal-300" />
              Conseil RH &amp; accompagnement
            </p>
            <h1
              class="mt-6 font-display text-4xl font-bold leading-[1.08] text-paper sm:text-5xl lg:text-[3.35rem]"
            >
              <span v-if="heroTitle.head">{{ heroTitle.head }}</span
              ><span class="ink-underline text-paper">{{ heroTitle.tail }}</span>
            </h1>
            <p
              v-if="hero.subtitle"
              class="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-paper/80"
            >
              {{ hero.subtitle }}
            </p>

            <!-- Phrase signature (doré, italique, guillemet) -->
            <blockquote
              v-if="hero.signature"
              class="mt-7 flex gap-3 border-l-2 border-sand-400 pl-4"
            >
              <span
                aria-hidden="true"
                class="-mt-1 font-display text-4xl leading-none text-sand-300"
                >“</span
              >
              <p class="font-display text-lg italic leading-relaxed text-paper/85">
                {{ hero.signature }}
              </p>
            </blockquote>

            <!-- Ligne d'expertise (domaines couverts) -->
            <p
              v-if="hero.tagline.length"
              class="mt-7 text-sm font-semibold uppercase tracking-[0.08em] text-teal-200/90"
            >
              {{ hero.tagline.join(" • ") }}
            </p>

            <div class="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <NuxtLink
                to="/contact"
                class="inline-flex items-center justify-center gap-2 rounded-full bg-paper px-6 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
              >
                {{ hero.ctaPrimaryLabel }}
                <span aria-hidden="true">↗</span>
              </NuxtLink>
              <a
                href="#approche"
                class="inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-6 py-3.5 font-semibold text-ink shadow-soft transition-colors hover:bg-sand-500"
              >
                {{ hero.ctaSecondaryLabel }}
              </a>
            </div>
          </div>

          <!-- Colonne droite : micro-preuves sur une carte givrée (ne pas les poser
               à même le filigrane poulpe → illisible). Le poulpe reste ambiant derrière. -->
          <div v-if="hero.proofs.length" class="lg:pl-6 lg:pt-16">
            <div
              class="rounded-3xl border border-paper/15 bg-paper/[0.06] p-6 shadow-soft backdrop-blur sm:p-8"
            >
              <p
                class="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sand-300"
              >
                <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-sand-400"></span>
                En pratique
              </p>
              <ul class="space-y-4">
                <li
                  v-for="proof in hero.proofs"
                  :key="proof"
                  class="flex items-start gap-3"
                >
                  <span
                    class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand-400/15 text-sand-300 ring-1 ring-inset ring-sand-400/40"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 12.5 10 17.5 19 7"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <span class="leading-relaxed text-paper/85">{{ proof }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
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
      <!-- 2. Bandeau de crédibilité (stats) — carte aérée, séparateurs dorés -->
      <section v-if="content.stats.length" class="bg-paper py-16 lg:py-20">
        <div class="mx-auto max-w-5xl px-4">
          <div
            class="rounded-3xl border border-ink/5 bg-white px-6 py-10 shadow-lift sm:px-10 lg:py-12"
          >
            <StatRow :stats="content.stats" />
          </div>
        </div>
      </section>

      <!-- 3. Les défis (« Vous vous reconnaissez ? ») -->
      <section v-if="content.recognition" class="relative isolate overflow-hidden bg-paper-2">
        <TentacleAccent
          name="tentacule-1-trait"
          class="absolute -right-16 -top-10 -z-10 hidden w-[26rem] rotate-12 text-teal-700/[0.06] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.recognition.title"
            :subtitle="content.recognition.subtitle ?? undefined"
            eyebrow="Les défis que rencontrent de nombreuses PME"
          />
          <ul
            v-if="content.recognition.items.length"
            class="mt-12 grid gap-4 sm:grid-cols-2"
          >
            <li
              v-for="(item, i) in content.recognition.items"
              :key="i"
              class="flex items-start gap-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-soft"
            >
              <span
                aria-hidden="true"
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sand-400/50 bg-orange-50 text-orange-600"
              >
                <Icon :name="challengeIcons[i % challengeIcons.length]!" class="h-5 w-5" />
              </span>
              <span class="leading-relaxed text-ink/75">{{ item }}</span>
            </li>
          </ul>
          <p
            v-if="content.recognition.conclusion"
            class="mx-auto mt-12 max-w-3xl whitespace-pre-line text-center font-display text-xl italic leading-relaxed text-teal-800"
          >
            {{ content.recognition.conclusion }}
          </p>
        </div>
      </section>

      <!-- 4. Ce que je vous aide à construire (#offres) -->
      <section
        v-if="content.build"
        id="offres"
        v-reveal
        class="relative isolate scroll-mt-24 overflow-hidden bg-paper"
      >
        <TentacleAccent
          name="tentacule-4-plein"
          class="absolute -left-24 top-10 -z-10 hidden w-[28rem] -rotate-6 text-teal-600/[0.05] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.build.title" eyebrow="Ce que je vous aide à construire" />
          <div class="mt-12 grid gap-6 md:grid-cols-3">
            <article
              v-for="(block, i) in content.build.blocks"
              :key="i"
              class="flex flex-col rounded-3xl border border-ink/5 bg-white p-8 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span
                aria-hidden="true"
                class="grid h-12 w-12 place-items-center rounded-full bg-teal-800 text-sand-300"
              >
                <Icon :name="buildIcons[i % buildIcons.length]!" class="h-6 w-6" />
              </span>
              <h3 class="mt-5 font-display text-xl font-bold text-ink">{{ block.title }}</h3>
              <p v-if="block.body" class="mt-3 flex-1 leading-relaxed text-ink/65">
                {{ block.body }}
              </p>
            </article>
          </div>
          <div v-if="content.build.ctaLabel" class="mt-12">
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

      <!-- 5. Ma méthode (#approche) — fond sombre + timeline dorée numérotée -->
      <section
        v-if="content.method"
        id="approche"
        v-reveal
        class="bg-ink-gradient relative isolate scroll-mt-24 overflow-hidden text-paper"
      >
        <TentacleAccent
          name="tentacule-5-plein"
          class="absolute -right-20 -top-16 -z-10 hidden w-[28rem] text-sand-300/[0.06] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20 lg:py-24">
          <!-- Titre + intro en pleine largeur (demande Éléonore : « prendre la page »). -->
          <SectionHeading
            :title="content.method.title"
            :subtitle="content.method.subtitle ?? undefined"
            eyebrow="Ma méthode"
            tone="dark"
            wide
          />
          <!-- Frise centrée dans la page : étapes numérotées, contenu sous chaque pastille. -->
          <ol class="mx-auto mt-14 grid max-w-5xl gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="(step, i) in content.method.steps" :key="i" class="relative text-center">
              <!-- Filet doré reliant les pastilles centrées (desktop). -->
              <span
                v-if="i < content.method.steps.length - 1"
                aria-hidden="true"
                class="absolute left-1/2 top-6 hidden h-px w-[calc(100%+2rem)] bg-sand-400/30 lg:block"
              ></span>
              <span
                aria-hidden="true"
                class="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand-400 font-display text-lg font-bold text-ink-900"
              >
                {{ i + 1 }}
              </span>
              <h3 class="mt-5 font-display text-lg font-bold text-paper">{{ step.title }}</h3>
              <p v-if="step.body" class="mt-2 text-center leading-relaxed text-paper/70">
                {{ step.body }}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 6. L'Encre Humaine (signature / positionnement) -->
      <section v-if="content.why" v-reveal class="relative isolate overflow-hidden bg-paper-2">
        <InkBlob class="absolute -right-24 -top-16 -z-10 h-80 w-80 text-teal-500/[0.08]" />
        <TentacleAccent
          name="tentacule-1-plein"
          class="absolute -left-24 bottom-4 -z-10 hidden w-[26rem] -rotate-3 text-teal-600/[0.05] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.why.title"
            :subtitle="content.why.subtitle ?? undefined"
            eyebrow="L'Encre Humaine"
          />
          <div class="mt-12 grid gap-10 lg:grid-cols-[1.55fr_0.85fr] lg:items-center">
            <div class="grid gap-6 sm:grid-cols-3">
              <article v-for="(item, i) in content.why.items" :key="i">
                <span
                  aria-hidden="true"
                  class="block h-1.5 w-10 rounded-full bg-sand-400"
                ></span>
                <h3 class="mt-4 font-display text-lg font-bold text-ink">{{ item.title }}</h3>
                <p v-if="item.body" class="mt-2 leading-relaxed text-ink/65">{{ item.body }}</p>
              </article>
            </div>
            <blockquote
              v-if="content.why.conclusion"
              class="relative rounded-3xl border border-sand-400/30 bg-white/70 p-8 shadow-soft backdrop-blur"
            >
              <span
                aria-hidden="true"
                class="absolute -top-4 left-6 font-display text-6xl leading-none text-sand-400/70"
                >“</span
              >
              <p
                class="relative whitespace-pre-line font-display text-lg italic leading-relaxed text-teal-800"
              >
                {{ content.why.conclusion }}
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <!-- 7. Derrière l'Encre Humaine — portrait ovale cadre doré -->
      <section v-if="content.intro" v-reveal class="relative isolate overflow-hidden bg-paper">
        <TentacleAccent
          name="tentacule-2-trait"
          class="absolute -left-16 bottom-0 -z-10 hidden w-[32rem] rotate-6 text-teal-700/[0.06] lg:block"
        />
        <div class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-[0.85fr_1.15fr]">
          <!-- Portrait ovale, cadre doré, désaturé (style maquette). -->
          <div v-if="content.intro.photo" class="flex flex-col items-center">
            <div class="relative w-full max-w-xs">
              <NuxtImg
                :src="content.intro.photo.url"
                :alt="content.intro.photo.alt"
                :width="content.intro.photo.width ?? 640"
                :height="content.intro.photo.height ?? 800"
                fit="cover"
                format="webp"
                sizes="100vw md:340px"
                loading="lazy"
                decoding="async"
                class="aspect-[4/5] w-full rounded-[48%] object-cover shadow-lift ring-4 ring-sand-400/60 ring-offset-4 ring-offset-paper [filter:grayscale(0.85)]"
              />
            </div>
            <NuxtLink
              to="/a-propos"
              class="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-400 px-6 py-3 font-semibold text-ink shadow-soft transition-colors hover:bg-sand-500"
            >
              {{ content.intro.ctaLabel }}
              <span aria-hidden="true">↗</span>
            </NuxtLink>
          </div>
          <div :class="content.intro.photo ? '' : 'md:col-span-2 max-w-3xl'">
            <p
              class="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-600 ring-1 ring-inset ring-orange-300/50"
            >
              <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-sand-400"></span>
              Derrière l'Encre Humaine
            </p>
            <h2 class="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
              {{ content.intro.title }}
            </h2>
            <p
              v-if="content.intro.text"
              class="mt-5 whitespace-pre-line text-lg leading-relaxed text-ink/70"
            >
              {{ content.intro.text }}
            </p>
          </div>
        </div>
      </section>

      <!-- 8. Pour les particuliers — 2 axes d'accompagnement (registre chaud) -->
      <section v-if="content.b2c" v-reveal class="relative isolate overflow-hidden bg-orange-50">
        <InkBlob class="absolute -left-16 -bottom-10 -z-10 h-64 w-64 text-orange-400/10" />
        <TentacleAccent
          name="tentacule-4-trait"
          class="absolute -right-20 top-6 -z-10 hidden w-[26rem] rotate-6 text-orange-400/[0.10] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.b2c.title" eyebrow="Pour les particuliers" />
          <p
            v-if="content.b2c.text"
            class="mt-5 max-w-2xl text-lg leading-relaxed text-ink/70"
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
              class="rounded-3xl border border-orange-200/70 bg-white p-8 shadow-soft"
            >
              <span
                aria-hidden="true"
                class="grid h-10 w-10 place-items-center rounded-full bg-orange-100 font-display text-base font-bold text-orange-600 ring-1 ring-inset ring-orange-300/50"
              >
                {{ i + 1 }}
              </span>
              <h3 class="mt-4 font-display text-xl font-bold text-ink">{{ card.title }}</h3>
              <p v-if="card.body" class="mt-2 leading-relaxed text-ink/65">{{ card.body }}</p>
            </article>
          </div>
          <div class="mt-10">
            <NuxtLink
              to="/particuliers"
              class="inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-colors hover:bg-sand-500"
            >
              {{ content.b2c.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 9. Témoignage vedette — gardé mais masqué tant qu'aucun avis (Éléonore). -->
      <section
        v-if="content.featuredTestimonial"
        class="mx-auto max-w-3xl px-4 py-20"
        aria-label="Témoignage"
      >
        <p
          class="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-600 ring-1 ring-inset ring-orange-300/50"
        >
          <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-sand-400"></span>
          Elles &amp; ils en parlent
        </p>
        <TestimonialCard :testimonial="content.featuredTestimonial" />
      </section>

      <!-- 10. Les Tentacules — 3 derniers articles, masquée si aucun -->
      <section
        v-if="content.articles.length"
        v-reveal
        class="relative isolate overflow-hidden bg-teal-50"
      >
        <TentacleAccent
          name="tentacule-3-trait"
          class="absolute -left-20 -top-16 -z-10 hidden w-[28rem] text-teal-600/[0.07] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.resources.title"
            eyebrow="🐙 Les Tentacules de L'Encre Humaine"
            :subtitle="content.resources.subtitle ?? undefined"
          />
          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ArticleCard
              v-for="article in content.articles"
              :key="article.slug"
              :article="article"
            />
          </div>
          <div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            <NuxtLink
              to="/ressources"
              class="inline-flex items-center gap-1.5 font-semibold text-teal-700 transition-colors hover:text-teal-800"
            >
              {{ content.resources.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
            <NuxtLink
              to="/ressources#newsletter"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
            >
              🐙 Recevoir les prochaines Tentacules
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- 11. CTA final -->
      <section
        v-if="content.finalCta"
        v-reveal
        class="relative isolate mx-auto max-w-6xl overflow-hidden px-4 py-20"
      >
        <TentacleAccent
          name="tentacule-5-trait"
          class="absolute -left-16 top-1/2 -z-10 hidden w-[24rem] -translate-y-1/2 -rotate-6 text-teal-600/[0.05] lg:block"
        />
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
