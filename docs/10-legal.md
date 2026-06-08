# 04 / 10 — Pages légales

**Routes** : `/mentions-legales` · `/cgv` · `/confidentialite` · (`/cgu` si fourni)
**Source** : `legal_documents` (collection, par slug) + `site_settings` (infos d'identité) · **Rendu** : SSG.

## Contenu
- **Mentions légales** — éditeur, statut, SIRET, adresse, directeur de publication, hébergeur (Hetzner), contact. Mention `TVA non applicable, art. 293 B du CGI`.
- **CGV** — deux volets : **prestations** (acomptes, séances, conditions) **et** **produits physiques** (serious games : prix, livraison, **droit de rétractation 14 jours**, retours). Documents fournis par le client (Franck les passe au moment du remplissage).
- **Confidentialité (RGPD)** — données collectées (contact, newsletter, commandes), finalités, bases légales, **preuve de consentement newsletter**, durées de conservation (cf. `01` §8), sous-traitants (Stripe, Resend, Cloudflare, Hetzner, R2), droits (accès, effacement…), contact DPO/référent.

## A11y / SEO
- `no_index` possible si souhaité. `h1` = titre du document. Rich text sanitizé, table des matières pour les longs documents.

## Critères d'acceptation
- Chaque document est éditable dans `legal_documents`. Liens présents dans le footer. CGV couvre **bien** le physique (rétractation 14 j) et les prestations. Mention 293 B présente.
