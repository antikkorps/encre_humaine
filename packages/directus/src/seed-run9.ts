// Seed CIBLÉ des NOUVEAUX champs du run 9 (« Le Laboratoire » + page Contact).
//
//   pnpm --filter @encre/directus seed:run9
//
// Pourquoi ce script : le bootstrap crée les champs mais ne pose aucun contenu.
// Sur une instance déjà remplie (la prod), les nouvelles sections seraient donc
// vides — et un `seed` complet, lui, ÉCRASERAIT tout ce qu'Eléonore a écrit.
//
// Garde-fou central : on lit d'abord la valeur en place et on n'écrit QUE dans
// les champs vides (`null`, chaîne blanche ou tableau vide). Relançable sans
// risque, et sans effet sur ce qui a déjà été édité dans l'admin.
//
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds
// admin), comme le bootstrap.

import { get, patch } from "./api.ts";

/** Une valeur Directus est « vide » si elle n'a rien à afficher. */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * PATCH partiel : ne conserve que les clés dont la valeur actuelle est vide.
 * Renvoie les champs effectivement écrits (pour le journal).
 */
async function fillEmptyFields(
  collection: string,
  values: Record<string, unknown>,
): Promise<string[]> {
  const keys = Object.keys(values);
  const current = await get<{ data: Record<string, unknown> }>(
    `/items/${collection}?fields=${keys.join(",")}`,
  );
  const existing = (current as unknown as { data?: Record<string, unknown> }).data ?? current;
  const payload: Record<string, unknown> = {};
  const skipped: string[] = [];
  for (const key of keys) {
    if (isEmpty((existing as Record<string, unknown>)[key])) payload[key] = values[key];
    else skipped.push(key);
  }
  if (skipped.length) console.log(`  = ${collection} : déjà renseigné → ${skipped.join(", ")}`);
  if (!Object.keys(payload).length) return [];
  await patch(`/items/${collection}`, payload);
  return Object.keys(payload);
}

// ── « Le Laboratoire » (shop_page) ───────────────────────────────────────────
const LABORATOIRE = {
  title: "Le Laboratoire",
  intro: "Des outils conçus à partir du terrain.",
  hero_body:
    "<p>Pendant plus de dix ans, j'ai accompagné des organisations, des managers et des personnes en transition professionnelle.</p>" +
    "<p>Au fil de ces expériences, une évidence s'est imposée : certains sujets sont difficiles à faire évoluer uniquement avec des procédures, des présentations ou des formations descendantes.</p>" +
    "<p><strong>Le Laboratoire est l'espace où je conçois des ressources pour apprendre autrement : plus concrètement, plus simplement et plus durablement.</strong></p>",
  catalog_title: "Ce que vous trouverez bientôt",
  catalog_items: [
    {
      icon: "casino",
      title: "Jeux pédagogiques RH",
      body: "Apprendre par l'expérimentation.\n\nPour travailler le management, les compétences, les risques psychosociaux, la communication ou les parcours professionnels.",
      status: "En cours de conception",
    },
    {
      icon: "menu-book",
      title: "Guides & méthodes",
      body: "Des méthodes directement utilisables.\n\nPas de théorie inutile.\n\nDes outils conçus pour passer plus facilement à l'action.",
      status: "En cours de conception",
    },
    {
      icon: "edit-note",
      title: "Carnets de travail",
      body: "Pour réfléchir.\n\nClarifier.\n\nStructurer.\n\nPrendre du recul.",
      status: "En cours de conception",
    },
    {
      icon: "description",
      title: "Modèles & supports",
      body: "Des trames, check-lists et outils RH issus de ma pratique.",
      status: "En cours de conception",
    },
  ],
  focus_eyebrow: "En ce moment…",
  focus_title: "Je développe une première collection de jeux pédagogiques RH.",
  focus_body:
    "<p>Avant de créer ces outils, je souhaite comprendre les besoins réels des professionnels RH, des managers et des organisations.</p>" +
    "<p>Parce qu'un bon outil ne commence pas par une idée.</p><p>Il commence par un problème de terrain.</p>",
  // Le lien du questionnaire n'est pas encore connu : laissé à Eléonore.
  focus_cta_label: "Contribuer au questionnaire",
  manifesto_title: "Et si une heure de jeu valait plus que trois heures de slides ?",
  manifesto_subtitle: "Réinventer la formation en entreprise.",
  manifesto_body:
    "<p>Le jeu n'est pas une fin.</p><p>C'est un moyen de créer des prises de conscience, de favoriser les échanges et d'ancrer les apprentissages dans la pratique.</p>",
  newsletter_title: "Vous souhaitez être informé des prochaines sorties ?",
  newsletter_body:
    "Recevez les informations sur les nouveaux outils, jeux pédagogiques, guides et analyses directement dans votre boîte mail.",
  meta_title: "Le Laboratoire — L'Encre Humaine",
};

// ── Page Contact : uniquement les champs AJOUTÉS au run 9 ────────────────────
const CONTACT = {
  accroche_subtitle:
    "Que vous soyez une organisation en réflexion sur ses pratiques RH ou une personne en questionnement professionnel, un premier échange permet souvent d'y voir plus clair.",
  contact_intro:
    "Que vous préfériez un échange de vive voix ou un premier message, choisissez simplement la formule qui vous convient.",
  steps_title: "Comment se déroule notre premier échange ?",
  reasons_org_lead: "Vous souhaitez…",
  reasons_b2c_lead: "Aujourd'hui…",
  final_cta_subtext:
    "30 minutes d'échange, sans engagement, pour faire le point sur votre situation.\n🐙 Aucun tentacule commercial caché. Juste une conversation pour comprendre votre situation.",
};

async function main(): Promise<void> {
  console.log("→ Seed ciblé run 9 (champs VIDES uniquement)…");
  const lab = await fillEmptyFields("shop_page", LABORATOIRE);
  console.log(lab.length ? `+ shop_page : ${lab.join(", ")}` : "= shop_page : rien à écrire");
  const contact = await fillEmptyFields("contact_page", CONTACT);
  console.log(
    contact.length ? `+ contact_page : ${contact.join(", ")}` : "= contact_page : rien à écrire",
  );
  console.log("✓ Seed run 9 terminé (aucun champ déjà rempli n'a été touché).");
}

main().catch((e) => {
  console.error("✗ Seed run 9 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
