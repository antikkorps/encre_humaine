<script setup lang="ts">
// Page d'un diagnostic (`/diagnostic-rh`, `/diagnostic-projet`) : textes
// Directus + agenda, puis le déroulé. Une seule implémentation pour les deux.
import type { DiagnosticContent, DiagnosticKind } from "~/types/content";

const props = defineProps<{ kind: DiagnosticKind }>();

const { data: content, error } = await useFetch<DiagnosticContent>(
  `/api/content/diagnostic/${props.kind}`,
  { query: usePreviewQuery() },
);
if (error.value || !content.value) {
  throw createError({
    statusCode: 500,
    statusMessage: "Diagnostic momentanément indisponible",
    fatal: true,
  });
}

useSeoMeta({
  title: () => `${content.value?.texts.title} — L'Encre Humaine`,
  description: () => content.value?.texts.intro,
  ogTitle: () => content.value?.texts.title,
  ogDescription: () => content.value?.texts.intro,
});
</script>

<template>
  <DiagnosticRunner v-if="content" :content="content" />
</template>
