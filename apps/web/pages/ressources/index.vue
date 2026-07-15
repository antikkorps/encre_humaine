<script setup lang="ts">
// Page fusionnée « Les Tentacules » (blog + newsletter) — /ressources. Contenu depuis
// `resources_page` + articles publiés + `newsletter_page`, via l'endpoint caché
// `/api/content/resources`. Fonctionne avec 0 article (état vide propre). Filtres par
// groupe de catégorie (côté client). L'inscription passe par `NewsletterForm` (double
// opt-in) ; la landing `/newsletter` a été fusionnée ici (redirect 301).
const { data: content, error } = await useFetch("/api/content/resources", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Ressources");

// Filtre par groupe de catégorie (null = tout).
const activeGroup = ref<string | null>(null);
const visibleArticles = computed(() => {
  const all = content.value?.articles ?? [];
  return activeGroup.value ? all.filter((a) => a.categoryGroup === activeGroup.value) : all;
});
// Mots-clés du filtre actif (chrome de taxonomie) — masqué sur « Tout ».
const activeKeywords = computed(
  () => content.value?.filters.find((f) => f.group === activeGroup.value)?.keywords ?? null,
);

// Carrousel « Derniers contenus » (remplace la pagination numérotée) : défilement
// horizontal en scroll-snap **natif** — on hérite gratuitement du clavier, du tactile
// et de `prefers-reduced-motion`, sans dépendance. Le nombre de cartes visibles est
// piloté par la largeur des items (1 en mobile, 2 en tablette, 3 en desktop) : pour en
// afficher un autre nombre, il suffit de changer les classes `basis-*` de la liste.
const track = ref<HTMLElement | null>(null);
const atStart = ref(true);
const atEnd = ref(true);

function updateArrows() {
  const el = track.value;
  if (!el) return;
  // Tolérance d'1px : les navigateurs arrondissent scrollLeft en zoom non entier.
  atStart.value = el.scrollLeft <= 1;
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
}
function scrollByPage(direction: -1 | 1) {
  const el = track.value;
  if (!el) return;
  el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
}

// Au changement de filtre : retour au début (sinon on reste scrollé dans le vide).
watch(activeGroup, async () => {
  await nextTick();
  track.value?.scrollTo({ left: 0 });
  updateArrows();
});
onMounted(() => {
  updateArrows();
  window.addEventListener("resize", updateArrows, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("resize", updateArrows));

// Portes d'entrée « Explorer les Tentacules » : applique le filtre + descend
// jusqu'à la grille des publications.
function exploreGroup(group: string) {
  activeGroup.value = group;
  if (import.meta.client) {
    document.getElementById("tentacules")?.scrollIntoView({ behavior: "smooth" });
  }
}

useSeoMeta({
  title: () => content.value?.seo.title ?? `Les Tentacules — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Les Tentacules — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Hero (h1 + sous-titre + signature 🐙) -->
    <PageHero
      :title="heading"
      eyebrow="Les Tentacules"
      :body="content?.accrocheBody ?? undefined"
      variant="neutral"
    >
      <!-- Signature + double CTA dans la colonne de gauche (façon maquette). -->
      <div class="mt-8">
        <p
          v-if="content?.heroSignature"
          class="max-w-md whitespace-pre-line font-display text-lg font-medium leading-relaxed text-ink/80"
        >
          {{ content.heroSignature }}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink
            to="#explorer"
            class="inline-flex items-center gap-2 rounded-full bg-teal-700 px-6 py-3 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Explorer les ressources
            <span aria-hidden="true">→</span>
          </NuxtLink>
          <NuxtLink
            to="#newsletter"
            class="inline-flex items-center gap-2 rounded-full border border-teal-700/30 bg-white/70 px-6 py-3 font-semibold text-teal-800 shadow-soft transition-colors hover:border-teal-700/60 hover:bg-white"
          >
            Recevoir les Tentacules
          </NuxtLink>
        </div>
      </div>
      <!-- Grand poulpe encré à droite : silhouette pleine, teal semi-transparent. -->
      <template #aside>
        <div class="relative flex justify-center lg:justify-end" aria-hidden="true">
          <OctopusLogo
            class="h-[18rem] w-auto text-teal-700/45 sm:h-[22rem] lg:h-[32rem] lg:-mr-16 lg:translate-x-6"
          />
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
      <!-- 2. Explorer les Tentacules : 3 portes d'entrée par thème (cartes) -->
      <section
        v-if="content.filters.length"
        id="explorer"
        v-reveal
        class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16"
      >
        <SectionHeading title="Explorer les Tentacules" eyebrow="Accès aux contenus" align="center" />
        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <button
            v-for="filter in content.filters"
            :key="filter.group"
            type="button"
            class="group flex flex-col rounded-3xl border border-ink/5 bg-white p-7 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            @click="exploreGroup(filter.group)"
          >
            <span
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl ring-1 ring-teal-100"
              aria-hidden="true"
            >
              {{ filter.emoji }}
            </span>
            <h3 class="mt-4 font-display text-xl font-semibold text-ink">{{ filter.label }}</h3>
            <span aria-hidden="true" class="mt-2 h-px w-10 bg-orange-300"></span>
            <ul class="mt-4 flex flex-wrap gap-2">
              <li
                v-for="(kw, i) in filter.keywords.split('•')"
                :key="i"
                class="rounded-full border border-ink/10 px-3 py-1 text-xs font-medium text-ink/60"
              >
                {{ kw.trim() }}
              </li>
            </ul>
            <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
              Explorer
              <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </button>
        </div>
      </section>

      <!-- 3. À lire en premier (article vedette) — masqué si non défini -->
      <section v-if="content.featuredArticle" v-reveal class="mx-auto max-w-5xl px-4 py-16">
        <SectionHeading title="À lire en premier" eyebrow="Article mis en avant" />
        <NuxtLink
          :to="`/ressources/${content.featuredArticle.slug}`"
          class="mt-8 grid items-center gap-8 overflow-hidden rounded-3xl border border-ink/5 bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift md:grid-cols-2 md:p-8"
        >
          <NuxtImg
            v-if="content.featuredArticle.coverImage"
            :src="content.featuredArticle.coverImage"
            :alt="content.featuredArticle.coverAlt || content.featuredArticle.title"
            width="640"
            height="480"
            fit="cover"
            format="webp"
            sizes="100vw md:50vw lg:480px"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div>
            <p
              v-if="content.featuredArticle.categoryName"
              class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent"
            >
              <span aria-hidden="true" class="h-px w-5 bg-orange-300"></span>
              {{ content.featuredArticle.categoryName }}
            </p>
            <h3 class="mt-2 font-display text-2xl font-bold text-ink">
              {{ content.featuredArticle.title }}
            </h3>
            <p v-if="content.featuredArticle.excerpt" class="mt-3 leading-relaxed text-ink/65">
              {{ content.featuredArticle.excerpt }}
            </p>
            <span class="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-700">
              Lire l'article <span aria-hidden="true">→</span>
            </span>
          </div>
        </NuxtLink>
      </section>

      <!-- 4. Dernières publiées (grille + filtres) -->
      <section
        id="tentacules"
        class="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24"
        :class="content.featuredArticle ? '' : 'pt-4'"
      >
        <SectionHeading title="Dernières tentacules publiées" eyebrow="Derniers contenus" />

        <div v-if="content.filters.length" class="mt-6" role="group" aria-label="Filtrer par thème">
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              :class="activeGroup === null
                ? 'border-teal-700 bg-teal-700 text-white shadow-soft'
                : 'border-ink/15 text-ink/70 hover:border-teal-300 hover:bg-teal-50'"
              :aria-pressed="activeGroup === null"
              @click="activeGroup = null"
            >
              Tout
            </button>
            <button
              v-for="filter in content.filters"
              :key="filter.group"
              type="button"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              :class="activeGroup === filter.group
                ? 'border-teal-700 bg-teal-700 text-white shadow-soft'
                : 'border-ink/15 text-ink/70 hover:border-teal-300 hover:bg-teal-50'"
              :aria-pressed="activeGroup === filter.group"
              @click="activeGroup = filter.group"
            >
              <span aria-hidden="true">{{ filter.emoji }}</span> {{ filter.label }}
            </button>
          </div>
          <p v-if="activeKeywords" class="mt-3 text-sm text-ink/55">{{ activeKeywords }}</p>
        </div>

        <!-- État vide (0 article) : pas de section cassée -->
        <p
          v-if="!visibleArticles.length"
          class="mt-12 text-center text-ink/65"
          role="status"
        >
          Les premières tentacules arrivent bientôt. En attendant, inscrivez-vous à
          <NuxtLink to="#newsletter" class="text-teal-700 underline">la newsletter</NuxtLink>.
        </p>

        <!-- Carrousel : la liste défile, les flèches font défiler d'une « page » de
             cartes. `tabindex="0"` + `role="region"` → la zone est atteignable et
             défilable au clavier (exigence a11y d'un conteneur scrollable). -->
        <div v-else class="relative mt-10">
          <ul
            ref="track"
            tabindex="0"
            role="region"
            aria-label="Derniers contenus"
            class="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 [&::-webkit-scrollbar]:hidden"
            @scroll.passive="updateArrows"
          >
            <li
              v-for="article in visibleArticles"
              :key="article.slug"
              class="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
            >
              <ArticleCard :article="article" />
            </li>
          </ul>

          <nav
            v-if="!(atStart && atEnd)"
            class="mt-6 flex items-center justify-center gap-3"
            aria-label="Navigation du carrousel"
          >
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-teal-300 hover:bg-teal-50 disabled:opacity-40 disabled:hover:border-ink/15 disabled:hover:bg-transparent"
              :disabled="atStart"
              @click="scrollByPage(-1)"
            >
              <Icon name="material-symbols:arrow-back" class="h-5 w-5" aria-hidden="true" />
              <span class="sr-only">Contenus précédents</span>
            </button>
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink/70 transition-colors hover:border-teal-300 hover:bg-teal-50 disabled:opacity-40 disabled:hover:border-ink/15 disabled:hover:bg-transparent"
              :disabled="atEnd"
              @click="scrollByPage(1)"
            >
              <Icon name="material-symbols:arrow-forward" class="h-5 w-5" aria-hidden="true" />
              <span class="sr-only">Contenus suivants</span>
            </button>
          </nav>
        </div>
      </section>

      <!-- 5. Newsletter intégrée « Les Tentacules » — bandeau marine (maquette) -->
      <section id="newsletter" v-reveal class="relative isolate scroll-mt-24 overflow-hidden bg-teal-900">
        <OctopusWatermark
          class="absolute -bottom-16 -right-10 -z-10 hidden h-[24rem] rotate-[6deg] text-orange-300/[0.06] lg:block"
        />
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading
            :title="content.newsletter.name || 'Les Tentacules de L\'Encre Humaine'"
            :subtitle="content.newsletter.subtitle ?? undefined"
            eyebrow="🐙 Newsletter"
            tone="dark"
          />
          <div class="mt-10 grid gap-10 md:grid-cols-2">
            <div class="space-y-8">
              <div v-if="content.newsletter.helpsWith.length">
                <p class="font-display font-semibold text-paper">Chaque édition aide à :</p>
                <ul class="mt-3 space-y-2">
                  <li
                    v-for="(item, i) in content.newsletter.helpsWith"
                    :key="i"
                    class="flex items-start gap-2.5 text-paper/80"
                  >
                    <span class="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-800 text-xs font-bold text-orange-300 ring-1 ring-orange-300/30" aria-hidden="true">✓</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="content.newsletter.whatYouReceive.length">
                <p class="font-display font-semibold text-paper">Dans chaque édition :</p>
                <ul class="mt-3 space-y-2">
                  <li
                    v-for="(item, i) in content.newsletter.whatYouReceive"
                    :key="i"
                    class="flex items-start gap-2.5 text-paper/80"
                  >
                    <span class="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-800 text-xs font-bold text-orange-300 ring-1 ring-orange-300/30" aria-hidden="true">•</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-3xl border border-white/10 bg-white p-6 shadow-lift sm:p-8">
              <NewsletterForm submit-label="Recevoir les Tentacules" />
              <p
                v-if="content.newsletter.welcomeGiftLabel"
                class="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-ink/75"
              >
                <span aria-hidden="true">📘</span>
                <span class="font-semibold text-orange-700"> Offert à l'inscription : </span>
                {{ content.newsletter.welcomeGiftLabel }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. Positionnement — masqué si vide. Visuel optionnel à côté du texte (même
           trame que le portrait d'« À propos ») : sans photo, le texte reste en
           colonne simple plutôt que de s'étaler sur toute la largeur. -->
      <section v-if="content.positioning" v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <div
          class="grid items-center gap-10"
          :class="content.positioning.photo ? 'md:grid-cols-[1fr_0.8fr]' : ''"
        >
          <div :class="content.positioning.photo ? '' : 'max-w-3xl'">
            <SectionHeading
              :title="content.positioning.title || 'Une approche terrain'"
              eyebrow="Positionnement"
            />
            <RichText v-if="content.positioning.bodyHtml" :html="content.positioning.bodyHtml" class="mt-5" />
          </div>
          <NuxtImg
            v-if="content.positioning.photo"
            :src="content.positioning.photo.url"
            :alt="content.positioning.photo.alt"
            :width="content.positioning.photo.width ?? 720"
            :height="content.positioning.photo.height ?? 900"
            fit="cover"
            format="webp"
            sizes="100vw md:420px"
            loading="lazy"
            decoding="async"
            class="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </section>

      <!-- 7. CTA final → section newsletter -->
      <section v-reveal class="mx-auto max-w-6xl px-4 pb-24">
        <CtaBlock
          :title="content.ctaTitle || 'Commencer à y voir plus clair'"
          cta-label="S'inscrire aux prochaines Tentacules"
          to="#newsletter"
          variant="teal"
        />
      </section>
    </template>
  </div>
</template>
