-- ═══════════════════════════════════════════════════════════════════════════
-- Kirana Connect — Catalog System Update
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── MASTER PRODUCTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(200) NOT NULL,
  category            item_category NOT NULL,
  default_unit        VARCHAR(20) DEFAULT 'kg', -- kg, piece, pack
  default_image       TEXT,
  default_description TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RENAME items TO store_items (if it exists) ──────────────────────────────
-- Using a DO block to safely rename if 'items' exists and 'store_items' doesn't
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'items') AND
       NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'store_items') THEN
        ALTER TABLE items RENAME TO store_items;
    END IF;
END $$;

-- ─── UPDATE store_items SCHEMA ───────────────────────────────────────────────
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES master_products(id) ON DELETE SET NULL;
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Make columns nullable if they are coming from master_products
ALTER TABLE store_items ALTER COLUMN name DROP NOT NULL;
ALTER TABLE store_items ALTER COLUMN category DROP NOT NULL;

-- ─── STORE OWNER CONSTRAINTS ─────────────────────────────────────────────────
-- Ensure one user can only have one store
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_owner_id_key;
ALTER TABLE stores ADD CONSTRAINT stores_owner_id_key UNIQUE (owner_id);

-- Add owner fields to stores if not present (assuming users table is the source of truth,
-- but the request mentions "Store Detail" and "Store Owner Profile" separately)
-- We can add some redundant or specific profile fields to stores if needed.
-- But usually, we just join with users. Let's add 'owner_phone' and 'owner_name' 
-- just in case the owner wants to display a different public name/phone.
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_display_name VARCHAR(100);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_display_phone VARCHAR(15);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_photo_url TEXT;

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────
CREATE TRIGGER set_updated_at_master_products
  BEFORE UPDATE ON master_products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- If items was renamed, the old trigger might still work or need to be recreated/renamed
-- PostgreSQL usually renames the trigger automatically if the table is renamed.
