-- « Diagnostics reçus » dans l'admin Directus — docs/11-diagnostics.md.
-- Même règle que les demandes de contact (migration 0003) : Éléonore lit,
-- range (statut seul) et supprime ; le contenu d'un diagnostic ne se réécrit
-- jamais. Garde-fou : src/schema/directus-grants.test.ts.
GRANT SELECT ON app.diagnostics TO directus_user;
--> statement-breakpoint
GRANT UPDATE (status) ON app.diagnostics TO directus_user;
--> statement-breakpoint
GRANT DELETE ON app.diagnostics TO directus_user;
