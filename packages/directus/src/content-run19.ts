// Contenu du run 19 (mail d'Éléonore du 2026-10-12, page Contact) — source unique,
// consommée par le seed complet (`seed.ts`) et par le seed ciblé `seed-run19.ts`
// (instance déjà remplie, typiquement la prod).
//
// Le lot remplace le formulaire « M'envoyer un message » par « Être rappelé·e »,
// ajoute la section « Pourquoi prendre rendez-vous ? » et une question de FAQ.
// Le hero, « À quoi vous attendre », « Pour quelles situations ? » et le CTA final
// restent à Éléonore : elle ajuste elle-même leurs textes dans l'admin.
//
// Convention `**…**` : gras doré à l'affichage (cf. apps/web/utils/accent.ts).

/** Nouveaux champs de `contact_page` : écrits seulement s'ils sont vides. */
export const run19ContactPage = {
  accroche_cta_note: "30 minutes, sans engagement. Vous repartez avec vos premières priorités.",
  benefits_title: "Ce avec quoi vous repartez, concrètement.",
  benefits: [
    {
      title: "Vous savez nommer précisément ce qui bloque.",
      body: "Un problème flou fait tourner en rond, un problème nommé se traite : vous arrêtez de perdre du temps à traiter les symptômes.",
    },
    {
      title: "Vous repartez avec 2 ou 3 premières priorités.",
      body: "Pas un plan de 40 pages : ce qui compte vraiment, dans quel ordre : vous savez quoi faire dès la semaine suivante, même si nous ne retravaillons jamais ensemble.",
    },
    {
      title: "Vous savez si un accompagnement vous serait utile, avant d'investir un euro.",
      body: "Je vous le dis franchement, y compris quand la réponse est « non, pas besoin » : vous décidez en connaissance de cause, sans pression.",
    },
    {
      title: "Si je ne suis pas la bonne personne, vous le savez aussi.",
      body: "Je vous oriente vers une autre ressource ou un autre professionnel : vous ne perdez pas de temps à frapper à la mauvaise porte.",
    },
  ],
  benefits_org:
    "**Si vous êtes une organisation** : vous sortez avec une première lecture de votre situation RH (ce qui tient, ce qui expose un risque) et la priorité à traiter en premier.",
  benefits_b2c:
    "**Si vous êtes un particulier** : vous sortez avec un premier éclairage sur votre situation et, si c'est utile, l'accompagnement qui correspond à votre besoin.",
  contact_title: "Deux façons de commencer",
  callback_intro:
    "**Pour vous si :** vous préférez ne pas jongler avec un agenda, ou vous voulez d'abord poser votre situation en quelques mots.\n\n" +
    "Laissez votre numéro et le moment qui vous arrange : je vous rappelle pour un premier échange de 30 minutes, au créneau que vous avez choisi.",
  callback_form_intro: "Je vous rappelle sous 48 heures ouvrées, au moment qui vous arrange.",
};

/**
 * Textes existants que le mail réécrit. Appliqués seulement si le champ porte
 * encore mot pour mot la valeur du seed d'origine (`from`) : sinon Éléonore l'a
 * déjà retouché, on lui laisse la main et l'aperçu affiche la proposition.
 */
export const run19ContactRewrites = {
  contact_intro: {
    from: "Que vous préfériez un échange de vive voix ou un premier message, choisissez simplement la formule qui vous convient.",
    to: "Que vous préfériez choisir votre créneau ou être appelé·e, le premier échange est le même : 30 minutes, gratuit, sans engagement.",
  },
  booking_intro: {
    from: "Vous préférez en parler directement ?\n\nRéservez un créneau de 30 minutes.\n\nNous faisons le point sur votre situation et voyons ensemble si je suis la bonne personne pour vous accompagner.",
    to:
      "**Pour vous si :** vous savez déjà quand vous êtes disponible et vous préférez fixer le rendez-vous vous-même.\n\n" +
      "Choisissez un créneau de 30 minutes dans mon agenda. Nous faisons le point sur votre situation et je vous dis si je peux vous aider, et comment.",
  },
};

/** Nouvelle question de la FAQ Contact (créée si absente, clé = la question). */
export const run19ContactFaq = {
  question: "Comment se passe le rappel ?",
  answer:
    "<p>Vous choisissez un créneau dans le formulaire, je vous appelle dans les 48 heures ouvrées. L'appel dure 30 minutes, il est gratuit et sans engagement.</p>",
  scope: "contact",
};
