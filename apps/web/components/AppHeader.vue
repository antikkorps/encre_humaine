<script setup lang="ts">
// Nav principale — docs/00-global.md §Layout. Partagée avec le menu mobile (NavMobile).
// « Le Laboratoire » est une page VITRINE (ce qui se prépare) : elle figure donc
// toujours dans la navigation. `shop_enabled` ne pilote plus que l'ouverture du
// catalogue et du paiement à l'intérieur de cette page.
//
// Run 15 (audit du 2026-09-08) : « Organisations » et « Particuliers » ouvrent un
// menu déroulant listant les offres. Les libellés viennent de Directus
// (`/api/content/nav-offers`) et NON d'une liste en dur : c'est la réponse à
// « harmoniser le nom partout ? » — Éléonore renomme une offre, la nav, le pied de
// page et les pages suivent. Le pied de page partage la même clé `useFetch`, donc
// la même requête. Repli : si l'appel échoue, l'entrée reste un simple lien vers
// le hub (mieux qu'un menu vide).
import type { NavItem } from "~/types/content";

const { data: offers } = await useFetch("/api/content/nav-offers", {
  key: "nav-offers",
  default: () => ({ organisations: [], particuliers: [] }),
});

// Nav desktop : sections principales, libellés courts (1 ligne, cohérents). Pas
// d'« Accueil » (le logo y mène) ni de « Contact » (le bouton « Prendre RDV » le couvre).
const nav = computed<NavItem[]>(() => [
  { label: "À propos", to: "/a-propos" },
  {
    label: "Organisations",
    to: "/organisations",
    children: offers.value.organisations.map((o) => ({
      label: o.title,
      to: `/organisations/${o.slug}`,
      description: o.shortDescription || undefined,
      icon: o.icon,
    })),
  },
  {
    label: "Particuliers",
    to: "/particuliers",
    children: offers.value.particuliers.map((o) => ({
      label: o.title,
      to: `/particuliers/${o.slug}`,
      description: o.shortDescription || undefined,
      icon: o.icon,
    })),
  },
  { label: "Ressources", to: "/ressources" },
  { label: "Le Laboratoire", to: "/laboratoire" },
]);

// Menu mobile : on préfixe « Accueil » (pas de logo cliquable dans le panneau) ;
// le CTA « Prendre RDV » en bas du panneau couvre le contact.
const mobileNav = computed<NavItem[]>(() => [{ label: "Accueil", to: "/" }, ...nav.value]);

// Un menu ouvert doit se refermer quand la navigation aboutit (Reka ne le fait
// pas : le clic sur un lien interne ne démonte pas le déclencheur).
const openMenu = ref("");
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    openMenu.value = "";
  },
);
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <NuxtLink
        to="/"
        class="group flex items-center gap-2.5 text-ink"
        aria-label="L'Encre Humaine — accueil"
      >
        <OctopusMark class="h-8 w-8 text-teal-700 transition-transform group-hover:-rotate-6" />
        <span class="font-display text-lg font-semibold leading-none tracking-tight">
          L'Encre <span class="text-teal-700">Humaine</span>
        </span>
      </NuxtLink>

      <NavigationMenuRoot
        v-model="openMenu"
        aria-label="Navigation principale"
        class="relative hidden lg:block"
      >
        <NavigationMenuList class="flex items-center gap-7 text-sm font-medium text-ink/75">
          <NavigationMenuItem>
            <NavigationMenuLink as-child>
              <NuxtLink
                to="/"
                class="flex items-center text-ink/70 transition-colors hover:text-teal-700 aria-[current=page]:text-teal-700"
                aria-label="Accueil"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 11.5 12 4l9 7.5M5.5 10v9.5a1 1 0 0 0 1 1H10v-5.5h4V20.5h3.5a1 1 0 0 0 1-1V10"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </NuxtLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem v-for="item in nav" :key="item.to" :value="item.to">
            <!-- Entrée simple (pas d'offres à lister, ou repli si l'appel a échoué) -->
            <NavigationMenuLink v-if="!item.children?.length" as-child>
              <NuxtLink
                :to="item.to"
                class="whitespace-nowrap transition-colors hover:text-teal-700 aria-[current=page]:text-teal-700 aria-[current=page]:font-semibold"
              >
                {{ item.label }}
              </NuxtLink>
            </NavigationMenuLink>

            <template v-else>
              <NavigationMenuTrigger
                class="group/trigger flex items-center gap-1 whitespace-nowrap transition-colors hover:text-teal-700 data-[state=open]:text-teal-700"
                :class="
                  route.path.startsWith(item.to) ? 'font-semibold text-teal-700' : ''
                "
              >
                {{ item.label }}
                <svg
                  class="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </NavigationMenuTrigger>

              <!-- `w-auto` : le viewport tire SA largeur de ce contenu (variables CSS de
                   Reka). Un `w-full` ici rendrait la mesure circulaire → panneau
                   large de quelques pixels. La largeur se fixe donc sur la liste. -->
              <NavigationMenuContent class="nav-content absolute left-0 top-0 w-auto">
                <ul class="w-[27rem] p-2">
                  <li v-for="child in item.children" :key="child.to">
                    <NavigationMenuLink as-child>
                      <NuxtLink
                        :to="child.to"
                        class="group/row flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-teal-50 aria-[current=page]:bg-teal-50"
                      >
                        <span
                          aria-hidden="true"
                          class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-800 text-sand-300 transition-transform group-hover/row:-rotate-6"
                        >
                          <Icon
                            :name="`material-symbols:${child.icon}`"
                            class="h-5 w-5"
                          />
                        </span>
                        <span class="min-w-0">
                          <span
                            class="block font-display font-bold text-ink group-hover/row:text-teal-800"
                          >
                            {{ child.label }}
                          </span>
                          <span
                            v-if="child.description"
                            class="mt-0.5 block text-xs leading-relaxed text-ink/60"
                          >
                            {{ child.description }}
                          </span>
                        </span>
                      </NuxtLink>
                    </NavigationMenuLink>
                  </li>
                  <!-- Le déclencheur n'est pas cliquable (il ouvre le menu) :
                       c'est cette ligne qui mène au hub. -->
                  <li class="mt-1 border-t border-ink/10 pt-1">
                    <NavigationMenuLink as-child>
                      <NuxtLink
                        :to="item.to"
                        class="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
                      >
                        Voir la page {{ item.label }}
                        <span aria-hidden="true">→</span>
                      </NuxtLink>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </template>
          </NavigationMenuItem>
        </NavigationMenuList>

        <!-- Le viewport porte le cadre du panneau : une seule bordure/ombre, qui
             s'anime en taille et en position quand on passe d'un menu à l'autre.
             Les trois variables viennent de Reka : il mesure le contenu et centre
             le panneau sous son déclencheur, en le rentrant si le bord de l'écran
             est proche. Les recalculer à la main serait redondant et faux. -->
        <NavigationMenuViewport
          class="nav-viewport absolute left-[var(--reka-navigation-menu-viewport-left)] top-full mt-3 h-[var(--reka-navigation-menu-viewport-height)] w-[var(--reka-navigation-menu-viewport-width)] origin-top overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lift"
        />
      </NavigationMenuRoot>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/contact"
          class="hidden whitespace-nowrap rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-orange-600 sm:inline-flex"
        >
          Prendre RDV
        </NuxtLink>
        <NavMobile :items="mobileNav" />
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Panneau : fondu + léger glissement, dans les deux sens (data-state de Reka).
   Désactivé si l'utilisateur a demandé moins d'animations (a11y, cf. NavMobile). */
@keyframes nav-menu-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes nav-menu-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-6px); }
}
.nav-content[data-state="open"] {
  animation: nav-menu-in 0.2s ease-out;
}
.nav-content[data-state="closed"] {
  animation: nav-menu-out 0.15s ease-in;
}
.nav-viewport {
  transition:
    width 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.nav-viewport[data-state="open"] {
  animation: nav-menu-in 0.2s ease-out;
}
.nav-viewport[data-state="closed"] {
  animation: nav-menu-out 0.15s ease-in;
}

@media (prefers-reduced-motion: reduce) {
  .nav-content[data-state],
  .nav-viewport[data-state] {
    animation: none;
  }
  .nav-viewport {
    transition: none;
  }
}
</style>
