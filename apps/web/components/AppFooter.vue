<script setup lang="ts">
// Pied de page — docs/00-global.md §Layout. Contenu réel depuis site_settings (Directus) = item BACKLOG.
// Le lien « Boutique » suit l'activation de la boutique (shop_page).
const year = new Date().getFullYear();
const { data: shop } = await useShopPage();
</script>

<template>
  <footer class="mt-auto bg-ink text-paper/80">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
      <div class="sm:col-span-2 md:col-span-1">
        <div class="flex items-center gap-2.5 text-paper">
          <OctopusMark class="h-9 w-9 text-teal-300" />
          <p class="font-display text-lg font-semibold">L'Encre Humaine</p>
        </div>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-paper/70">
          Conseil RH &amp; accompagnement. Remettre de l'humain dans le travail.
        </p>
        <p class="mt-3 text-sm text-paper/60">Bouches-du-Rhône · France entière.</p>
        <NuxtLink
          v-if="shop?.enabled"
          to="/boutique"
          class="mt-4 inline-block text-sm font-medium text-sand-300 hover:text-sand-400"
        >
          Boutique →
        </NuxtLink>
      </div>

      <nav aria-label="Organisations">
        <p class="font-display text-sm font-semibold text-paper">Organisations</p>
        <ul class="mt-3 space-y-2 text-sm text-paper/70">
          <li><NuxtLink to="/organisations" class="hover:text-teal-300">Nos offres B2B</NuxtLink></li>
        </ul>
      </nav>
      <nav aria-label="Particuliers">
        <p class="font-display text-sm font-semibold text-paper">Particuliers</p>
        <ul class="mt-3 space-y-2 text-sm text-paper/70">
          <li><NuxtLink to="/particuliers" class="hover:text-teal-300">Accompagnement</NuxtLink></li>
        </ul>
      </nav>
      <nav aria-label="Liens légaux">
        <p class="font-display text-sm font-semibold text-paper">Informations</p>
        <ul class="mt-3 space-y-2 text-sm text-paper/70">
          <li><NuxtLink to="/mentions-legales" class="hover:text-teal-300">Mentions légales</NuxtLink></li>
          <li><NuxtLink to="/cgv" class="hover:text-teal-300">CGV</NuxtLink></li>
          <li><NuxtLink to="/cgu" class="hover:text-teal-300">CGU</NuxtLink></li>
          <li><NuxtLink to="/confidentialite" class="hover:text-teal-300">Confidentialité</NuxtLink></li>
        </ul>
      </nav>
    </div>

    <div class="border-t border-paper/10 px-4 py-5 text-center text-xs text-paper/50">
      <p>TVA non applicable, art. 293 B du CGI · © {{ year }} L'Encre Humaine</p>
    </div>
  </footer>
</template>
