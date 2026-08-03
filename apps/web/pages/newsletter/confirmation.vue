<script setup lang="ts">
// Confirmation double opt-in — docs/08-newsletter.md, docs/03 §3.2.
//
// Deux états sur la MÊME page (selon les paramètres d'URL) :
//  1. Arrivée depuis l'email (`?token&email`) → page INERTE qui affiche un
//     bouton « Confirmer » : seule sa soumission (POST `/api/newsletter/confirm`)
//     mute l'état. Un GET ne confirme jamais → les scanners/prefetch d'emails ne
//     peuvent pas auto-confirmer (audit sécu #3). Le `<form>` natif marche sans JS.
//  2. Retour de l'action (`?status=…`, posé par la redirection 302 de l'endpoint)
//     → page d'état pure.
// Non indexée dans les deux cas.
const route = useRoute();

const one = (val: unknown): string =>
  typeof val === "string" ? val : Array.isArray(val) ? (val[0] ?? "") : "";

// Étape 1 : on a un token + email et PAS encore de statut → proposer la confirmation.
const token = computed(() => one(route.query.token));
const email = computed(() => one(route.query.email));
const status = computed(() => one(route.query.status));
const mode = computed<"confirm" | "result">(() =>
  !status.value && token.value && email.value ? "confirm" : "result",
);

type Status = "success" | "already" | "expired" | "invalid";
const STATES: Record<Status, { icon: string; title: string; body: string; retry: boolean }> = {
  success: {
    icon: "🎉",
    title: "C'est confirmé !",
    body: "Votre inscription est finalisée. Vous recevrez le prochain numéro du Fil.",
    retry: false,
  },
  already: {
    icon: "👍",
    title: "Vous êtes déjà inscrit·e",
    body: "Votre adresse était déjà confirmée — rien de plus à faire.",
    retry: false,
  },
  expired: {
    icon: "⏳",
    title: "Lien expiré",
    body: "Ce lien de confirmation a expiré. Inscrivez-vous à nouveau, on vous renvoie un lien.",
    retry: true,
  },
  invalid: {
    icon: "🤔",
    title: "Lien invalide",
    body: "Ce lien de confirmation n'est pas valide. Vous pouvez retenter une inscription.",
    retry: true,
  },
};

const state = computed(() => {
  const s = status.value;
  return STATES[(s in STATES ? s : "invalid") as Status];
});

const siteName = "L'Encre Humaine";
useSeoMeta({
  title: `Confirmation newsletter — ${siteName}`,
  robots: "noindex, nofollow",
});
</script>

<template>
  <section class="relative isolate mx-auto max-w-2xl overflow-hidden px-4 py-24">
    <!-- Filigrane tentacule discret qui affleure derrière la carte (parité avec la confirmation de commande). -->
    <TentacleAccent
      side="left"
      name="tentacule-5-trait"
      class="absolute -left-12 -bottom-8 -z-10 w-72 -rotate-6 text-teal-700/[0.08]"
    />
    <div class="rounded-3xl border border-ink/5 bg-white p-10 text-center shadow-soft sm:p-12">
      <!-- Étape 1 — confirmation explicite (POST). -->
      <template v-if="mode === 'confirm'">
        <OctopusMark class="mx-auto h-14 w-14 text-teal-300" />
        <h1 class="mt-6 font-display text-3xl font-bold text-ink">Confirmez votre inscription</h1>
        <p class="mt-4 leading-relaxed text-ink/70">
          Dernière étape : confirmez que c'est bien vous qui souhaitez recevoir « Le Fil ».
        </p>
        <form method="post" action="/api/newsletter/confirm" class="mt-8">
          <input type="hidden" name="token" :value="token" />
          <input type="hidden" name="email" :value="email" />
          <button
            type="submit"
            class="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
          >
            Confirmer mon inscription
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </template>

      <!-- Étape 2 — état après confirmation. -->
      <template v-else>
        <p class="text-5xl" aria-hidden="true">{{ state.icon }}</p>
        <h1 class="mt-6 font-display text-3xl font-bold text-ink">{{ state.title }}</h1>
        <p class="mt-4 leading-relaxed text-ink/70">{{ state.body }}</p>

        <NuxtLink
          :to="state.retry ? '/newsletter' : '/'"
          class="mt-8 inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
        >
          {{ state.retry ? "Se réinscrire" : "Retour à l'accueil" }}
        </NuxtLink>
      </template>
    </div>
  </section>
</template>
