<script setup lang="ts">
// Pied de page — docs/00-global.md §Layout. Contenu réel depuis site_settings (Directus) = item BACKLOG.
// Le lien « Boutique » suit l'activation de la boutique (shop_page).
const year = new Date().getFullYear();
const { data: shop } = await useShopPage();
</script>

<template>
  <footer class="border-t border-teal-100 bg-teal-50">
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
      <div>
        <p class="font-display font-semibold text-teal-800">L'Encre Humaine</p>
        <p class="mt-2 text-sm text-teal-700">
          Conseil RH &amp; accompagnement. Bouches-du-Rhône · France entière.
        </p>
        <NuxtLink
          v-if="shop?.enabled"
          to="/boutique"
          class="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-600"
        >
          Boutique →
        </NuxtLink>
      </div>
      <nav aria-label="Organisations">
        <p class="text-sm font-semibold text-teal-800">Organisations</p>
        <ul class="mt-2 space-y-1 text-sm text-teal-700">
          <li><NuxtLink to="/organisations">Nos offres B2B</NuxtLink></li>
        </ul>
      </nav>
      <nav aria-label="Particuliers">
        <p class="text-sm font-semibold text-teal-800">Particuliers</p>
        <ul class="mt-2 space-y-1 text-sm text-teal-700">
          <li><NuxtLink to="/particuliers">Accompagnement</NuxtLink></li>
        </ul>
      </nav>
      <nav aria-label="Liens légaux">
        <p class="text-sm font-semibold text-teal-800">Informations</p>
        <ul class="mt-2 space-y-1 text-sm text-teal-700">
          <li><NuxtLink to="/mentions-legales">Mentions légales</NuxtLink></li>
          <li><NuxtLink to="/cgv">CGV</NuxtLink></li>
          <li><NuxtLink to="/confidentialite">Confidentialité</NuxtLink></li>
        </ul>
      </nav>
    </div>
    <div class="border-t border-teal-100 px-4 py-4 text-center text-xs text-teal-600">
      <p>TVA non applicable, art. 293 B du CGI · © {{ year }} L'Encre Humaine</p>
    </div>
  </footer>
</template>
