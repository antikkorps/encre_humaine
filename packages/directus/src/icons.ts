// Icônes disponibles pour les items d'offres (sous-champ `icon` des répéteurs
// outcomes/context_items/mission_includes). Liste FERMÉE : ces clés doivent aussi
// figurer dans `clientBundle.icons` de apps/web/nuxt.config.ts (sinon elles ne
// s'affichent pas sur le site). Choix = jeu thématique (les icônes purement
// structurelles — flèche, citation, coches — restent réservées au code).
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
] as const;
