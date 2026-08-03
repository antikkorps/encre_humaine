// Icônes disponibles pour les items éditoriaux (sous-champ `icon` des répéteurs :
// offers.outcomes/context_items/mission_includes, org_hub_page.observe_items,
// b2c_hub_page.outcomes). Liste FERMÉE : ces clés doivent aussi figurer dans
// `clientBundle.icons` de apps/web/nuxt.config.ts (sinon elles ne s'affichent pas
// sur le site). Choix = jeu thématique (les icônes purement structurelles —
// flèche, citation, coches — restent réservées au code).
// `value` = clé Material Symbols au format Iconify (hyphénée). Partagé par
// schema.ts (interface select) et reconcile.ts (patch du meta).
export const ICON_CHOICES = [
  { text: "Lisibilité / œil (visibility)", value: "visibility" },
  { text: "Cap / drapeau (flag)", value: "flag" },
  { text: "Priorités / liste numérotée (format-list-numbered)", value: "format-list-numbered" },
  { text: "Base / couches (layers)", value: "layers" },
  { text: "Document / compétences (description)", value: "description" },
  { text: "Équipe / managers (group)", value: "group" },
  { text: "Outils / réglages (settings)", value: "settings" },
  { text: "Croissance (trending-up)", value: "trending-up" },
  { text: "Temps / court terme (schedule)", value: "schedule" },
  { text: "Analyse (analytics)", value: "analytics" },
  { text: "Entretien / échange (forum)", value: "forum" },
  { text: "Écarts / comparaison (difference)", value: "difference" },
  { text: "Parcours / feuille de route (route)", value: "route" },
  { text: "Restitution / prise de parole (record-voice-over)", value: "record-voice-over" },
  { text: "Format / calendrier (event)", value: "event" },
  { text: "Investissement / tarif (payments)", value: "payments" },
  { text: "Constat / idée (lightbulb)", value: "lightbulb" },
  { text: "Observation / insight (insights)", value: "insights" },
  { text: "Validation / coche (check-circle)", value: "check-circle" },
  // Jeu élargi (2026-07-21) — plus de nuances pour les hubs organisations & particuliers.
  { text: "Confiance / partenariat (handshake)", value: "handshake" },
  { text: "Collectif / équipes (groups)", value: "groups" },
  { text: "Posture / psychologie (psychology)", value: "psychology" },
  { text: "Diversité / collaboration (diversity-3)", value: "diversity-3" },
  { text: "Équilibre / cadre (balance)", value: "balance" },
  { text: "Élan / lancement (rocket-launch)", value: "rocket-launch" },
  { text: "Exigence / qualité (workspace-premium)", value: "workspace-premium" },
  { text: "Cohérence / liens (hub)", value: "hub" },
  { text: "Exploration / boussole (explore)", value: "explore" },
  { text: "Apprentissage / lecture (menu-book)", value: "menu-book" },
  { text: "Formation (school)", value: "school" },
  { text: "Développement personnel (self-improvement)", value: "self-improvement" },
  { text: "Recherche d'emploi (person-search)", value: "person-search" },
  { text: "Plan d'action / checklist (checklist)", value: "checklist" },
  { text: "Chronologie / étapes (timeline)", value: "timeline" },
  { text: "Objectif / cible (target)", value: "target" },
  { text: "Levier / clé (key)", value: "key" },
  { text: "Inspiration / idée (emoji-objects)", value: "emoji-objects" },
  // Jeu élargi (2026-08-03) — « Le Laboratoire » : outils en préparation.
  { text: "Laboratoire / expérimentation (science)", value: "science" },
  { text: "Jeu pédagogique / dés (casino)", value: "casino" },
  { text: "Carnet / prise de notes (edit-note)", value: "edit-note" },
] as const;

// Sous-champ `icon` d'un répéteur (1re position, demi-largeur, liste déroulante
// fermée). Source unique consommée par schema.ts (création) et reconcile.ts
// (patch du meta d'un répéteur déjà existant).
export const ICON_SUBFIELD = {
  field: "icon",
  width: "half" as const,
  interface: "select-dropdown",
  options: { choices: [...ICON_CHOICES], allowNone: true },
};
