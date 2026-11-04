CREATE TABLE "patient_guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"version" text NOT NULL,
	"content" jsonb NOT NULL,
	"pdf_blob" text,
	"status" "pil_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"approved_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient_guides" ADD CONSTRAINT "patient_guides_product_id_products_item_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_guides_product_version_uq" ON "patient_guides" USING btree ("product_id","version");