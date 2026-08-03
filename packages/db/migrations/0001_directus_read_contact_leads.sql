-- Directus lit les messages du formulaire pour les afficher dans l'admin
-- (« Messages reçus », lecture seule) — docs/09-contact.md.
--
-- Ce GRANT vit dans une migration, et pas dans `infra/postgres/init.sql`, parce
-- qu'`init.sql` s'exécute à la CRÉATION du cluster : la table n'existe pas encore
-- à ce moment-là (elle est créée par la migration 0000). Le placer ici garantit
-- qu'il s'applique après, et à chaque déploiement — donc aussi sur les bases déjà
-- en service, sans commande manuelle.
--
-- Portée volontairement étroite : SELECT sur cette seule table. Aucune écriture,
-- et rien sur les autres tables applicatives (commandes, abonnés…).
GRANT USAGE ON SCHEMA app TO directus_user;
--> statement-breakpoint
GRANT SELECT ON app.contact_leads TO directus_user;
