<script setup lang="ts">
// Retour du lien double opt-in — docs/08-newsletter.md, docs/03 §3.2.
// L'endpoint `/api/newsletter/confirm` valide le token puis redirige ici (302)
// avec `?status=success|already|expired|invalid`. Page d'état pure (aucune action
// destructive sur GET), non indexée.
const route = useRoute();

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
  const s = route.query.status;
  return STATES[(typeof s === "string" && s in STATES ? s : "invalid") as Status];
});

const siteName = "L'Encre Humaine";
useSeoMeta({
  title: `Confirmation newsletter — ${siteName}`,
  robots: "noindex, nofollow",
});
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-24">
    <div class="rounded-3xl border border-ink/5 bg-white p-10 text-center shadow-soft sm:p-12">
      <p class="text-5xl" aria-hidden="true">{{ state.icon }}</p>
      <h1 class="mt-6 font-display text-3xl font-bold text-ink">{{ state.title }}</h1>
      <p class="mt-4 leading-relaxed text-ink/70">{{ state.body }}</p>

      <NuxtLink
        :to="state.retry ? '/newsletter' : '/'"
        class="mt-8 inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
      >
        {{ state.retry ? "Se réinscrire" : "Retour à l'accueil" }}
      </NuxtLink>
    </div>
  </section>
</template>
