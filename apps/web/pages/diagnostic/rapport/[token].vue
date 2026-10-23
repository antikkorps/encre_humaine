<script setup lang="ts">
// Rapport retrouvé par son lien (email ou retour sur la page) — docs/11-diagnostics.md.
// Le jeton est secret : la page n'est ni indexée ni dans le sitemap.
import type { Answers, B2bResult, B2cResult } from "@encre/shared/diagnostics";
import type { DiagnosticContent, DiagnosticKind } from "~/types/content";

interface StoredReport {
  kind: DiagnosticKind;
  answers: Answers;
  result: B2bResult | B2cResult;
}

const route = useRoute();
const token = String(route.params.token);
const { data: report, error } = await useFetch<StoredReport>(`/api/diagnostics/report/${token}`);
if (error.value || !report.value) {
  throw createError({ statusCode: 404, statusMessage: "Rapport introuvable", fatal: true });
}
const { data: content } = await useFetch<DiagnosticContent>(
  `/api/content/diagnostic/${report.value.kind}`,
);

useSeoMeta({ title: "Votre diagnostic — L'Encre Humaine", robots: "noindex, nofollow" });
</script>

<template>
  <div v-if="report && content" class="mx-auto max-w-2xl px-4 py-12 sm:py-16">
    <DiagnosticResult
      :content="content"
      :answers="report.answers"
      :result="report.result"
      :token="token"
      unlocked
    />
    <NuxtLink
      :to="report.kind === 'b2b' ? '/diagnostic-rh' : '/diagnostic-projet'"
      class="mt-10 inline-block text-sm font-medium text-ink/60 underline underline-offset-4 hover:text-teal-700"
    >
      Refaire le diagnostic
    </NuxtLink>
  </div>
</template>
