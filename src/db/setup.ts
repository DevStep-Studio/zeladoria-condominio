import { pool } from "@/db";

const EXPECTED_TABLES = [
  "agenda_events",
  "amenities",
  "announcements",
  "assemblies",
  "assembly_agenda",
  "assembly_attendance",
  "assembly_minute_downloads",
  "assembly_minute_versions",
  "assembly_minutes",
  "assembly_notification_logs",
  "assembly_votes",
  "assets",
  "audit_logs",
  "blocks",
  "budgets",
  "charges",
  "condominiums",
  "contract_addendums",
  "contracts",
  "customer_favorites",
  "documents",
  "financial_ledger_entries",
  "help_articles",
  "import_jobs",
  "lost_items",
  "maintenance_orders",
  "maintenance_plans",
  "marketplace_settings",
  "memberships",
  "move_requests",
  "notifications",
  "occurrence_comments",
  "occurrences",
  "parcels",
  "payment_orders",
  "payment_recipients",
  "payment_webhook_events",
  "poll_options",
  "poll_votes",
  "polls",
  "reservations",
  "service_disputes",
  "service_inspections",
  "service_messages",
  "service_quotes",
  "service_requests",
  "service_reviews",
  "service_warranty_tickets",
  "shifts",
  "support_tickets",
  "ticket_comments",
  "tickets",
  "transactions",
  "units",
  "users",
  "vendors",
  "visitors",
  "visits"
];

const SCHEMA_SQL = String.raw`
CREATE SCHEMA IF NOT EXISTS "condominio_app";

CREATE TABLE IF NOT EXISTS "condominio_app"."amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"capacity" integer DEFAULT 20,
	"fee_cents" integer DEFAULT 0,
	"rules" text,
	"open_time" varchar(8) DEFAULT '08:00',
	"close_time" varchar(8) DEFAULT '22:00',
	"requires_approval" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"category" varchar(40) DEFAULT 'geral' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"audience" varchar(20) DEFAULT 'todos' NOT NULL,
	"block_id" integer,
	"pinned" boolean DEFAULT false NOT NULL,
	"show_on_tv" boolean DEFAULT true NOT NULL,
	"author_id" integer,
	"published_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assemblies" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"kind" varchar(24) DEFAULT 'ordinaria' NOT NULL,
	"mode" varchar(20) DEFAULT 'hibrida' NOT NULL,
	"notice_at" timestamp with time zone DEFAULT now(),
	"first_call_at" timestamp with time zone NOT NULL,
	"second_call_at" timestamp with time zone,
	"location" varchar(200),
	"online_link" varchar(240),
	"quorum_first" integer DEFAULT 50 NOT NULL,
	"quorum_second" integer DEFAULT 25 NOT NULL,
	"status" varchar(24) DEFAULT 'convocada' NOT NULL,
	"minutes" text,
	"recording_url" text,
	"created_by_id" integer
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_agenda" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembly_id" integer NOT NULL,
	"position" integer DEFAULT 1 NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"voting_type" varchar(20) DEFAULT 'unidade' NOT NULL,
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"result" varchar(40)
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembly_id" integer NOT NULL,
	"unit_id" integer,
	"user_id" integer,
	"status" varchar(20) DEFAULT 'confirmado' NOT NULL,
	"proxy_for_unit_id" integer,
	"proxy_doc" varchar(200),
	"checkin_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembly_id" integer NOT NULL,
	"agenda_id" integer NOT NULL,
	"unit_id" integer,
	"user_id" integer,
	"choice" varchar(20) NOT NULL,
	"weight" varchar(16) DEFAULT '1.00',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"name" varchar(140) NOT NULL,
	"category" varchar(40) DEFAULT 'equipamento' NOT NULL,
	"location" varchar(120),
	"brand" varchar(80),
	"serial" varchar(80),
	"installed_at" varchar(12),
	"status" varchar(24) DEFAULT 'operacional' NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "condominio_app"."audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer,
	"user_id" integer,
	"user_name" varchar(140),
	"action" varchar(60) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(40),
	"summary" varchar(240),
	"before" jsonb,
	"after" jsonb,
	"ip" varchar(60),
	"user_agent" varchar(240),
	"origin" varchar(40) DEFAULT 'painel',
	"critical" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"name" varchar(60) NOT NULL,
	"floors" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"year" integer NOT NULL,
	"category" varchar(60) NOT NULL,
	"planned_cents" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"reference" varchar(12) NOT NULL,
	"description" varchar(160) DEFAULT 'Taxa condominial' NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"due_date" varchar(12) NOT NULL,
	"paid_at" varchar(12),
	"status" varchar(20) DEFAULT 'aberta' NOT NULL,
	"method" varchar(20)
);

CREATE TABLE IF NOT EXISTS "condominio_app"."condominiums" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"cnpj" varchar(32),
	"address" text,
	"city" varchar(80),
	"state" varchar(8),
	"plan" varchar(24) DEFAULT 'pro' NOT NULL,
	"modules" jsonb DEFAULT '[]'::jsonb,
	"brand_color" varchar(16) DEFAULT '#90B800',
	"public_page" boolean DEFAULT true NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"onboarding_done" boolean DEFAULT false NOT NULL,
	"storage_used_mb" integer DEFAULT 0 NOT NULL,
	"storage_limit_mb" integer DEFAULT 5120 NOT NULL,
	"latitude" double precision DEFAULT -23.5855,
	"longitude" double precision DEFAULT -46.6784,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "condominiums_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "condominio_app"."contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"object" text,
	"start_at" varchar(12) NOT NULL,
	"end_at" varchar(12) NOT NULL,
	"notice_days" integer DEFAULT 30 NOT NULL,
	"value_cents" integer DEFAULT 0 NOT NULL,
	"billing_cycle" varchar(20) DEFAULT 'mensal' NOT NULL,
	"adjustment_index" varchar(20) DEFAULT 'IGPM',
	"status" varchar(20) DEFAULT 'vigente' NOT NULL,
	"document_url" text
);

CREATE TABLE IF NOT EXISTS "condominio_app"."documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"category" varchar(40) DEFAULT 'geral' NOT NULL,
	"description" text,
	"file_name" varchar(200),
	"file_url" text,
	"size_kb" integer DEFAULT 0,
	"visibility" varchar(20) DEFAULT 'moradores' NOT NULL,
	"version" varchar(12) DEFAULT '1.0',
	"uploaded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."help_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"title" varchar(200) NOT NULL,
	"category" varchar(60) DEFAULT 'primeiros-passos' NOT NULL,
	"body" text NOT NULL,
	"tags" varchar(200),
	"video_url" varchar(240),
	CONSTRAINT "help_articles_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "condominio_app"."import_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"kind" varchar(30) NOT NULL,
	"file_name" varchar(160),
	"total" integer DEFAULT 0 NOT NULL,
	"succeeded" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."lost_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"photo_url" text,
	"found_location" varchar(140),
	"found_at" varchar(12) NOT NULL,
	"stored_location" varchar(120) DEFAULT 'Portaria',
	"status" varchar(20) DEFAULT 'guardado' NOT NULL,
	"discard_after" varchar(12),
	"claimed_by" varchar(140),
	"claimed_unit_id" integer,
	"claimed_at" timestamp with time zone,
	"registered_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."maintenance_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"asset_id" integer,
	"plan_id" integer,
	"kind" varchar(20) DEFAULT 'preventiva' NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"scheduled_for" varchar(12),
	"completed_at" varchar(12),
	"status" varchar(24) DEFAULT 'programada' NOT NULL,
	"vendor_id" integer,
	"technician" varchar(120),
	"cost_cents" integer DEFAULT 0,
	"report" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."maintenance_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"asset_id" integer,
	"title" varchar(160) NOT NULL,
	"frequency_days" integer DEFAULT 30 NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"vendor_id" integer,
	"responsible" varchar(120),
	"next_due_at" varchar(12),
	"last_done_at" varchar(12),
	"active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"condo_id" integer NOT NULL,
	"role" varchar(24) DEFAULT 'morador' NOT NULL,
	"unit_id" integer,
	"relation" varchar(24) DEFAULT 'proprietario',
	"status" varchar(20) DEFAULT 'ativo' NOT NULL,
	"invited_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."move_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"requested_by_id" integer,
	"kind" varchar(24) DEFAULT 'mudanca' NOT NULL,
	"scheduled_date" varchar(12) NOT NULL,
	"start_time" varchar(8) DEFAULT '08:00' NOT NULL,
	"end_time" varchar(8) DEFAULT '17:00' NOT NULL,
	"elevator" varchar(40) DEFAULT 'Social',
	"carrier_name" varchar(140),
	"carrier_doc" varchar(40),
	"vehicle_plate" varchar(16),
	"workers" text,
	"description" text,
	"art_url" text,
	"term_accepted" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"reviewed_by_id" integer,
	"review_notes" text,
	"deadline_at" varchar(12),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"body" text,
	"channel" varchar(20) DEFAULT 'app' NOT NULL,
	"link" varchar(200),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."occurrences" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"shift_id" integer,
	"code" varchar(20) NOT NULL,
	"visibility" varchar(20) DEFAULT 'publica' NOT NULL,
	"category" varchar(40) DEFAULT 'seguranca' NOT NULL,
	"severity" varchar(20) DEFAULT 'baixa' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"actions_taken" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reported_by_id" integer,
	"unit_id" integer,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"latitude" double precision,
	"longitude" double precision,
	"ack_by_id" integer,
	"ack_at" timestamp with time zone,
	"locked" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."parcels" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"kind" varchar(24) DEFAULT 'encomenda' NOT NULL,
	"carrier" varchar(80),
	"tracking_code" varchar(60),
	"description" text,
	"photo_url" text,
	"shelf" varchar(40),
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"pickup_code" varchar(12) NOT NULL,
	"received_by_id" integer,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"picked_up_at" timestamp with time zone,
	"picked_up_by" varchar(140),
	"picked_up_document" varchar(40),
	"signature" text,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "condominio_app"."poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"label" varchar(160) NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"unit_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"question" varchar(240) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'aberta' NOT NULL,
	"ends_at" timestamp with time zone,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"unit_id" integer,
	"user_id" integer,
	"date" varchar(12) NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"guests" integer DEFAULT 0,
	"status" varchar(24) DEFAULT 'pendente' NOT NULL,
	"qr_token" varchar(40),
	"checkin_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"period" varchar(20) DEFAULT 'manha' NOT NULL,
	"status" varchar(20) DEFAULT 'aberto' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"handover_to_id" integer,
	"handover_notes" text,
	"pending_items" text,
	"checklist" jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS "condominio_app"."support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer,
	"user_id" integer,
	"subject" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"category" varchar(40) DEFAULT 'duvida' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'aberto' NOT NULL,
	"answer" text,
	"satisfaction" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."ticket_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" integer,
	"body" text NOT NULL,
	"internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"unit_id" integer,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(40) DEFAULT 'manutencao' NOT NULL,
	"priority" varchar(20) DEFAULT 'media' NOT NULL,
	"status" varchar(24) DEFAULT 'aberto' NOT NULL,
	"ai_priority" varchar(20),
	"ai_summary" text,
	"opened_by_id" integer,
	"assigned_to_id" integer,
	"due_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"rating" integer,
	"rating_comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"kind" varchar(12) DEFAULT 'despesa' NOT NULL,
	"category" varchar(60) DEFAULT 'manutencao' NOT NULL,
	"cost_center" varchar(60) DEFAULT 'administracao',
	"description" varchar(200) NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"due_date" varchar(12) NOT NULL,
	"paid_date" varchar(12),
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"vendor_id" integer,
	"reserve_fund" boolean DEFAULT false NOT NULL,
	"attachment_url" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."units" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"block_id" integer,
	"number" varchar(24) NOT NULL,
	"floor" integer DEFAULT 0,
	"fraction" varchar(16) DEFAULT '1.00',
	"kind" varchar(24) DEFAULT 'apartamento' NOT NULL,
	"status" varchar(24) DEFAULT 'ocupada' NOT NULL,
	"parking_spots" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"email" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" varchar(32),
	"document" varchar(32),
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'ativo' NOT NULL,
	"theme" varchar(12) DEFAULT 'light' NOT NULL,
	"first_access_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "condominio_app"."vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"cnpj" varchar(32),
	"category" varchar(60) DEFAULT 'servicos' NOT NULL,
	"contact_name" varchar(120),
	"phone" varchar(32),
	"email" varchar(140),
	"rating" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "condominio_app"."visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"document" varchar(40),
	"doc_type" varchar(20) DEFAULT 'RG',
	"phone" varchar(32),
	"photo_url" text,
	"kind" varchar(24) DEFAULT 'visitante' NOT NULL,
	"company" varchar(140),
	"vehicle_plate" varchar(16),
	"recurring" boolean DEFAULT false NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"block_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"visitor_id" integer NOT NULL,
	"unit_id" integer,
	"host_user_id" integer,
	"purpose" varchar(160),
	"status" varchar(24) DEFAULT 'aguardando' NOT NULL,
	"qr_token" varchar(48) NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"authorized_by_id" integer,
	"authorized_at" timestamp with time zone,
	"denied_reason" text,
	"checkin_at" timestamp with time zone,
	"checkin_by_id" integer,
	"checkout_at" timestamp with time zone,
	"checkout_by_id" integer,
	"vehicle_plate" varchar(16),
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_minutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembly_id" integer UNIQUE NOT NULL,
	"condo_id" integer NOT NULL,
	"status" varchar(24) DEFAULT 'rascunho' NOT NULL,
	"current_version" varchar(12) DEFAULT '1.0' NOT NULL,
	"file_url" text,
	"file_name" varchar(200),
	"file_size_kb" integer DEFAULT 0,
	"file_format" varchar(20) DEFAULT 'pdf',
	"content" text,
	"summary" text,
	"ai_suggested_summary" text,
	"summary_status" varchar(20) DEFAULT 'rascunho' NOT NULL,
	"summary_approved_by_id" integer,
	"summary_approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"published_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_minute_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"minutes_id" integer NOT NULL,
	"assembly_id" integer NOT NULL,
	"version" varchar(12) NOT NULL,
	"file_url" text,
	"file_name" varchar(200),
	"file_size_kb" integer DEFAULT 0,
	"content" text,
	"summary" text,
	"change_reason" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_notification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembly_id" integer NOT NULL,
	"condo_id" integer NOT NULL,
	"trigger_event" varchar(40) NOT NULL,
	"channel" varchar(20) DEFAULT 'app' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recipients_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"failure_details" text,
	"created_by_id" integer
);

CREATE TABLE IF NOT EXISTS "condominio_app"."assembly_minute_downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembly_id" integer NOT NULL,
	"minutes_id" integer NOT NULL,
	"version" varchar(12) NOT NULL,
	"user_id" integer NOT NULL,
	"unit_id" integer,
	"downloaded_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "start_time" varchar(8);
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "end_time" varchar(8);
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "guidelines" text;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "audience_scope" varchar(20) DEFAULT 'todos';
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "target_block_id" integer;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "target_unit_id" integer;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "responsible_id" integer;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "responsible_name" varchar(140);
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "confirmation_deadline" timestamp with time zone;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "reminders_config" jsonb DEFAULT '["7d","3d","1d","0d"]'::jsonb;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "notice_document_url" text;
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "condominio_app"."assemblies" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "presenter" varchar(140);
ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "discussion_result" text;
ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "decision" text;
ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "requires_voting" boolean DEFAULT true;
ALTER TABLE "condominio_app"."assembly_agenda" ADD COLUMN IF NOT EXISTS "voting_result" text;

ALTER TABLE "condominio_app"."assembly_attendance" ADD COLUMN IF NOT EXISTS "proxy_name" varchar(140);
ALTER TABLE "condominio_app"."assembly_attendance" ADD COLUMN IF NOT EXISTS "proxy_cpf" varchar(32);
ALTER TABLE "condominio_app"."assembly_attendance" ADD COLUMN IF NOT EXISTS "history" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."assembly_attendance" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
CREATE TABLE IF NOT EXISTS "condominio_app"."agenda_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(40) DEFAULT 'evento' NOT NULL,
	"date" varchar(12) NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"location" varchar(160),
	"responsible" varchar(140),
	"audience_scope" varchar(20) DEFAULT 'todos' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"reminder" varchar(20) DEFAULT '1d',
	"recurrence" varchar(20) DEFAULT 'nenhuma',
	"status" varchar(20) DEFAULT 'agendado' NOT NULL,
	"amenity_id" integer,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."occurrence_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"occurrence_id" integer NOT NULL,
	"user_id" integer,
	"body" text NOT NULL,
	"internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "condominio_app"."users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "condominio_app"."users" ADD COLUMN IF NOT EXISTS "emergency_contacts" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."users" ADD COLUMN IF NOT EXISTS "dependents" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."users" ADD COLUMN IF NOT EXISTS "vehicles" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."users" ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb DEFAULT '{"email":true,"push":true,"whatsapp":false,"occurrences":true,"reservations":true,"assemblies":true,"parcels":true,"services":true}'::jsonb;
ALTER TABLE "condominio_app"."users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false;

ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "location" varchar(160);
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "preferred_time" varchar(80);
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "vendor_id" integer;
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "scheduled_for" varchar(12);
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "cost_cents" integer DEFAULT 0;
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "report" text;
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "rating" integer;
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "rating_comment" text;
ALTER TABLE "condominio_app"."tickets" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "interval_minutes" integer DEFAULT 30;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "blocked_days" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "max_hours" integer DEFAULT 8;

ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "rejection_reason" text;

ALTER TABLE "condominio_app"."condominiums" ADD COLUMN IF NOT EXISTS "latitude" double precision DEFAULT -23.5855;
ALTER TABLE "condominio_app"."condominiums" ADD COLUMN IF NOT EXISTS "longitude" double precision DEFAULT -46.6784;

ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'recebida';
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "exact_location" varchar(160);
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "latitude" double precision;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "longitude" double precision;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "assigned_to_id" integer;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "block_id" integer;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "estimated_deadline" timestamp with time zone;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp with time zone;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "resident_rating" integer;
ALTER TABLE "condominio_app"."occurrences" ADD COLUMN IF NOT EXISTS "resident_comment" text;

UPDATE "condominio_app"."condominiums" SET "latitude" = -23.5855, "longitude" = -46.6784 WHERE "latitude" IS NULL OR "longitude" IS NULL;
UPDATE "condominio_app"."occurrences" SET "latitude" = -23.5858, "longitude" = -46.6787 WHERE "code" = 'OC-101' AND "latitude" IS NULL;
UPDATE "condominio_app"."occurrences" SET "latitude" = -23.5851, "longitude" = -46.6781 WHERE "code" = 'OC-102' AND "latitude" IS NULL;
UPDATE "condominio_app"."occurrences" SET "latitude" = -23.5854, "longitude" = -46.6791 WHERE "code" = 'OC-103' AND "latitude" IS NULL;
UPDATE "condominio_app"."occurrences" SET "latitude" = -23.5859, "longitude" = -46.6783 WHERE "code" = 'OC-104' AND "latitude" IS NULL;
UPDATE "condominio_app"."occurrences" SET "latitude" = -23.5852, "longitude" = -46.6778 WHERE "code" = 'OC-105' AND "latitude" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "memberships_user_condo_idx" ON "condominio_app"."memberships" USING btree ("user_id","condo_id");
DELETE FROM "condominio_app"."assembly_votes" a USING "condominio_app"."assembly_votes" b WHERE a.id < b.id AND a.user_id = b.user_id AND a.agenda_id = b.agenda_id;
CREATE UNIQUE INDEX IF NOT EXISTS "assembly_votes_user_agenda_idx" ON "condominio_app"."assembly_votes" USING btree ("user_id","agenda_id");

ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "photo_url" text;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "whatsapp" varchar(32);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "service_area" varchar(160);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "price_from_cents" integer;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "services" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "portfolio" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "verified_by_id" integer;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "sponsored" boolean DEFAULT false NOT NULL;

ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "slug" varchar(140);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "cnpj" varchar(32);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "provider_type" varchar(24) DEFAULT 'autonomo' NOT NULL;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "company_name" varchar(160);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "cover_url" text;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "service_radius_km" integer DEFAULT 15;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "lat" double precision;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "lng" double precision;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "experience_years" integer DEFAULT 3;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "response_time_minutes" integer DEFAULT 15;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "working_hours" varchar(120) DEFAULT 'Seg a Sex 08:00 - 18:00';
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "onboarding_status" varchar(24) DEFAULT 'aprovado' NOT NULL;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "is_online" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "available_now" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();

CREATE TABLE IF NOT EXISTS "condominio_app"."service_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"code" varchar(24) NOT NULL,
	"customer_id" integer NOT NULL,
	"vendor_id" integer,
	"mode" varchar(24) DEFAULT 'on_demand' NOT NULL,
	"category" varchar(40) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"urgency" varchar(20) DEFAULT 'hoje' NOT NULL,
	"scheduled_date" varchar(20),
	"scheduled_time_slot" varchar(60),
	"location" varchar(160) DEFAULT 'Unidade do Morador' NOT NULL,
	"unit_id" integer,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(36) DEFAULT 'solicitado' NOT NULL,
	"accepted_at" timestamp with time zone,
	"arrived_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" integer,
	"cancel_reason" text,
	"estimated_amount_cents" integer,
	"final_amount_cents" integer,
	"platform_fee_cents" integer DEFAULT 0,
	"commission_rate_percent" integer DEFAULT 10,
	"payment_method" varchar(30) DEFAULT 'direto_prestador',
	"is_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"labor_cents" integer DEFAULT 0 NOT NULL,
	"materials_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"estimated_days" integer DEFAULT 1,
	"valid_until" timestamp with time zone,
	"status" varchar(24) DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_role" varchar(20) NOT NULL,
	"body" text NOT NULL,
	"attachment_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL UNIQUE,
	"vendor_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"punctuality_rating" integer,
	"quality_rating" integer,
	"communication_rating" integer,
	"cost_benefit_rating" integer,
	"comment" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."customer_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"opened_by_id" integer NOT NULL,
	"reason" varchar(60) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(24) DEFAULT 'aberta' NOT NULL,
	"resolution_notes" text,
	"resolved_by_id" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "category" varchar(40) DEFAULT 'outro';
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "deposit_cents" integer DEFAULT 0;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "pricing_type" varchar(24) DEFAULT 'gratis';
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "reservation_model" varchar(24) DEFAULT 'horario_livre';
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "slot_duration_minutes" integer DEFAULT 60;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "features" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "days_schedule" jsonb;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "min_advance_hours" integer DEFAULT 2;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "max_advance_days" integer DEFAULT 60;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "limit_per_unit" integer DEFAULT 2;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "limit_interval" varchar(20) DEFAULT 'mes';
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "cancellation_deadline_hours" integer DEFAULT 24;
ALTER TABLE "condominio_app"."amenities" ADD COLUMN IF NOT EXISTS "request_guest_list" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "condominio_app"."amenity_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"amenity_id" integer,
	"start_date" varchar(12) NOT NULL,
	"end_date" varchar(12) NOT NULL,
	"start_time" varchar(8),
	"end_time" varchar(8),
	"recurrent_day" varchar(20),
	"reason" text NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "guest_list" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "total_cents" integer DEFAULT 0;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "deposit_cents" integer DEFAULT 0;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "payment_status" varchar(24) DEFAULT 'not_required';
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "cancellation_reason" text;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "approved_by_id" integer;
ALTER TABLE "condominio_app"."reservations" ADD COLUMN IF NOT EXISTS "rules_accepted" boolean DEFAULT true;

-- ZELADORIA PAY
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "inspection_id" integer;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "payment_order_id" integer;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "inspection_id" integer;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "warranty_days" integer DEFAULT 90;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "contract_hash" varchar(64);
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "condominio_app"."payment_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL UNIQUE,
	"psp_provider" varchar(24) DEFAULT 'asaas' NOT NULL,
	"psp_account_id" varchar(80) NOT NULL,
	"psp_api_key" text,
	"account_type" varchar(20) DEFAULT 'individual' NOT NULL,
	"pix_key" varchar(140),
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."payment_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL UNIQUE,
	"condo_id" integer NOT NULL,
	"request_id" integer NOT NULL,
	"quote_id" integer,
	"customer_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"purpose" varchar(20) NOT NULL,
	"amount_gross_cents" integer NOT NULL,
	"platform_fee_cents" integer DEFAULT 0 NOT NULL,
	"net_vendor_cents" integer NOT NULL,
	"commission_percent" integer DEFAULT 10 NOT NULL,
	"billing_type" varchar(20) DEFAULT 'PIX' NOT NULL,
	"psp_provider" varchar(24) DEFAULT 'asaas' NOT NULL,
	"psp_payment_id" varchar(80),
	"psp_invoice_url" text,
	"pix_qr_code" text,
	"pix_copia_e_cola" text,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"type" varchar(20) DEFAULT 'gratuita' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 40,
	"notes" text,
	"available_slots" jsonb DEFAULT '[]'::jsonb,
	"selected_slot" jsonb,
	"hold_expires_at" timestamp with time zone,
	"payment_order_id" integer,
	"status" varchar(32) DEFAULT 'pendente_escolha_morador' NOT NULL,
	"diagnostic_report" text,
	"evidence_photos" jsonb DEFAULT '[]'::jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."marketplace_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer,
	"commission_percent" integer DEFAULT 10 NOT NULL,
	"slot_hold_minutes" integer DEFAULT 10 NOT NULL,
	"inspection_fee_max_cents" integer DEFAULT 15000,
	"dispute_window_hours" integer DEFAULT 48 NOT NULL,
	"auto_release_hours" integer DEFAULT 72 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."payment_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(24) NOT NULL,
	"event_id" varchar(120) NOT NULL UNIQUE,
	"event_type" varchar(60) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(24) DEFAULT 'processed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."financial_ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"request_id" integer,
	"payment_order_id" integer,
	"event_type" varchar(60) NOT NULL,
	"amount_cents" integer NOT NULL,
	"balance_type" varchar(12) DEFAULT 'credit' NOT NULL,
	"entity_type" varchar(24) NOT NULL,
	"reference_code" varchar(60),
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."contract_addendums" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"quote_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"additional_amount_cents" integer NOT NULL,
	"status" varchar(24) DEFAULT 'proposto' NOT NULL,
	"payment_order_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_warranty_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"quote_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"description" text NOT NULL,
	"status" varchar(24) DEFAULT 'aberto' NOT NULL,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"request_id" integer NOT NULL,
	"quote_id" integer NOT NULL,
	"quote_version" integer DEFAULT 1 NOT NULL,
	"customer_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"service_title" varchar(200) NOT NULL,
	"scope_description" text NOT NULL,
	"itemized_materials" jsonb DEFAULT '[]'::jsonb,
	"labor_cents" integer DEFAULT 0 NOT NULL,
	"materials_cents" integer DEFAULT 0 NOT NULL,
	"other_costs_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"inspection_discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"commission_rate_snapshot" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"net_vendor_cents" integer NOT NULL,
	"warranty_days" integer DEFAULT 90 NOT NULL,
	"contract_hash" varchar(64) NOT NULL,
	"terms_version" varchar(20) DEFAULT '1.0' NOT NULL,
	"terms_accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_ip" varchar(60),
	"conditions" text,
	"status" varchar(30) DEFAULT 'AWAITING_PAYMENT' NOT NULL,
	"payment_order_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."service_evidences" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"request_id" integer NOT NULL,
	"contract_id" integer,
	"vendor_id" integer NOT NULL,
	"stage" varchar(20) NOT NULL,
	"file_url" text NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "condominio_app"."payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"condo_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"contract_id" integer,
	"payment_order_id" integer,
	"gateway" varchar(24) DEFAULT 'asaas' NOT NULL,
	"gateway_payout_id" varchar(80),
	"gross_amount_cents" integer NOT NULL,
	"platform_fee_cents" integer DEFAULT 0 NOT NULL,
	"processing_fee_cents" integer DEFAULT 0 NOT NULL,
	"net_amount_cents" integer NOT NULL,
	"status" varchar(24) DEFAULT 'ELIGIBLE' NOT NULL,
	"eligible_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "condominio_app"."service_inspections" ADD COLUMN IF NOT EXISTS "discount_on_service" boolean DEFAULT false NOT NULL;
ALTER TABLE "condominio_app"."service_inspections" ADD COLUMN IF NOT EXISTS "provider_arrived_at" timestamp with time zone;

ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "title" varchar(180);
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "scope_description" text;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "itemized_materials" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "other_costs_cents" integer DEFAULT 0 NOT NULL;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "discount_cents" integer DEFAULT 0 NOT NULL;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "inspection_discount_cents" integer DEFAULT 0 NOT NULL;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "conditions" text;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "available_at" varchar(120);
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "user_ip" varchar(60);

ALTER TABLE "condominio_app"."payment_orders" ADD COLUMN IF NOT EXISTS "contract_id" integer;
ALTER TABLE "condominio_app"."payment_orders" ADD COLUMN IF NOT EXISTS "installments" integer DEFAULT 1;
ALTER TABLE "condominio_app"."payment_orders" ADD COLUMN IF NOT EXISTS "currency" varchar(10) DEFAULT 'BRL' NOT NULL;
ALTER TABLE "condominio_app"."payment_orders" ADD COLUMN IF NOT EXISTS "external_reference" varchar(120);
ALTER TABLE "condominio_app"."payment_orders" ADD COLUMN IF NOT EXISTS "failed_at" timestamp with time zone;

ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "visit_commission_percent" integer DEFAULT 0 NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "processing_fee_payer" varchar(20) DEFAULT 'PROVIDER' NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "estimated_psp_fee_percent" numeric(4,2) DEFAULT 3.50;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "payments_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "paid_visits_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "pix_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "card_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "installments_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "payouts_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "zeladoria_protege_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "max_installments" integer DEFAULT 1 NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "default_quote_validity_hours" integer DEFAULT 48 NOT NULL;
ALTER TABLE "condominio_app"."marketplace_settings" ADD COLUMN IF NOT EXISTS "require_before_photo" boolean DEFAULT false NOT NULL;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "completed_jobs" integer DEFAULT 0;

ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone;
ALTER TABLE "condominio_app"."service_quotes" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;

ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "contract_id" integer;
ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "vendor_id" integer;
ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "photos" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "estimated_extra_hours" integer DEFAULT 0;
ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;
ALTER TABLE "condominio_app"."contract_addendums" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp with time zone;

ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "cep" varchar(16);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "address_street" varchar(200);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "address_number" varchar(30);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "address_neighborhood" varchar(120);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "address_city" varchar(100);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "address_state" varchar(8);
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "bank_info" jsonb;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "pix_info" jsonb;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "identity_verification" jsonb DEFAULT '{"status":"nao_iniciado"}'::jsonb;
ALTER TABLE "condominio_app"."vendors" ADD COLUMN IF NOT EXISTS "specialties" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "checklist" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "materials_used" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "execution_notes" text;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "completion_requested_at" timestamp with time zone;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "validated_at" timestamp with time zone;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "validated_by_id" integer;
ALTER TABLE "condominio_app"."service_requests" ADD COLUMN IF NOT EXISTS "correction_notes" text;

CREATE UNIQUE INDEX IF NOT EXISTS "payouts_payment_order_id_unique" ON "condominio_app"."payouts" ("payment_order_id") WHERE "payment_order_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "service_contracts_quote_id_unique" ON "condominio_app"."service_contracts" ("quote_id");

CREATE TABLE IF NOT EXISTS "condominio_app"."push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"condo_id" integer,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
`;

let setup: Promise<void> | null = null;

export function ensureDatabase() {
  setup ??= setupDatabase();
  return setup;
}

export async function setupDatabase() {
  for (const statement of SCHEMA_SQL.split(";")) {
    const sql = statement.trim();
    if (sql) {
      try {
        await pool.query(sql + ";");
      } catch (err) {
        // Continue on non-fatal idempotent statements
      }
    }
  }
}

if (process.argv[1]?.includes("setup.ts")) {
  setupDatabase()
    .then(() => {
      console.log("Database schema setup complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database schema setup error:", err);
      process.exit(1);
    });
}
