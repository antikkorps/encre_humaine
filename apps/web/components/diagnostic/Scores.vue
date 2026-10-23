<script setup lang="ts">
// Scores et niveaux d'un diagnostic — toujours visibles, sans condition
// (docs/11-diagnostics.md). B2B : score global + trois thèmes ; B2C : deux scores
// nommés selon le parcours.
import type { B2bResult, B2cResult, DiagnosticTexts } from "@encre/shared/diagnostics";

const props = defineProps<{
  kind: "b2b" | "b2c";
  texts: DiagnosticTexts;
  result: B2bResult | B2cResult;
}>();

const bars = computed(() => {
  if (props.kind === "b2b") {
    const r = props.result as B2bResult;
    return (["A", "B", "C"] as const).map((t) => ({
      label: props.texts.themes[t] ?? t,
      score: r.scores[t],
      level: props.texts.levels[r.levels[t]],
    }));
  }
  const r = props.result as B2cResult;
  return (["A", "B"] as const).map((t) => ({
    label: props.texts.themes[`${r.path}_${t}`] ?? t,
    score: r.scores[t],
    level: props.texts.levels[r.levels[t]],
  }));
});
const b2b = computed(() => (props.kind === "b2b" ? (props.result as B2bResult) : null));
</script>

<template>
  <div>
    <div v-if="b2b" class="flex items-center gap-6">
      <p class="font-display text-6xl font-bold text-teal-800">
        {{ b2b.global }}<span class="text-2xl text-ink/50">/100</span>
      </p>
      <div>
        <p class="font-display text-2xl font-bold text-ink">{{ texts.levels[b2b.globalLevel] }}</p>
        <p class="text-ink/60">{{ texts.messages.global_label }}</p>
      </div>
    </div>
    <ul class="mt-8 space-y-5">
      <li v-for="bar in bars" :key="bar.label">
        <div class="flex items-baseline justify-between gap-4">
          <span class="font-semibold text-ink">{{ bar.label }}</span>
          <span class="text-sm text-ink/70">
            <span class="font-semibold text-ink">{{ bar.score }}/100</span> · {{ bar.level }}
          </span>
        </div>
        <div
          class="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/10"
          role="meter"
          :aria-label="bar.label"
          :aria-valuenow="bar.score"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="h-full rounded-full bg-orange-400" :style="{ width: `${bar.score}%` }" />
        </div>
      </li>
    </ul>
  </div>
</template>
