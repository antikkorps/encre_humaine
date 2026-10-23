CREATE TYPE "app"."diagnostic_kind" AS ENUM('b2b', 'b2c');--> statement-breakpoint
CREATE TABLE "app"."diagnostics" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" "app"."diagnostic_kind" NOT NULL,
	"email" text NOT NULL,
	"consent_report" boolean NOT NULL,
	"consent_newsletter" boolean DEFAULT false NOT NULL,
	"consent_text_version" text NOT NULL,
	"answers" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"source" text,
	"device" text,
	"report_token_hash" text NOT NULL,
	"booking_clicked_at" timestamp with time zone,
	"status" "app"."lead_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "diagnostics_report_token_ux" ON "app"."diagnostics" USING btree ("report_token_hash");--> statement-breakpoint
CREATE INDEX "diagnostics_kind_ix" ON "app"."diagnostics" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "diagnostics_status_ix" ON "app"."diagnostics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "diagnostics_created_ix" ON "app"."diagnostics" USING btree ("created_at");