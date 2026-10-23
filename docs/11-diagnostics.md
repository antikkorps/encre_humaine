# 11 — Diagnostics B2B et B2C (« Où en sont vos RH ? » / « Où en est votre projet ? »)

**Routes** : `/diagnostic-rh` (B2B) · `/diagnostic-projet` (B2C) · `/diagnostic` (accueil de choix, facultatif) · `/diagnostic/rapport/:token` (rapport retrouvé)
**Source de vérité métier** : cahier des charges d'Éléonore v1.0 du 2026-10-22 (questions, barème, règles de recommandation, textes, recette §13). Le prototype HTML joint vient d'une version antérieure : **en cas d'écart, le cahier des charges fait foi**.
**Décisions** (Franck, 2026-10-23) : textes éditables dans Directus, structure et barème dans le code ; réponses dans le schéma `app` + lecture seule dans Directus ; réponse sensible B2C non stockée ; RDV = nouvel onglet Cal.com pré-rempli.

## Objectif
Outil d'acquisition : 12 questions, ~4 minutes, un score utile en lui-même, des conseils concrets, une offre adaptée, puis le rendez-vous. L'email est demandé **après** la valeur (déblocage du détail), avec consentement explicite. Ton du site : « un point de lucidité, pas un contrôle ».

## Partage des responsabilités (DRY)
| Où | Quoi |
|---|---|
| `packages/shared/src/diagnostics/` | **Structure** : identifiants de questions, type (oui-non / situation / menu), thème, ordre, variantes de profil, parcours B2C ; **moteur de calcul pur** (scores, niveaux, conseils, offres, mentions). Utilisé côté client (affichage immédiat) ET serveur (recalcul de référence au déblocage). |
| Directus | **Textes** : intro, libellés de questions et variantes, libellés de réponses, conseils, noms de niveaux, messages de recommandation, mentions de taille, cartes d'offre (nom, prix, durée, phrase, lien), textes de l'encart email, de l'écran bienveillant, de l'email envoyé. |
| `site_settings` | Agendas `booking_url_org` / `booking_url_b2c` (repli `booking_url`). |

Un texte manquant dans Directus ne casse pas la page : le loader retombe, clé par clé, sur le texte de référence du cahier des charges (`packages/shared/src/diagnostics/texts-b2b.ts` / `texts-b2c.ts`), qui sert aussi de semence au seed. Une liste de réponses au mauvais nombre de lignes, une clé inconnue ou un lien d'offre non sûr sont ignorés.

## Parcours (commun)
1. Écran d'intro (titre, durée, phrase de cadrage) puis question 1.
2. Une question par écran, barre de progression, « Question X sur 12 », bouton Retour (réponses conservées).
3. Oui / En partie / Non et situations : validation au clic. Menus : bouton « Continuer », choix obligatoire.
4. Résultat : scores et niveaux visibles **sans condition** ; détail (conseils, offres, RDV) flouté sous un encart de déblocage.
5. Encart : email (validé), case consentement **obligatoire** non cochée (rapport par email, lien vers `/confidentialite`), case newsletter « Les Tentacules » **facultative** non cochée. Turnstile.
6. Déblocage → rapport complet affiché + email envoyé + URL `/diagnostic/rapport/:token` (lien de l'email ; revenir sur la page garde le rapport débloqué).
7. L'état du questionnaire en cours vit en mémoire (pas de stockage navigateur) : un rechargement repart de l'intro.

## Calcul (cf. cahier des charges §3.2, §5, §7)
- Oui / En partie / Non = 2 / 1 / 0. Situations : 1re réponse 2, 2e 1, 3e 0 (ordre fixe). Menus non scorés.
- Thème sur 100 = points ÷ max × 100, arrondi. Niveaux : < 40 / 40–69 / ≥ 70.
- **B2B** : thèmes A Structuration RH, B Compétences et GEPP, C Management (3 questions, 6 pts chacun) ; score global = moyenne arrondie des 3. Niveaux « Des bases à poser / En structuration / Une base solide ».
  - Offre du score = thème le plus faible (A Audit RH, B Carte des Talents, C De l'Expert au Manager) ; les 3 < 40 → Audit RH ; égalité → thème lié à la Q12 s'il est ex æquo, sinon A, B, C.
  - Offre du besoin (Q12) : Croissance → Audit RH ; Départs → Carte des Talents ; Tensions → Expert au Manager ; Plan de formation → Carte des Talents ; Je ne sais pas → aucune.
  - Affichage : global < 70 et offres différentes → 2 cartes (« Ce que montre votre diagnostic » puis « Pour répondre à votre priorité ») ; identiques → 1 carte + « Votre score et votre priorité pointent dans la même direction. » ; « Je ne sais pas » → offre du score seule ; global ≥ 70 → message « bases solides » + 1 carte (offre du besoin, sinon du score). Max 2.
  - Mention de taille (Q2) : < 20 ou > 300 salariés → texte dédié.
  - Conseils : max 3, réponses < 2 pts, thème le plus faible d'abord puis réponse la plus faible.
  - Variantes de libellé selon Q1 (Dirigeant·e / DRH), « Autre » = formulation de base.
- **B2C** : Q1 situation, Q2 orientation (parcours Direction / Poste), Q3 filtre — non scorés ; Q4–Q12 selon le parcours. Deux scores, pas de global. Niveaux « À construire / En progrès / Solide ».
  - Direction : Clarté du projet (Q4–9, 12 pts), Mise en mouvement (Q10–12, 6 pts). Poste : Clarté du poste visé (Q4–6, 6 pts), Lisibilité de la recherche (Q7–12, 12 pts).
  - Recommandation : table §7 (dont Poste + Q4 = Non → Clarifier son projet quel que soit le reste) ; message « rupture » ajouté si Q1 = « Après un licenciement ou une rupture ».
  - Changer de parcours en revenant sur la Q2 efface les réponses du parcours abandonné.
  - Q3 « période très difficile » → écran bienveillant (Continuer / Je reviendrai plus tard → accueil).
  - « Partager mon résultat » (LinkedIn + copie de lien) : message générique + lien du questionnaire, jamais de score ni de réponse.

## Rendez-vous
Bouton « Réserver 30 minutes pour en parler » (B2B) / « Réserver ma séance découverte offerte » (B2C) → **nouvel onglet** sur l'agenda du public, pré-rempli par paramètres d'URL Cal.com : nom (si connu), email, note (B2B : profil, taille, score global et sous-scores, offre(s), priorité ; B2C : situation, scores, offre). Le clic est enregistré. La réservation effective (webhook Cal.com) est hors périmètre v1.

## Données (`app.diagnostics`, migration Drizzle)
| Colonne | Contenu |
|---|---|
| `id`, `created_at` | uuid v7, horodatage |
| `kind` | `b2b` / `b2c` |
| `email` | email saisi |
| `consent_report`, `consent_newsletter`, `consent_text_version` | consentements + version du texte accepté |
| `answers` | jsonb `{ questionId: { answer, points } }` — **sans** la réponse à la Q3 B2C (remplacée par rien) |
| `scores`, `levels`, `offers` | jsonb recalculés serveur |
| `source`, `device` | paramètre d'URL `?source=` (borné), type d'appareil (mobile/desktop, dérivé, pas d'UA brut) |
| `report_token_hash` | hash du jeton du lien de rapport (jeton en clair seulement dans l'email/URL) |
| `booking_clicked_at` | premier clic sur le bouton de RDV |

- Pas d'IP persistée. Rate-limit + Turnstile au déblocage. Scores **recalculés côté serveur** à partir des réponses (le client n'est pas cru).
- Conservation **3 ans** après création (aligné sur `contact_leads`), purge par tâche planifiée `diagnostics:purge`.
- Q3 B2C sensible : aucune trace individuelle ; seul un compteur anonyme d'affichages de l'écran bienveillant (événement Umami sans propriété).
- Lecture : collection Directus « Diagnostics reçus », même mécanique que « Messages reçus » (docs/09) : contenu en lecture seule, **statut modifiable** (archivage natif Directus) et **suppression autorisée** à l'Éditrice ; export CSV natif de l'admin.
- Newsletter : case cochée → même parcours que l'inscription existante (double opt-in maison, docs/08), jamais d'inscription directe.
- Anti-abus : au plus un email (rapport + éventuelle confirmation newsletter) par adresse et par diagnostic toutes les 10 minutes, en plus de Turnstile et de la limite par IP. Le rapport reste enregistré et affiché.
- La réponse sensible ne quitte jamais le navigateur (retirée avant l'envoi) et serait de toute façon ignorée par le serveur. Le lien de rapport ne renvoie pas l'email : il se transfère.
- Exception assumée à « Directus ne lit pas le schéma `app` » (docs/CLAUDE.md) : comme `contact_leads` (docs/09), Directus lit `app.diagnostics` pour qu'Éléonore prépare ses rendez-vous ; droits limités à `SELECT`, `UPDATE (status)`, `DELETE`.

## Email au déblocage (Resend)
Objet : « Votre diagnostic : [niveau] » (B2B) / « Votre point sur votre projet professionnel » (B2C). Contenu : scores et niveaux, conseils, offre(s), bouton RDV, lien vers le rapport en ligne, signature L'Encre Humaine. Transférable tel quel (aucun lien personnel autre que le rapport). Pas de lien de désinscription marketing : c'est un email transactionnel demandé ; la newsletter a les siens.

## Mesure (Umami, sans cookie)
Événements : `diagnostic_start`, `diagnostic_complete`, `diagnostic_unlock`, `diagnostic_booking_click`, `diagnostic_care_screen` (compteur anonyme), avec `kind` en propriété (sauf `diagnostic_care_screen`).

## A11y / mobile
Mobile d'abord, boutons de réponse larges, pas de défilement horizontal ; navigation clavier, focus visible et déplacé sur la question à chaque écran ; menus et champs labellisés ; progression annoncée (`aria-live`) ; contrastes AA ; flou du rapport non lisible par les lecteurs d'écran (`aria-hidden` + `inert`) tant qu'il n'est pas débloqué.

## Critères d'acceptation
Les 14 scénarios de recette du cahier des charges (§13), dont :
- B2B tout au maximum → thèmes 100, global 100, « Une base solide », offre du besoin seule ; tout au minimum → 0, « Des bases à poser », Audit RH en premier.
- B2B C le plus faible + priorité Tensions → 1 carte Expert au Manager + phrase « même direction » ; A le plus faible + Tensions → 2 cartes Audit RH puis Expert au Manager ; « Je ne sais pas » → 1 carte (score).
- B2B taille < 20 (dont « moins de 10 », scénario du cahier des charges) ou > 300 → mention affichée ; de 20 à 300 → aucune.
- B2C Direction Clarté 50 → Clarifier ; 83 → Se (re)positionner « direction qui se dessine » ; Poste Q4 = Non & Lisibilité 100 → Clarifier ; Q4 = Oui & Lisibilité 33 → Se (re)positionner « cap posé ».
- B2C retour sur Q2 + changement de parcours → réponses effacées, 12 écrans ; Q3 difficile → écran bienveillant puis possibilité de continuer.
- Email invalide ou consentement non coché → pas de déblocage, erreur claire ; retour en arrière → réponses conservées.
Plus : rapport retrouvable par le lien de l'email ; aucune trace de la Q3 en base ; textes modifiés dans Directus visibles sans déploiement ; Lighthouse mobile ≥ 95.

## Hors périmètre v1
Réservation effective remontée de Cal.com (webhook), relances commerciales automatiques, analyse de CV payante (§14 du cahier des charges, cahier séparé).
