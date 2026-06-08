import { timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/**
 * Helpers de colonnes — docs/01-data-model.md §3.
 * Fonctions (et non instances partagées) pour produire un builder neuf par
 * table : réutiliser une même instance entre tables est un piège Drizzle.
 *
 * Conventions : PK uuid v7 généré côté app (triable, non énumérable) ;
 * timestamps `timestamptz` avec défaut `now()`.
 */

export const primaryId = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7());

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
