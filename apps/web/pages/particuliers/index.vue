<script setup lang="ts">
// Hub Particuliers (B2C) — docs/04-particuliers-hub.md. Contenu depuis
// `b2c_hub_page` + faq_items (scope=b2c) + témoignage b2c, via l'endpoint
// serveur caché `/api/content/b2c-hub` (rich text déjà assaini serveur).
// Ton empathique, accent orange. 9 sections ; sections vides masquées ;
// échec → message sobre (panne transitoire ≠ page inexistante).
const { data: content, error } = await useFetch("/api/content/b2c-hub", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Pour les particuliers");

useSeoMeta({
  title: () => content.value?.seo.title ?? `Pour les particuliers — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Pour les particuliers — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche empathique — hero 2 colonnes : discours à gauche, carte « constat » à droite -->
    <PageHero
      :title="heading"
      eyebrow="Particuliers"
      :body="content?.accrocheSubtitle ?? undefined"
      variant="neutral"
      tentacle-side="left"
    >
      <template v-if="content?.accrocheBody" #aside>
        <figure
          class="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white/70 p-8 shadow-lift backdrop-blur-sm"
        >
          <div class="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100/70" aria-hidden="true"></div>
          <span
            class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-900 text-orange-300 shadow-soft"
          >
            <Icon name="material-symbols:forum" class="h-6 w-6" />
          </span>
          <p class="relative mt-5 whitespace-pre-line text-[1.05rem] leading-relaxed text-ink/75">
            {{ content.accrocheBody }}
          </p>
        </figure>
      </template>

      <!-- Phrase signature + CTA intégrés au hero, SOUS les deux colonnes
           (demande Éléonore : plus de section à part). Marine en dégradé, comme
           le hero de l'accueil, et non plus le marine très sombre. -->
      <template v-if="content?.accrocheSignature || content?.accrocheCtaLabel" #below>
        <div
          class="bg-ink-gradient relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl p-8 shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-10"
        >
          <InkBlob class="absolute -right-10 -top-14 -z-10 h-56 w-56 text-orange-400/10" />
          <p
            v-if="content.accrocheSignature"
            class="max-w-2xl whitespace-pre-line text-left font-display text-xl font-medium leading-relaxed text-paper"
          >
            <Icon name="material-symbols:format-quote" class="mb-1 block h-8 w-8 text-orange-300" />
            {{ content.accrocheSignature }}
          </p>
          <NuxtLink
            v-if="content.accrocheCtaLabel"
            to="/contact"
            class="inline-flex flex-none items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {{ content.accrocheCtaLabel }}
            <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
          </NuxtLink>
        </div>
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

      <!-- 2. Ce que vous venez chercher (bénéfices) — cartes centrées dans la
           page (5 blocs : la dernière rangée ne doit pas rester ferrée à gauche). -->
      <section v-if="content.outcomes.length" v-reveal class="relative isolate overflow-hidden bg-orange-50">
        <TentacleAccent
          name="tentacule-1-trait"
          class="absolute -scale-x-100 -right-16 -top-10 -z-10 hidden w-[26rem] rotate-12 text-orange-500/[0.08] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.outcomesTitle || 'Ce que vous venez chercher'"
            :subtitle="content.outcomesIntro ?? undefined"
            eyebrow="Ce que vous venez chercher (et ce que vous trouvez)"
          />
          <ul class="mt-10 flex flex-wrap justify-center gap-6">
            <li
              v-for="(outcome, i) in content.outcomes"
              :key="i"
              class="w-full rounded-3xl border border-ink/5 bg-white p-7 shadow-soft sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <span
                class="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200"
              >
                <Icon :name="`material-symbols:${outcome.icon || 'check-circle'}`" class="h-6 w-6" />
              </span>
              <h3 v-if="outcome.title" class="mt-4 font-display text-lg font-semibold text-ink">
                {{ outcome.title }}
              </h3>
              <p v-if="outcome.body" class="mt-2 leading-relaxed text-ink/65">{{ outcome.body }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- 3. Deux situations, deux accompagnements (cartes détaillées) -->
      <section v-if="content.situations.length" v-reveal class="relative isolate overflow-hidden">
        <TentacleAccent
          name="tentacule-4-plein"
          class="absolute -left-24 top-10 -z-10 hidden w-[28rem] -rotate-6 text-teal-600/[0.05] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.situationsTitle || 'Où en êtes-vous ?'"
            :subtitle="content.situationsIntro ?? undefined"
            eyebrow="Deux situations, deux accompagnements"
          />
          <div class="mt-10 grid gap-6 md:grid-cols-2">
            <article
              v-for="(situation, i) in content.situations"
              :key="i"
              class="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white p-8 pl-9 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1.5 bg-orange-400"></span>
              <h2 class="font-display text-2xl font-bold text-ink">{{ situation.title }}</h2>
              <p
                v-if="situation.body"
                class="mt-3 whitespace-pre-line leading-relaxed text-ink/65"
              >
                {{ situation.body }}
              </p>
              <div v-if="situation.audience" class="mt-5">
                <p class="text-xs font-semibold uppercase tracking-wide text-orange-600">Pour qui ?</p>
                <p class="mt-1 whitespace-pre-line leading-relaxed text-ink/70">
                  {{ situation.audience }}
                </p>
              </div>
              <div v-if="situation.items.length" class="mt-5">
                <p class="text-xs font-semibold uppercase tracking-wide text-orange-600">
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
                      class="mt-0.5 h-5 w-5 flex-none text-orange-500"
                    />
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
              <!-- Pied de carte (résultat + CTA) poussé en bas → aligné entre les cartes -->
              <div v-if="situation.result || situation.ctaLabel" class="mt-auto pt-6">
                <p
                  v-if="situation.result"
                  class="rounded-2xl bg-orange-50 p-4 text-sm leading-relaxed text-ink/75"
                >
                  <span class="font-semibold text-orange-700">Résultat : </span>{{ situation.result }}
                </p>
                <NuxtLink
                  v-if="situation.ctaLabel"
                  :to="situation.ctaLink"
                  class="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-orange-600"
                  :class="situation.result ? 'mt-5' : ''"
                >
                  {{ situation.ctaLabel }}
                  <span aria-hidden="true">→</span>
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- 4. Ma façon d'accompagner — fond marine (demande Éléonore) et encadré
           signature déplacé À DROITE du texte. -->
      <section
        v-if="content.howIWorkHtml || content.howIWorkSignature"
        v-reveal
        class="bg-ink-gradient relative isolate overflow-hidden text-paper"
      >
        <TentacleAccent
          name="tentacule-5-plein"
          class="absolute -scale-x-100 -right-20 -top-16 -z-10 hidden w-[28rem] text-sand-300/[0.06] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <div class="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <SectionHeading
                :title="content.howIWorkTitle || 'Ma façon d\'accompagner'"
                eyebrow="Ma façon d'accompagner"
                tone="dark"
              />
              <RichText
                v-if="content.howIWorkHtml"
                :html="content.howIWorkHtml"
                class="rich-text-invert mt-5"
              />
            </div>
            <aside
              v-if="content.howIWorkSignature"
              class="rounded-3xl border border-paper/15 bg-paper/[0.06] p-7 shadow-soft backdrop-blur lg:sticky lg:top-28"
            >
              <Icon name="material-symbols:format-quote" class="h-7 w-7 text-orange-300" />
              <p
                class="mt-2 whitespace-pre-line text-left font-display text-lg leading-relaxed text-paper/90"
              >
                {{ content.howIWorkSignature }}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <!-- 5. Pourquoi cet accompagnement est différent -->
      <section
        v-if="content.whyDifferentHtml"
        v-reveal
        class="relative isolate overflow-hidden"
      >
        <TentacleAccent
          name="tentacule-2-trait"
          class="absolute -left-16 bottom-0 -z-10 hidden w-[32rem] rotate-6 text-teal-700/[0.06] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <div class="max-w-3xl">
            <SectionHeading :title="content.whyDifferentTitle || 'Pourquoi c\'est différent'" eyebrow="Pourquoi cet accompagnement est différent ?" />
            <RichText :html="content.whyDifferentHtml" class="mt-5" />
          </div>
        </div>
      </section>

      <!-- 6. Comment se déroule l'accompagnement (format + texte) -->
      <section
        v-if="content.formatItems.length || content.formatBody"
        v-reveal
        class="relative isolate overflow-hidden bg-paper-2"
      >
        <TentacleAccent
          name="tentacule-3-trait"
          class="absolute -right-16 top-8 -z-10 hidden w-[28rem] -scale-x-100 rotate-6 text-teal-700/[0.06] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <div class="max-w-3xl">
            <SectionHeading :title="content.formatTitle || 'Comment se déroule l\'accompagnement'" eyebrow="Comment se déroule l'accompagnement ?" />
            <ul v-if="content.formatItems.length" class="mt-8 space-y-3">
              <li
                v-for="(item, i) in content.formatItems"
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
              v-if="content.formatBody"
              class="mt-8 whitespace-pre-line leading-relaxed text-ink/75"
            >
              {{ content.formatBody }}
            </p>
          </div>
        </div>
      </section>

      <!-- 7. FAQ (faq_items scope=b2c) — colonne centrée dans la page -->
      <section v-if="content.faq.length" v-reveal class="relative isolate overflow-hidden bg-orange-50">
        <TentacleAccent
          name="tentacule-4-trait"
          class="absolute -left-20 top-8 -z-10 hidden w-[26rem] rotate-6 text-orange-500/[0.08] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20">
          <div class="mx-auto max-w-3xl">
            <SectionHeading title="Questions fréquentes" eyebrow="FAQ" align="center" />
            <div class="mt-10">
              <FaqAccordion :items="content.faq" />
            </div>
          </div>
        </div>
      </section>

      <!-- 8. Témoignages (centralisés, audience=particulier) — masqué si vide -->
      <section
        v-if="content.testimonials.length"
        v-reveal
        class="relative isolate overflow-hidden"
        aria-label="Témoignages"
      >
        <TentacleAccent
          name="tentacule-1-plein"
          class="absolute -scale-x-100 -right-24 bottom-4 -z-10 hidden w-[26rem] rotate-3 text-teal-600/[0.05] lg:block"
        />
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading title="Ce qu'en disent les personnes accompagnées" eyebrow="Témoignages" />
          <div class="mt-10 grid gap-6 md:grid-cols-2">
            <TestimonialCard
              v-for="(testimonial, i) in content.testimonials"
              :key="i"
              :testimonial="testimonial"
            />
          </div>
        </div>
      </section>

      <!-- 9. Appel à l'action — même bloc que l'accueil (dégradé marine + les
           deux bulles, bouton doré) plutôt que le bandeau marine très sombre. -->
      <section v-reveal class="relative isolate mx-auto max-w-6xl overflow-hidden px-4 py-20">
        <TentacleAccent
          name="tentacule-5-trait"
          class="absolute -left-16 top-1/2 -z-10 hidden w-[24rem] -translate-y-1/2 -rotate-6 text-teal-600/[0.05] lg:block"
        />
        <CtaBlock
          :title="content.ctaTitle || 'Et si vous vous accordiez un espace pour y voir plus clair ?'"
          :description="content.ctaBody ?? undefined"
          :cta-label="content.ctaLabel"
          :subtext="content.ctaSubtext ?? undefined"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
