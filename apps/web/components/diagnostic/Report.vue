<script setup lang="ts">
// Détail d'un diagnostic (docs/11-diagnostics.md) : conseils, proposition,
// rendez-vous. Flouté tant que l'email n'est pas donné (cf. Result.vue). Le
// partage B2C ne transmet qu'un message générique et le lien du questionnaire,
// jamais un score ni une réponse.
import type { Answers, B2bResult, B2cResult } from "@encre/shared/diagnostics";
import type { DiagnosticContent } from "~/types/content";

const props = defineProps<{
  content: DiagnosticContent;
  answers: Answers;
  result: B2bResult | B2cResult;
  email?: string;
  token?: string;
}>();
const track = useTrack();

const texts = computed(() => props.content.texts);
const msg = computed(() => texts.value.messages);
const b2b = computed(() => (props.content.kind === "b2b" ? (props.result as B2bResult) : null));
const b2c = computed(() => (props.content.kind === "b2c" ? (props.result as B2cResult) : null));
const tips = computed(() =>
  props.result.tips.map((id) => texts.value.questions[id]?.tip).filter(Boolean),
);

/** Phrases de la proposition, dans l'ordre du cahier des charges (§5.5, §7). */
const proposal = computed(() => {
  if (b2c.value) {
    return [msg.value[b2c.value.message], b2c.value.ruptureNote ? msg.value.rupture : ""];
  }
  const r = b2b.value as B2bResult;
  const priorityLabel =
    props.answers.priority === "unknown"
      ? ""
      : answerLabelFor(texts.value, "b2b", props.answers, "priority");
  return [
    r.solidBase ? msg.value.solid_base : "",
    priorityLabel ? fillTemplate(msg.value.priority_recall ?? "", { priorite: priorityLabel }) : "",
  ];
});
const sizeNote = computed(() =>
  b2b.value?.sizeNote ? msg.value[`size_${b2b.value.sizeNote}`] : "",
);

const cards = computed(() => {
  if (b2c.value) return [{ key: b2c.value.offer, eyebrow: "" }];
  const r = b2b.value as B2bResult;
  return r.cards.map((c) => ({
    key: c.offer,
    eyebrow:
      r.cards.length > 1
        ? msg.value[c.role === "score" ? "score_card_title" : "need_card_title"]
        : "",
  }));
});

const bookingLink = computed(() =>
  bookingHref(props.content.bookingUrl, {
    email: props.email,
    notes: bookingNote(props.content.kind, props.answers, props.result, texts.value),
  }),
);
const contactFallback = computed(
  () => `/contact?pour=${props.content.kind === "b2b" ? "organisation" : "particulier"}`,
);

function onBooking() {
  track("diagnostic_booking_click", { kind: props.content.kind });
  if (props.token) {
    $fetch("/api/diagnostics/booking-click", {
      method: "POST",
      body: { token: props.token },
    }).catch(() => {});
  }
}
</script>

<template>
  <div>
    <h3 class="font-display text-2xl font-bold text-ink">{{ msg.tips_title }}</h3>
    <ul v-if="tips.length" class="mt-4 space-y-3">
      <li v-for="(tip, i) in tips" :key="i" class="border-l-4 border-orange-400 pl-4 leading-relaxed text-ink/80">
        {{ tip }}
      </li>
    </ul>
    <p v-else class="mt-4 text-ink/70">{{ msg.no_tips }}</p>

    <h3 class="mt-10 font-display text-2xl font-bold text-ink">{{ msg.proposal_title }}</h3>
    <p v-for="(line, i) in proposal.filter(Boolean)" :key="i" class="mt-3 leading-relaxed text-ink/80">
      {{ line }}
    </p>
    <p v-if="sizeNote" class="mt-4 rounded-2xl bg-teal-50 p-4 text-sm leading-relaxed text-ink/80">
      {{ sizeNote }}
    </p>
    <p v-if="b2b?.sameDirection" class="mt-3 font-semibold text-ink">{{ msg.same_direction }}</p>

    <div class="mt-6 grid gap-4" :class="cards.length > 1 ? 'sm:grid-cols-2' : ''">
      <template v-for="card in cards" :key="card.key">
        <DiagnosticOfferCard
          v-if="texts.offers[card.key]"
          :offer="texts.offers[card.key]!"
          :eyebrow="card.eyebrow"
          :link-label="msg.see_examples ?? ''"
        />
      </template>
    </div>

    <a
      v-if="bookingLink"
      :href="bookingLink"
      target="_blank"
      rel="noopener"
      class="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
      @click="onBooking"
    >
      {{ texts.ctaLabel }} <span aria-hidden="true">↗</span>
    </a>
    <NuxtLink
      v-else
      :to="contactFallback"
      class="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft"
      @click="onBooking"
    >
      {{ texts.ctaLabel }}
    </NuxtLink>

    <DiagnosticShare v-if="b2c" :text="msg.share_text ?? ''" :label="msg.share_label ?? ''" class="mt-8" />
  </div>
</template>
