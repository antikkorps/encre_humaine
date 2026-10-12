import * as v from "valibot";

/** Audience commune (cohérente avec l'enum Drizzle `audience`). */
export const AudienceSchema = v.picklist(["organisation", "particulier"]);
export type Audience = v.InferOutput<typeof AudienceSchema>;

/**
 * Jours proposés pour le rappel. « peu importe » exclut les autres jours (le
 * formulaire décoche l'un quand on coche l'autre ; le serveur le refuse aussi).
 */
export const CALLBACK_DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "peu importe",
] as const;
export type CallbackDay = (typeof CALLBACK_DAYS)[number];

/** Moments de la journée proposés pour le rappel (un seul choix). */
export const CALLBACK_SLOTS = ["matin", "midi", "après-midi", "fin de journée"] as const;
export type CallbackSlot = (typeof CALLBACK_SLOTS)[number];

/**
 * Numéro de téléphone : on reste permissif (formats FR et internationaux,
 * espaces, points, tirets, parenthèses) — Éléonore rappelle un humain, pas un
 * automate. Il faut au moins 9 chiffres pour que le numéro soit composable.
 */
const PhoneSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Indiquez un numéro où vous joindre."),
  v.maxLength(30, "Ce numéro est trop long."),
  v.regex(/^\+?[\d\s().-]+$/, "Ce numéro contient des caractères inattendus."),
  v.check((s) => s.replace(/\D/g, "").length >= 9, "Ce numéro semble incomplet."),
);

/**
 * Payload du formulaire « Être rappelé·e » — docs/03-api-contracts.md §2.
 * Réutilisé client (formulaire) + serveur (endpoint) — DRY. Il remplace l'ancien
 * formulaire « M'envoyer un message » : le message devient facultatif, le
 * téléphone et le créneau de rappel deviennent obligatoires.
 */
export const ContactPayloadSchema = v.object({
  firstName: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Indiquez votre prénom."),
    v.maxLength(80, "Ce prénom est trop long."),
  ),
  phone: PhoneSchema,
  email: v.pipe(
    v.string(),
    v.trim(),
    v.email("Cette adresse e-mail semble invalide."),
    v.maxLength(254), // RFC 5321
  ),
  audience: v.picklist(AudienceSchema.options, "Précisez qui vous êtes."),
  callbackDays: v.pipe(
    v.array(v.picklist(CALLBACK_DAYS)),
    v.minLength(1, "Choisissez au moins un jour."),
    v.check(
      (days) => !days.includes("peu importe") || days.length === 1,
      "« Peu importe » ne se combine pas avec un jour précis.",
    ),
  ),
  callbackSlot: v.picklist(CALLBACK_SLOTS, "Choisissez un moment de la journée."),
  message: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(2000, "Votre message est trop long.")),
    "",
  ),
  sourcePage: v.optional(v.pipe(v.string(), v.maxLength(255))),
  turnstileToken: v.pipe(v.string(), v.nonEmpty()),
});

export type ContactPayload = v.InferOutput<typeof ContactPayloadSchema>;
