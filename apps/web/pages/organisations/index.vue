<script setup lang="ts">
// Hub Organisations (B2B) — docs/03-organisations-hub.md. Contenu depuis
// `org_hub_page` + offres (audience=organisation) + témoignages b2b, via
// l'endpoint serveur caché `/api/content/org-hub`. Rendu SSG/ISR. La page
// oriente (résumé + lien par offre), elle ne détaille pas. Sections vides
// masquées ; en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/org-hub", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Pour les organisations");

useSeoMeta({
  title: () => content.value?.seo.title ?? `Pour les organisations — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Pour les organisations — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche B2B — hero 2 colonnes : discours à gauche, carte « constat » à droite -->
    <PageHero
      :title="heading"
      :body="content?.accrocheSubtitle ?? undefined"
      variant="teal"
    >
      <template v-if="content?.accrocheBody" #aside>
        <figure
          class="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white/70 p-8 shadow-lift backdrop-blur-sm"
        >
          <div class="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100/70" aria-hidden="true"></div>
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

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- Illustration d'accroche optionnelle (Directus) — masquée si absente. -->
      <section v-if="content.accrochePhoto" class="mx-auto max-w-5xl px-4 pt-12">
        <NuxtImg
          :src="content.accrochePhoto.url"
          :alt="content.accrochePhoto.alt"
          :width="content.accrochePhoto.width ?? 1120"
          :height="content.accrochePhoto.height ?? 490"
          fit="cover"
          format="webp"
          sizes="100vw lg:1024px"
          loading="lazy"
          decoding="async"
          class="aspect-[16/7] w-full rounded-3xl object-cover shadow-lift"
        />
      </section>

      <!-- Phrase signature → bandeau marine + CTA doré -->
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
            Prendre rendez-vous
            <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
          </NuxtLink>
        </div>
      </section>

      <!-- 2. Ce que j'observe -->
      <section v-if="content.observe" v-reveal class="bg-paper-2">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.observe.title || 'Ce que j\'observe'"
            :subtitle="content.observe.intro ?? undefined"
            eyebrow="Ce que j'observe le plus souvent"
          />
          <div v-if="content.observe.items.length" class="mt-10 grid gap-6 sm:grid-cols-2">
            <article
              v-for="(item, i) in content.observe.items"
              :key="i"
              class="rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
            >
              <span
                class="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200"
              >
                <Icon :name="`material-symbols:${item.icon || 'insights'}`" class="h-6 w-6" />
              </span>
              <h3 v-if="item.title" class="mt-4 font-display text-lg font-semibold text-ink">
                {{ item.title }}
              </h3>
              <p v-if="item.body" class="mt-2 leading-relaxed text-ink/65">{{ item.body }}</p>
            </article>
          </div>
          <p
            v-if="content.observe.conclusion"
            class="mt-10 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-ink/80"
          >
            {{ content.observe.conclusion }}
          </p>
        </div>
      </section>

      <!-- 3. Les offres B2B. Si les « trois enjeux » sont renseignés (cartes
           détaillées, même trame que les particuliers), ils priment ; sinon on
           retombe sur les cartes compactes dynamiques (`offers`). -->
      <section
        v-if="content.situations.length"
        v-reveal
        class="mx-auto max-w-6xl px-4 py-20"
      >
        <SectionHeading
          :title="content.situationsTitle || 'Trois enjeux, trois accompagnements'"
          :subtitle="content.situationsIntro ?? undefined"
          eyebrow="Comment je peux vous aider"
        />
        <div class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(situation, i) in content.situations"
            :key="i"
            class="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white p-8 pl-9 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1.5 bg-teal-500"></span>
            <h3 class="font-display text-2xl font-bold text-ink">{{ situation.title }}</h3>
            <p
              v-if="situation.body"
              class="mt-3 whitespace-pre-line leading-relaxed text-ink/65"
            >
              {{ situation.body }}
            </p>
            <div v-if="situation.audience" class="mt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-teal-700">Pour qui ?</p>
              <p class="mt-1 whitespace-pre-line leading-relaxed text-ink/70">
                {{ situation.audience }}
              </p>
            </div>
            <div v-if="situation.items.length" class="mt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Ce que nous travaillons
              </p>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="(item, j) in situation.items"
                  :key="j"
                  class="flex items-start gap-2.5 text-ink/75"
                >
                  <Icon
                    name="material-symbols:check-circle-rounded"
                    class="mt-0.5 h-5 w-5 flex-none text-teal-500"
                  />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
            <!-- Pied de carte (résultat + CTA) poussé en bas → aligné entre les cartes -->
            <div v-if="situation.result || situation.ctaLabel" class="mt-auto pt-6">
              <p
                v-if="situation.result"
                class="rounded-2xl bg-teal-50 p-4 text-sm leading-relaxed text-ink/75"
              >
                <span class="font-semibold text-teal-700">Résultat — </span>{{ situation.result }}
              </p>
              <NuxtLink
                v-if="situation.ctaLabel"
                :to="situation.ctaLink"
                class="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-teal-700"
                :class="situation.result ? 'mt-5' : ''"
              >
                {{ situation.ctaLabel }}
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </div>
          </article>
        </div>
      </section>
      <section
        v-else-if="content.offers.length"
        v-reveal
        class="mx-auto max-w-6xl px-4 py-20"
      >
        <SectionHeading :title="content.offersTitle" eyebrow="Comment je peux vous aider" />
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <OfferCard v-for="offer in content.offers" :key="offer.slug" :offer="offer" />
        </div>
      </section>

      <!-- 4. Ma façon de travailler -->
      <section v-if="content.method" v-reveal class="bg-teal-50">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading
            :title="content.method.title || 'Ma façon de travailler'"
            :subtitle="content.method.intro ?? undefined"
            eyebrow="Ma façon de travailler"
          />
          <ol class="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <li v-for="(step, i) in content.method.steps" :key="i">
              <span class="font-display text-4xl font-bold text-orange-300" aria-hidden="true">
                {{ String(Number(step.number) || i + 1).padStart(2, "0") }}
              </span>
              <h3 v-if="step.title" class="mt-4 font-display text-lg font-semibold text-ink">
                {{ step.title }}
              </h3>
              <p v-if="step.description" class="mt-2 text-sm leading-relaxed text-ink/65">
                {{ step.description }}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 5. Ce qui différencie mon approche -->
      <section v-if="content.differentiator" v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <div class="max-w-3xl">
          <SectionHeading :title="content.differentiator.title || 'Mon approche'" eyebrow="Ce qui différencie mon approche" />
          <RichText :html="content.differentiator.bodyHtml" class="mt-5" />
        </div>
      </section>

      <!-- 6. Cet accompagnement est fait pour vous si… -->
      <section v-if="content.audience" v-reveal class="bg-teal-50">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <div class="max-w-3xl">
            <SectionHeading :title="content.audience.title || 'Pour qui ?'" eyebrow="Cet accompagnement est fait pour vous si…" />
            <ul v-if="content.audience.items.length" class="mt-8 space-y-3">
              <li
                v-for="(item, i) in content.audience.items"
                :key="i"
                class="flex items-start gap-3 text-ink/80"
              >
                <Icon
                  name="material-symbols:check-circle-rounded"
                  class="mt-0.5 h-5 w-5 flex-none text-orange-500"
                />
                <span>{{ item }}</span>
              </li>
            </ul>
            <p
              v-if="content.audience.conclusion"
              class="mt-8 whitespace-pre-line leading-relaxed text-ink/80"
            >
              {{ content.audience.conclusion }}
            </p>
          </div>
        </div>
      </section>

      <!-- 7. Témoignages B2B — masqués si vides -->
      <section
        v-if="content.testimonials.length"
        v-reveal
        class="bg-paper-2"
        aria-label="Témoignages"
      >
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.testimonialsTitle" eyebrow="Témoignages" />
          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              v-for="(testimonial, i) in content.testimonials"
              :key="i"
              :testimonial="testimonial"
            />
          </div>
        </div>
      </section>

      <!-- 8. CTA final (bandeau marine mutualisé) -->
      <section v-reveal class="mx-auto max-w-6xl px-4 py-16">
        <CtaBanner
          :title="content.cta.title"
          :body="content.cta.body ?? undefined"
          :cta-label="content.cta.label"
          to="/contact"
          :subtext="content.cta.subtext ?? undefined"
        />
      </section>
    </template>
  </div>
</template>
