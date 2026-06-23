<script setup lang="ts">
// Carte témoignage — docs/02-content-model.md §5 (`testimonials`).
// Les sections témoignage se masquent si vides → ce composant suppose un item présent.
import type { TestimonialItem } from "~/types/content";

const props = defineProps<{ testimonial: TestimonialItem }>();

// Ligne d'attribution : « Prénom Nom, fonction — entreprise ».
const attribution = computed(() => {
  const t = props.testimonial;
  const role = [t.authorTitle, t.company].filter(Boolean).join(" — ");
  return role ? `${t.authorName}, ${role}` : t.authorName;
});
</script>

<template>
  <figure
    class="relative flex h-full flex-col rounded-3xl border border-ink/5 bg-white p-7 shadow-soft sm:p-8"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute right-6 top-2 font-display text-7xl leading-none text-sand-300/80"
    >
      &rdquo;
    </span>
    <blockquote class="relative flex-1 font-display text-lg leading-relaxed text-ink sm:text-xl">
      <p>«&#160;{{ testimonial.quote }}&#160;»</p>
    </blockquote>
    <figcaption class="mt-5 text-sm">
      <span class="font-semibold text-teal-700">{{ attribution }}</span>
      <span v-if="testimonial.context" class="mt-1 block text-ink/55">
        {{ testimonial.context }}
      </span>
    </figcaption>
  </figure>
</template>
