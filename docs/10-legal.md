# 04 / 10 — Pages légales

**Routes** : `/mentions-legales` · `/cgv` · `/confidentialite` · (`/cgu` si fourni)
**Source** : `legal_documents` (collection, par slug) + `site_settings` (infos d'identité) · **Rendu** : SSG.

## Contenu
- **Mentions légales** — éditeur, statut, SIRET, adresse, directeur de publication, hébergeur (Hetzner), contact. Mention `TVA non applicable, art. 293 B du CGI`.
- **CGV** — deux volets : **prestations** (acomptes, séances, conditions) **et** **produits physiques** (serious games : prix, livraison, **droit de rétractation 14 jours**, retours). Documents fournis par le client (Franck les passe au moment du remplissage).
- **Confidentialité (RGPD)** — données collectées (contact, newsletter, commandes), finalités, bases légales, **preuve de consentement newsletter**, durées de conservation (cf. `01` §8), sous-traitants (Stripe, Resend, Cloudflare, Hetzner, R2), droits (accès, effacement…), contact DPO/référent.

## Visibilité des CGV
Tant qu'il n'y a **pas de vente en ligne**, les CGV sont masquées : `site_settings.show_cgv`
décoché ⇒ le lien disparaît du pied de page **et** `/cgv` répond 404. Le document reste
intact dans `legal_documents` ; recocher la case le remet en ligne (aucune intervention
technique). Interrupteur documenté dans docs/02 §4.

## A11y / SEO
- `no_index` possible si souhaité. `h1` = titre du document. Rich text sanitizé, table des matières pour les longs documents.

## Critères d'acceptation
- Chaque document est éditable dans `legal_documents`. Liens présents dans le footer (CGV : seulement si `show_cgv`). CGV couvre **bien** le physique (rétractation 14 j) et les prestations. Mention 293 B présente.
