<script setup lang="ts">
// Résultat d'un diagnostic : scores toujours visibles ; détail flouté et retiré
// de l'arbre d'accessibilité (`inert`) tant que l'email n'est pas donné. Au
// déblocage, on bascule sur le lien du rapport : un rechargement le garde ouvert.
import type { Answers, B2bResult, B2cResult } from "@encre/shared/diagnostics";
import type { DiagnosticContent } from "~/types/content";

const props = defineProps<{
  content: DiagnosticContent;
  answers: Answers;
  result: B2bResult | B2cResult;
  unlocked?: boolean;
  email?: string;
  token?: string;
}>();
const track = useTrack();

async function onUnlocked(token: string) {
  track("diagnostic_unlock", { kind: props.content.kind });
  await navigateTo(`/diagnostic/rapport/${token}`, { replace: true });
}
</script>

<template>
  <div>
    <h1 class="font-display text-4xl font-bold text-ink">Votre résultat</h1>
    <DiagnosticScores :kind="content.kind" :texts="content.texts" :result="result" class="mt-8" />

    <div class="relative mt-12">
      <div :class="unlocked ? '' : 'pointer-events-none select-none blur-[6px]'" :inert="!unlocked || undefined" :aria-hidden="!unlocked || undefined">
        <DiagnosticReport :content="content" :answers="answers" :result="result" :email="email" :token="token" />
      </div>
      <div v-if="!unlocked" class="absolute inset-x-0 top-0 flex justify-center">
        <DiagnosticUnlock :content="content" :answers="answers" class="w-full max-w-md" @unlocked="onUnlocked" />
      </div>
    </div>
  </div>
</template>
