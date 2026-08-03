# 04 / 09 — Travaillons ensemble (Contact)

**Route** : `/contact` · **Source** : `contact_page` + `faq_items` (scope=contact) + `site_settings` · **API** : `03` §2.

## Objectif
Transformer l'intérêt en action. Page chaude : simple, rassurante. Ne pas gâcher avec un formulaire froid.

## Sections (ordre)
1. **Accroche humaine** — `accroche_title` + `accroche_body` + double CTA (→ ancre `#contact`).
2. **Deux façons de me contacter** (onglets, `id="contact"`) :
   - **Réserver un échange** — `booking_intro` + `BookingEmbed` (URL `site_settings.booking_url`, provider Cal.com, **chargé après consentement**) + `booking_reassurance` (« 🐙 Aucun tentacule commercial caché… »).
   - **M'envoyer un message** — `message_intro` + `ContactForm` (prénom, email, audience, message, Turnstile → `POST /api/contact`). Mention RGPD discrète.
3. **Comment se déroule le premier échange** — `next_steps` (répéteur) + `steps_conclusion` + `response_time_note`.
4. **Vous pouvez me contacter si…** — `reasons_title` + deux colonnes `reasons_org` / `reasons_b2c` (masqué si vide).
5. **FAQ courte** — `faq_items` (scope=contact).
6. **CTA final** — `final_cta_title` + `final_cta_body` → ancre `#contact`.
7. **Coordonnées directes** — email, LinkedIn, localisation (`site_settings`).

## A11y / SEO
- Formulaire accessible (labels, radios groupées en `fieldset`/`legend`, erreurs `aria-live`, focus sur succès/erreur). `h1` = `accroche_title`.
- Embed RDV (Cal.com) en iframe différée : ne charge aucun cookie tiers avant consentement.

## Consulter les messages reçus (admin)

Les soumissions sont enregistrées dans `app.contact_leads` **avant** l'envoi de la
notification, qui est best-effort. Un email qui n'arrive pas ne perd donc aucun
message — encore faut-il pouvoir les lire.

L'admin Directus expose la table en **lecture seule** sous « Messages reçus »
(`packages/directus/src/adopt-app-tables.ts`, appelé par le bootstrap). Trois
garde-fous se cumulent : `SELECT` seul pour `directus_user` au niveau Postgres,
champs `readonly` dans l'admin, action `read` seule pour la policy Éditrice.

Pré-requis d'infrastructure : `DB_SEARCH_PATH: directus,app` sur le conteneur
Directus et le `GRANT SELECT` de `infra/postgres/init.sql`. Sur une base **déjà
créée**, `init.sql` ne rejoue pas : passer le grant à la main, puis recréer le
conteneur Directus (`make prod-cms-recreate`) et relancer le bootstrap.

⚠️ Ce n'est pas une archive : la purge RGPD supprime les leads passé leur délai
de conservation.

### Précédent : les notifications silencieusement supprimées (2026-08)

Le 30 juin, une notification vers `eleonore@encrehumaine.fr` a rebondi
(`550 5.1.1 Address does not exist` — la règle Cloudflare Email Routing n'existait
pas encore). Resend a mis l'adresse sur sa **liste de suppression** : tous les
envois suivants ont été acceptés puis supprimés en silence, donc invisibles côté
code (`emails.send` ne renvoie pas d'erreur dans ce cas). Cinq messages sont
restés sans notification pendant un mois.

En cas de « mails non reçus », vérifier dans cet ordre : la règle de routage chez
Cloudflare, puis la liste de suppression Resend (`GET /suppressions`), enfin le
statut des envois (`GET /emails`, champ `last_event`).

## Critères d'acceptation
- Soumission valide → lead enregistré + email à Eléonore. Turnstile vérifié serveur. L'embed RDV ne se charge qu'après consentement. États succès/erreur clairs. Pas d'IP persistée.
