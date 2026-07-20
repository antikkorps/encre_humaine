<script setup lang="ts">
// Pied de page — docs/00-global.md §Layout. Contenu réel depuis site_settings (Directus) = item BACKLOG.
// Le lien « Boutique » suit l'activation de la boutique (shop_page).
const year = new Date().getFullYear();
const { data: shop } = await useShopPage();
// Sur une page d'erreur (404/5xx), le bandeau porte déjà un grand filigrane poulpe :
// on masque celui du footer pour éviter deux poulpes empilés. Ailleurs, useError() est nul.
const appError = useError();
</script>

<template>
  <footer class="relative isolate mt-auto overflow-hidden bg-ink text-paper/80">
    <!-- Le logo dans ses couleurs, posé en bas à droite (demande Éléonore) — il
         remplace l'ancien filigrane teal. Décoratif (la marque est déjà écrite en
         toutes lettres à gauche), donc sans `title`.
         Masqué sur les pages d'erreur (le bandeau 404 a déjà son poulpe). -->
    <OctopusLogoFull
      v-if="!appError"
      class="pointer-events-none absolute -bottom-8 right-4 hidden h-52 rotate-[6deg] select-none lg:block xl:-bottom-10 xl:h-64"
    />
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
      <p class="mt-2">
        Codé avec
        <span aria-hidden="true">❤️</span>
        et quelques tentacules par
        <a
          href="https://github.com/antikkorps"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 font-medium text-sand-300 transition-colors hover:text-sand-400"
        >
          Franck Vienot
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02.01 2.04.14 3 .4 2.29-1.53 3.3-1.21 3.3-1.21.66 1.66.24 2.88.12 3.18.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.56C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"
            />
          </svg>
        </a>
      </p>
    </div>
  </footer>
</template>
