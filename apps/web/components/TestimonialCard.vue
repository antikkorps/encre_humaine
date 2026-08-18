<script setup lang="ts">
// Carte témoignage — docs/02-content-model.md §5 (`testimonials`).
// Les sections témoignage se masquent si vides → ce composant suppose un item présent.
//
// Trois éléments éditables par Éléonore, tous optionnels et tous masqués proprement
// s'ils manquent (retours du 2026-08-18) :
//  - la note de satisfaction (étoiles) ;
//  - la photo de la personne, en bulle ronde ;
//  - à défaut de photo (personne qui ne souhaite pas sa tête sur le site), le
//    petit poulpe prend sa place — jamais de bulle vide ni d'initiales.
import type { TestimonialItem } from "~/types/content";

const props = defineProps<{ testimonial: TestimonialItem }>();

// Ligne d'attribution : « Prénom Nom, fonction — entreprise ».
const attribution = computed(() => {
  const t = props.testimonial;
  const role = [t.authorTitle, t.company].filter(Boolean).join(" — ");
  return role ? `${t.authorName}, ${role}` : t.authorName;
});

const stars = [1, 2, 3, 4, 5];
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

    <!-- Satisfaction globale (masquée si non renseignée). -->
    <p
      v-if="testimonial.rating"
      class="relative mb-4 flex items-center gap-0.5"
      role="img"
      :aria-label="`Satisfaction : ${testimonial.rating} sur 5`"
    >
      <Icon
        v-for="n in stars"
        :key="n"
        :name="n <= testimonial.rating ? 'material-symbols:star' : 'material-symbols:star-outline'"
        class="h-5 w-5"
        :class="n <= testimonial.rating ? 'text-sand-400' : 'text-ink/20'"
        aria-hidden="true"
      />
    </p>

    <blockquote class="relative flex-1 font-display text-lg leading-relaxed text-ink sm:text-xl">
      <p>«&#160;<AccentText :text="testimonial.quote" />&#160;»</p>
    </blockquote>

    <figcaption class="mt-5 flex items-center gap-4 text-sm">
      <!-- Bulle : photo si la personne est d'accord, poulpe sinon. -->
      <NuxtImg
        v-if="testimonial.photo"
        :src="testimonial.photo.url"
        :alt="testimonial.photo.alt"
        :width="112"
        :height="112"
        fit="cover"
        format="webp"
        loading="lazy"
        decoding="async"
        class="h-14 w-14 flex-none rounded-full object-cover ring-2 ring-sand-300"
      />
      <span
        v-else
        aria-hidden="true"
        class="grid h-14 w-14 flex-none place-items-center rounded-full bg-teal-900 ring-2 ring-sand-300"
      >
        <OctopusMark class="h-8 w-8 text-sand-300" />
      </span>
      <span>
        <span class="font-semibold text-teal-700">{{ attribution }}</span>
        <span v-if="testimonial.context" class="mt-1 block text-ink/55">
          <AccentText :text="testimonial.context" />
        </span>
      </span>
    </figcaption>
  </figure>
</template>
