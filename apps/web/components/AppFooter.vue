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
         Il est affiché ENTIER (run 7) : la grille réserve une bande basse
         (`lg:pb-40`) où il se loge sans rogner ni chevaucher les colonnes.
         Masqué sur les pages d'erreur (le bandeau 404 a déjà son poulpe). -->
    <OctopusLogoFull
      v-if="!appError"
      class="pointer-events-none absolute bottom-32 right-6 hidden h-36 rotate-[6deg] select-none lg:block xl:h-40"
    />
    <div
      class="mx-auto grid max-w-6xl gap-x-8 gap-y-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_0.85fr] lg:pb-40 xl:pb-44"
    >
      <div class="sm:col-span-2 lg:col-span-1">
        <div class="flex items-center gap-2.5 text-paper">
          <OctopusMark class="h-9 w-9 text-teal-300" />
          <p class="font-display text-lg font-semibold">L'Encre Humaine</p>
        </div>
        <p class="mt-3 font-display text-sm font-semibold text-sand-300">
          Structurer sans déshumaniser.
        </p>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-paper/70">
          J'accompagne les organisations dans leurs enjeux RH, compétences et management, et les
          particuliers dans leurs transitions professionnelles.
        </p>
        <p class="mt-3 text-sm text-paper/60">Bouches-du-Rhône · Intervention partout en France</p>
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
          <li>
            <NuxtLink to="/organisations/audit-rh" class="hover:text-teal-300">
              Audit RH &amp; feuille de route
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/organisations/competences-parcours" class="hover:text-teal-300">
              Compétences &amp; parcours professionnels
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/organisations/managers-equipes" class="hover:text-teal-300">
              Management &amp; équipes
            </NuxtLink>
          </li>
          <li class="pt-1">
            <NuxtLink to="/organisations" class="font-medium text-sand-300 hover:text-sand-400">
              → Toutes les offres organisations
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Particuliers">
        <p class="font-display text-sm font-semibold text-paper">Particuliers</p>
        <ul class="mt-3 space-y-2 text-sm text-paper/70">
          <li>
            <NuxtLink to="/particuliers/clarifier-avancer" class="hover:text-teal-300">
              Clarifier &amp; avancer
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/particuliers/booster-recherche" class="hover:text-teal-300">
              Booster sa recherche
            </NuxtLink>
          </li>
          <li class="pt-1">
            <NuxtLink to="/particuliers" class="font-medium text-sand-300 hover:text-sand-400">
              → Tous les accompagnements
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Ressources">
        <p class="font-display text-sm font-semibold text-paper">Ressources</p>
        <ul class="mt-3 space-y-2 text-sm text-paper/70">
          <li>
            <NuxtLink to="/ressources" class="hover:text-teal-300">
              <span aria-hidden="true">🐙</span> Les Tentacules de L'Encre Humaine
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/ressources#tentacules" class="hover:text-teal-300">
              Articles &amp; analyses
            </NuxtLink>
          </li>
          <li><NuxtLink to="/ressources#newsletter" class="hover:text-teal-300">Newsletter</NuxtLink></li>
          <li><NuxtLink to="/a-propos" class="hover:text-teal-300">À propos</NuxtLink></li>
          <li><NuxtLink to="/contact" class="hover:text-teal-300">Contact</NuxtLink></li>
        </ul>
      </nav>

      <nav aria-label="Liens légaux">
        <p class="font-display text-sm font-semibold text-paper">Informations</p>
        <ul class="mt-3 space-y-2 text-sm text-paper/70">
          <li><NuxtLink to="/mentions-legales" class="hover:text-teal-300">Mentions légales</NuxtLink></li>
          <li>
            <NuxtLink to="/confidentialite" class="hover:text-teal-300">
              Politique de confidentialité
            </NuxtLink>
          </li>
          <li><NuxtLink to="/cgv" class="hover:text-teal-300">CGV</NuxtLink></li>
          <li><NuxtLink to="/cgu" class="hover:text-teal-300">CGU</NuxtLink></li>
        </ul>
      </nav>
    </div>

    <div class="border-t border-paper/10 px-4 py-5 text-center text-xs text-paper/50">
      <p class="font-display text-sm text-paper/70">
        Les organisations ont besoin de repères. Les personnes aussi.
      </p>
      <p class="mt-2">
        TVA non applicable, art. 293 B du CGI · © {{ year }} L'Encre Humaine — Eléonore Morée
      </p>
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
