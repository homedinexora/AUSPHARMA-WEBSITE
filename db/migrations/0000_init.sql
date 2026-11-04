CREATE TYPE "public"."batch_status" AS ENUM('draft', 'published', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."drug_schedule" AS ENUM('H', 'H1', 'X', 'G', 'OTC');--> statement-breakpoint
CREATE TYPE "public"."insert_kind" AS ENUM('prescribing_information', 'patient_leaflet');--> statement-breakpoint
CREATE TYPE "public"."pil_status" AS ENUM('draft', 'published', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"batch_no" text NOT NULL,
	"mfg_date" date,
	"expiry_date" date,
	"mrp_paise" integer,
	"coa_blob" text,
	"pil_version_id" integer,
	"status" "batch_status" DEFAULT 'draft' NOT NULL,
	"withdrawn_reason" text,
	"created_by" text,
	"approved_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_no_format" CHECK ("batches"."batch_no" ~ '^[A-Z0-9-]{1,40}$')
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"pin_code" char(6),
	"licence_numbers" text,
	"who_gmp_certificate_no" text,
	"who_gmp_issuer" text,
	"who_gmp_valid_until" date,
	"who_gmp_certificate_blob" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pil_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"kind" "insert_kind" DEFAULT 'prescribing_information' NOT NULL,
	"version" text NOT NULL,
	"revision_date" text,
	"pdf_blob" text,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "pil_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"approved_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"item_id" text PRIMARY KEY NOT NULL,
	"gtin" char(13),
	"brand" text,
	"brand_name" text NOT NULL,
	"classification" text,
	"category" text,
	"composition" text NOT NULL,
	"dosage_form" text,
	"pack_size" text,
	"pack_type" text,
	"schedule" "drug_schedule",
	"therapy" text,
	"manufacturer_id" text,
	"manufacturing_licence_no" text,
	"marketed_by" text DEFAULT 'Auspharma Private Limited' NOT NULL,
	"mrp_paise" integer,
	"mrp_per" text,
	"storage" text,
	"shelf_life_months" integer,
	"pack_image_blob" text,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_gtin_unique" UNIQUE("gtin"),
	CONSTRAINT "gtin_13_digits" CHECK ("products"."gtin" IS NULL OR "products"."gtin" ~ '^[0-9]{13}$')
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_product_id_products_item_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_pil_version_id_pil_versions_id_fk" FOREIGN KEY ("pil_version_id") REFERENCES "public"."pil_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pil_versions" ADD CONSTRAINT "pil_versions_product_id_products_item_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_product_batch_uq" ON "batches" USING btree ("product_id","batch_no");--> statement-breakpoint
CREATE UNIQUE INDEX "pil_versions_product_version_uq" ON "pil_versions" USING btree ("product_id","version");--> statement-breakpoint
CREATE INDEX "products_therapy_idx" ON "products" USING btree ("therapy");