<script setup lang="ts">
// « Tous les articles » — /ressources/tous.
//
// Page de PARCOURS exhaustif du blog, complémentaire de /ressources : cette
// dernière ne montre plus que les 3 dernières publications en carrousel (pour
// que l'appel à l'action reste visible sans défiler, demande Éléonore du
// 2026-08-06) ; ici on retrouve TOUT — recherche plein texte, filtres par thème
// et chargement au défilement. Aucun article n'est donc hors d'atteinte.
//
// Même endpoint que /ressources (`/api/content/resources`, caché 60 s) : pas de
// second contrat d'API à maintenir, et le cache est partagé entre les deux pages.
// Tous les articles étant déjà dans la charge utile, « charger plus » n'est
// qu'un compteur — aucun aller-retour réseau, donc aucun état de chargement.
//
// ⚠️ Route statique : elle prime sur `/ressources/[slug]`. Un article dont le
// slug serait littéralement « tous » deviendrait inaccessible.
const { data: content, error } = await useFetch("/api/content/resources", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";

/** Articles ajoutés à chaque palier (3 rangées de 3 sur grand écran). */
const BATCH = 9;

const search = ref("");
const activeGroup = ref<string | null>(null);
const shown = ref(BATCH);

/** Comparaison insensible à la casse ET aux accents (« référentiel » ≡ « referentiel »). */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const query = computed(() => fold(search.value.trim()));

const filteredArticles = computed(() => {
  let list = content.value?.articles ?? [];
  if (activeGroup.value) list = list.filter((a) => a.categoryGroup === activeGroup.value);
  if (query.value) {
    list = list.filter((a) =>
      fold([a.title, a.excerpt ?? "", a.categoryName ?? ""].join(" ")).includes(query.value),
    );
  }
  return list;
});

const visibleArticles = computed(() => filteredArticles.value.slice(0, shown.value));
const hasMore = computed(() => shown.value < filteredArticles.value.length);

/** Changer de thème ou de recherche relance la liste depuis le début. */
watch([activeGroup, query], () => {
  shown.value = BATCH;
});

function showMore() {
  shown.value += BATCH;
}

// Chargement au défilement : l'IntersectionObserver ne fait qu'AUTOMATISER le
// bouton ci-dessous, qui reste le vrai contrôle (clavier, lecteurs d'écran, et
// utilisateurs qui n'atteignent jamais la sentinelle). Observer natif : pas de
// dépendance ajoutée pour ça.
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && hasMore.value) showMore();
    },
    { rootMargin: "400px" },
  );
  // Réarmement après CHAQUE palier : un observer ne notifie que les
  // *changements* d'intersection. Sans cela, une sentinelle restée visible
  // après le chargement ne redéclenche rien et la liste se fige en cours de
  // route (constaté : blocage à 18 articles sur 21).
  watch(
    [sentinel, shown],
    async () => {
      await nextTick();
      observer?.disconnect();
      if (sentinel.value) observer?.observe(sentinel.value);
    },
    { immediate: true },
  );
});

onBeforeUnmount(() => observer?.disconnect());

useSeoMeta({
  title: () => `Tous les articles — ${siteName}`,
  description: () =>
    "Toutes les publications des Tentacules de L'Encre Humaine : réflexions, outils et retours de terrain sur les ressources humaines et les transitions professionnelles.",
  ogTitle: () => `Tous les articles — ${siteName}`,
  ogType: "website",
});
</script>

<template>
  <div>
    <PageHero
      title="Tous les articles"
      eyebrow="🐙 Les Tentacules de L'Encre Humaine"
      body="Réflexions, outils et retours de terrain — l'ensemble des publications, à parcourir par thème ou par mot-clé."
      variant="neutral"
      tentacle-side="right"
    />

    <p v-if="error" class="mx-auto max-w-6xl px-4 py-20 text-ink/65" role="status">
      Les articles sont momentanément indisponibles. Merci de réessayer dans un instant.
    </p>

    <section v-else-if="content" class="relative isolate overflow-hidden">
      <TentacleAccent
        side="left"
        name="tentacule-3-trait"
        class="absolute -left-20 top-10 -z-10 hidden w-[28rem] rotate-6 text-teal-700/[0.06] lg:block"
      />
      <div class="mx-auto max-w-6xl px-4 py-16">
        <!-- Recherche : filtre le titre, le chapô et le nom de catégorie. -->
        <div class="relative max-w-md">
          <label for="ra-search" class="sr-only">Rechercher un article</label>
          <Icon
            name="material-symbols:search"
            class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
          <input
            id="ra-search"
            v-model="search"
            type="search"
            placeholder="Rechercher un article…"
            class="w-full rounded-full border border-ink/15 bg-white py-3 pl-12 pr-4 text-ink shadow-soft transition-colors placeholder:text-ink/40 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <ArticleFilters v-model="activeGroup" :filters="content.filters" class="mt-5" />

        <!-- `aria-live` : le nombre de résultats est annoncé quand on tape. -->
        <p class="mt-6 text-sm text-ink/55" aria-live="polite">
          {{ filteredArticles.length }}
          {{ filteredArticles.length > 1 ? "articles" : "article" }}
          <template v-if="query">pour « {{ search.trim() }} »</template>
        </p>

        <!-- État vide : aucun article, ou rien qui corresponde à la recherche. -->
        <div v-if="!filteredArticles.length" class="mt-12 text-ink/65">
          <p v-if="query || activeGroup">
            Aucun article ne correspond à cette recherche.
            <button
              type="button"
              class="font-semibold text-teal-700 underline"
              @click="((search = ''), (activeGroup = null))"
            >
              Tout afficher
            </button>
          </p>
          <p v-else>
            Les premières tentacules arrivent bientôt.
            <NuxtLink to="/ressources" class="text-teal-700 underline">
              Inscrivez-vous à la newsletter
            </NuxtLink>
            pour ne rien manquer.
          </p>
        </div>

        <ul v-else class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="article in visibleArticles" :key="article.slug">
            <ArticleCard :article="article" />
          </li>
        </ul>

        <!-- Sentinelle + bouton : la première déclenche le chargement au
             défilement, le second reste utilisable sans souris ni JS d'observer. -->
        <div v-if="hasMore" ref="sentinel" class="mt-12 flex justify-center">
          <button
            type="button"
            class="rounded-full border border-ink/15 px-7 py-3 font-semibold text-ink/75 transition-colors hover:border-teal-300 hover:bg-teal-50"
            @click="showMore"
          >
            Afficher plus d'articles
          </button>
        </div>

        <p class="mt-12">
          <NuxtLink
            to="/ressources"
            class="inline-flex items-center gap-2 font-semibold text-teal-700 hover:underline"
          >
            <span aria-hidden="true">←</span> Retour aux Tentacules
          </NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>
