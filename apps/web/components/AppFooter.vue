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
  <!-- Structure calquée sur la référence envoyée par Éléonore (run 7) :
       1. colonne « mascotte » à gauche — logo ENTIER, marque, zone d'intervention
          et CTA de prise de RDV, qui devient le point d'entrée principal du pied ;
       2. colonnes de liens à droite, chacune sous un intitulé doré en capitales ;
       3. bandeau « Tentacules » mis en avant (blog + newsletter) ;
       4. signature centrée (promesse + accroche) ;
       5. barre basse : mentions à gauche, liens légaux à droite.
       Les liens légaux quittent les colonnes pour la barre basse — c'est leur
       place dans la référence, et ça laisse 3 colonnes larges au vrai contenu. -->
  <footer class="relative isolate mt-auto overflow-hidden bg-ink text-paper/80">
    <div class="mx-auto max-w-6xl px-4 py-16">
      <div class="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <!-- 1. Marque + CTA -->
        <div class="text-center lg:text-left">
          <OctopusLogoFull
            v-if="!appError"
            class="mx-auto h-36 select-none lg:mx-0"
            aria-hidden="true"
          />
          <p class="mt-4 font-display text-xl font-semibold text-paper">L'Encre Humaine</p>
          <p class="mt-2 text-sm leading-relaxed text-paper/60">
            Bouches-du-Rhône<br />
            Intervention partout en France
          </p>
          <NuxtLink
            to="/contact"
            class="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-ink shadow-soft transition-colors hover:bg-sand-500"
          >
            Prendre rendez-vous
            <Icon name="material-symbols:arrow-forward" class="h-4 w-4" />
          </NuxtLink>
          <p class="mt-2 text-xs text-paper/50">Premier échange sans engagement</p>
          <NuxtLink
            v-if="shop?.enabled"
            to="/boutique"
            class="mt-4 inline-block text-sm font-medium text-sand-300 hover:text-sand-400"
          >
            Boutique →
          </NuxtLink>
        </div>

        <!-- 2. Colonnes de liens -->
        <div class="lg:border-l lg:border-paper/10 lg:pl-16">
          <div class="grid gap-8 sm:grid-cols-3">
            <nav aria-label="Organisations">
              <p
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-300"
              >
                <Icon name="material-symbols:groups" class="h-4 w-4" />
                Organisations
              </p>
              <ul class="mt-4 space-y-2.5 text-sm text-paper/70">
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
                  <NuxtLink
                    to="/organisations"
                    class="font-medium text-sand-300 hover:text-sand-400"
                  >
                    Toutes les offres organisations →
                  </NuxtLink>
                </li>
              </ul>
            </nav>

            <nav aria-label="Particuliers">
              <p
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-300"
              >
                <Icon name="material-symbols:route" class="h-4 w-4" />
                Particuliers
              </p>
              <ul class="mt-4 space-y-2.5 text-sm text-paper/70">
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
                    Tous les accompagnements →
                  </NuxtLink>
                </li>
              </ul>
            </nav>

            <nav aria-label="Ressources et contact">
              <p
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-300"
              >
                <Icon name="material-symbols:menu-book" class="h-4 w-4" />
                Ressources
              </p>
              <ul class="mt-4 space-y-2.5 text-sm text-paper/70">
                <li>
                  <NuxtLink to="/ressources#tentacules" class="hover:text-teal-300">
                    Articles &amp; analyses
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/ressources#newsletter" class="hover:text-teal-300">
                    Newsletter
                  </NuxtLink>
                </li>
                <li><NuxtLink to="/a-propos" class="hover:text-teal-300">À propos</NuxtLink></li>
                <li><NuxtLink to="/contact" class="hover:text-teal-300">Contact</NuxtLink></li>
              </ul>
            </nav>
          </div>

          <!-- 3. Bandeau « Tentacules » (le rendez-vous éditorial du cabinet) -->
          <div
            class="mt-10 flex flex-col gap-4 rounded-2xl bg-paper/5 p-5 ring-1 ring-paper/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3">
              <OctopusMark class="h-9 w-9 flex-none text-teal-300" />
              <div>
                <p class="font-display text-sm font-semibold text-paper">
                  Les Tentacules de L'Encre Humaine
                </p>
                <p class="text-sm text-paper/60">Le blog et la lettre du cabinet.</p>
              </div>
            </div>
            <NuxtLink
              to="/ressources"
              class="inline-flex flex-none items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-sand-300 ring-1 ring-sand-300/40 transition-colors hover:bg-sand-300 hover:text-ink"
            >
              Découvrir
              <Icon name="material-symbols:arrow-forward" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- 4. Signature -->
      <div class="mt-14 border-t border-paper/10 pt-10 text-center">
        <p class="font-display text-2xl font-semibold text-sand-300">
          Structurer sans déshumaniser.
        </p>
        <p class="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-paper/70">
          J'accompagne les organisations dans leurs enjeux RH, compétences et management, et les
          particuliers dans leurs transitions professionnelles.
        </p>
        <p class="mt-4 font-display text-sm text-paper/50">
          Les organisations ont besoin de repères. Les personnes aussi.
        </p>
      </div>
    </div>

    <!-- 5. Barre basse -->
    <div class="border-t border-paper/10">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>TVA non applicable, art. 293 B du CGI · © {{ year }} L'Encre Humaine - Eléonore Morée</p>
        <ul class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <li><NuxtLink to="/mentions-legales" class="hover:text-teal-300">Mentions légales</NuxtLink></li>
          <li>
            <NuxtLink to="/confidentialite" class="hover:text-teal-300">
              Politique de confidentialité
            </NuxtLink>
          </li>
          <li><NuxtLink to="/cgv" class="hover:text-teal-300">CGV</NuxtLink></li>
          <li><NuxtLink to="/cgu" class="hover:text-teal-300">CGU</NuxtLink></li>
        </ul>
      </div>
      <p class="px-4 pb-5 text-center text-xs text-paper/40">
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
