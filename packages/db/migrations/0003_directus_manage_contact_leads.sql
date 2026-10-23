-- Éléonore range et nettoie les demandes de contact depuis l'admin Directus
-- (« Messages reçus ») — docs/09-contact.md, demande du 2026-10-23.
--
-- Deux droits, toujours sur cette seule table :
--   - UPDATE limité à la colonne `status` : elle « clôture » une demande traitée
--     (archivage natif de Directus) sans pouvoir réécrire son contenu ;
--   - DELETE : spam, demande d'effacement d'une personne (RGPD).
-- Le reste du schéma `app` (commandes, abonnés) reste invisible pour Directus.
-- Garde-fou : src/schema/directus-grants.test.ts.
GRANT UPDATE (status) ON app.contact_leads TO directus_user;
--> statement-breakpoint
GRANT DELETE ON app.contact_leads TO directus_user;
