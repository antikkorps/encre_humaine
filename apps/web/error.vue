<script setup lang="ts">
// Page d'erreur globale (404 / 5xx) — remplace la page Nuxt par défaut. Reprend
// le ton « encre/poulpe » : bandeau sombre, filigrane poulpe, clin d'œil sur le 404.
// Enveloppée dans le layout par défaut → en-tête + pied de page conservés (l'usager
// garde la navigation pour repartir). Non indexée.
//
// 404 : l'illustration signée Éléonore (le « poulpe stagiaire » astronaute) est
// le HÉROS de la page — elle porte déjà le « 404 », « STAGIAIRE », « L'ENCRE
// HUMAINE »… On la met en scène en 2 colonnes (dé-centrage éditorial), on retire
// le filigrane SVG et le grand « 404 » textuel devenus des doublons.
// 5xx : traitement sobre conservé (l'illustration est un clin d'œil propre au 404).
import type { NuxtError } from "#app";
// Asset local → import Vite (le provider @nuxt/image est bindé à Directus, réservé
// aux médias distants). Renvoie l'URL buildée (hash + copie dans /_nuxt).
import poulpeStagiaire from "~/assets/poulpe_stagiaire/Poulpe_stagiaire.webp";

const props = defineProps<{ error: NuxtError }>();

const code = computed(() => props.error?.status ?? 500);
const is404 = computed(() => code.value === 404);

const title = computed(() =>
  is404.value ? "Erreur spatio-poulporelle détectée" : "Une erreur est survenue",
);

// Texte 404 signé Éléonore — une phrase d'accroche puis le récit décalé. Le 5xx
// garde un message court et rassurant (défaillance serveur, pas un clin d'œil).
const lead = computed(() =>
  is404.value
    ? "Nous avons un petit problème technique."
    : "Quelque chose s'est mal passé de notre côté.",
);
const body = computed(() =>
  is404.value
    ? [
        "Notre poulpe stagiaire, probablement un peu trop confiant dans ses capacités de navigation inter-dimensionnelle, a déplacé cette page sans laisser de trace exploitable.",
        "Résultat : vous venez de tomber dans une zone de flou numérique.",
        "Rassurez-vous, ce type d'incident reste rare (mais pas impossible quand on confie des réglages du site à un céphalopode en apprentissage).",
        "Notre équipe est déjà en train de rétablir la situation.",
      ]
    : ["Merci de réessayer dans un instant — nous rétablissons ça au plus vite."],
);

// Pied de carte façon rapport d'incident tamponné (404 uniquement). Le dernier
// point clignote pour signaler que la résolution est « en cours ».
const report = [
  { label: "Incident classé", value: "erreur spatio-poulporelle" },
  { label: "Niveau de flou", value: "temporaire" },
  { label: "Statut", value: "retour à la clarté en cours", live: true },
];

const goHome = () => clearError({ redirect: "/" });

useSeoMeta({
  title: () => `${code.value} — L'Encre Humaine`,
  robots: "noindex, nofollow",
});
</script>

<template>
  <NuxtLayout>
    <!-- ============================================================= -->
    <!-- 404 : l'illustration d'Éléonore en vedette (2 colonnes)        -->
    <!-- ============================================================= -->
    <section
      v-if="is404"
      class="bg-ink-gradient relative isolate overflow-hidden px-4 py-16 text-paper sm:py-20"
    >
      <!-- Tache d'encre en fond, en retrait (le décor identitaire vit
           désormais surtout dans le dessin lui-même). -->
      <InkBlob
        class="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-96 w-96 rotate-12 text-teal-500/10"
      />

      <!-- Colonne image resserrée (~26rem) + colonne texte qui prend tout le
           reste → on récupère le vide entre l'illustration et le texte, ce qui
           laisse la place aux deux CTA côte à côte avec leur libellé complet. -->
      <div
        class="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14"
      >
        <!-- HÉROS : l'illustration. Halo doré pour la décoller du fond
             sombre + flottement lent (coupé sous prefers-reduced-motion). -->
        <figure class="relative order-first mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.22),transparent_62%)] blur-2xl"
          />
          <img
            :src="poulpeStagiaire"
            alt="Illustration : un poulpe stagiaire en scaphandre d'astronaute, dérivant dans l'espace autour d'un « 404 » — signée Éléonore pour L'Encre Humaine."
            width="1836"
            height="2721"
            decoding="async"
            fetchpriority="high"
            class="motion-drift-slow relative w-full select-none"
          />
        </figure>

        <!-- Colonne texte, alignée à gauche (dé-centrage éditorial). Plus large
             (2xl) : profite de l'espace libéré et accueille les CTA sur une ligne. -->
        <div class="w-full max-w-2xl">
          <p
            class="font-mono text-xs font-medium uppercase tracking-[0.25em] text-sand-400"
          >
            Erreur 404 · page introuvable
          </p>
          <h1 class="mt-3 font-display text-3xl font-bold sm:text-4xl">
            {{ title }}
          </h1>

          <!-- Carte « rapport d'incident » : texte lisible + pied tamponné. -->
          <div
            class="mt-7 overflow-hidden rounded-2xl border border-paper/10 bg-ink-950/40 text-left shadow-soft backdrop-blur-sm"
          >
            <div
              class="space-y-3 px-6 py-6 leading-relaxed text-paper/75 sm:px-8 sm:py-7"
            >
              <p class="text-lg font-medium text-paper">{{ lead }}</p>
              <p v-for="(paragraph, index) in body" :key="index">{{ paragraph }}</p>
            </div>

            <dl
              class="flex flex-col gap-2.5 border-t border-paper/10 px-6 py-4 font-mono text-[0.68rem] uppercase tracking-wider text-paper/45 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:px-8"
            >
              <div
                v-for="item in report"
                :key="item.label"
                class="flex items-center gap-2"
              >
                <span
                  class="h-1.5 w-1.5 shrink-0 rounded-full bg-sand-400"
                  :class="item.live && 'animate-pulse'"
                />
                <span
                  >{{ item.label }} :
                  <span class="text-paper/70">{{ item.value }}</span></span
                >
              </div>
            </dl>
          </div>

          <!-- Actions : retour accueil (icône maison de la navbar) + contact.
               La colonne texte élargie laisse les deux boutons côte à côte avec
               leur libellé complet ; `flex-wrap` reste un filet pour les largeurs
               intermédiaires. Empilés pleine largeur sur mobile. -->
          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-paper px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
              @click="goHome"
            >
              <!-- Icône maison identique à celle de la barre de navigation. -->
              <svg
                class="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 11.5 12 4l9 7.5M5.5 10v9.5a1 1 0 0 0 1 1H10v-5.5h4V20.5h3.5a1 1 0 0 0 1-1V10"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Retour à un espace plus structuré
            </button>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-paper/40 px-7 py-3.5 font-semibold text-paper transition-colors hover:border-paper hover:bg-paper/10"
            >
              <!-- Icône enveloppe au trait, assortie à l'icône maison. -->
              <svg
                class="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM3.5 7l8.5 6 8.5-6"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Contacter L'Encre Humaine
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- 5xx : traitement sobre (filigrane poulpe, message rassurant)   -->
    <!-- ============================================================= -->
    <section
      v-else
      class="bg-ink-gradient relative isolate grid min-h-[72vh] place-items-center overflow-hidden px-4 py-20 text-paper"
    >
      <OctopusWatermark
        class="pointer-events-none absolute -right-28 top-1/2 -z-10 hidden h-[38rem] -translate-y-1/2 rotate-6 text-sand-300/[0.16] lg:block"
      />
      <InkBlob
        class="pointer-events-none absolute -bottom-16 -left-20 -z-10 h-80 w-80 -rotate-12 text-teal-500/15"
      />

      <div class="mx-auto w-full max-w-xl">
        <div class="text-center">
          <p
            class="font-display text-[5.5rem] font-bold leading-none text-sand-400 sm:text-8xl"
          >
            {{ code }}
          </p>
          <h1 class="mt-4 font-display text-3xl font-bold sm:text-4xl">
            {{ title }}
          </h1>
        </div>

        <div
          class="mt-9 overflow-hidden rounded-2xl border border-paper/10 bg-ink-950/40 text-left shadow-soft backdrop-blur-sm"
        >
          <div class="space-y-3 px-6 py-6 leading-relaxed text-paper/75 sm:px-8 sm:py-7">
            <p class="text-lg font-medium text-paper">{{ lead }}</p>
            <p v-for="(paragraph, index) in body" :key="index">{{ paragraph }}</p>
          </div>
        </div>

        <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-paper px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-white"
            @click="goHome"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
