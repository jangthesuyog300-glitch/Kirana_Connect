-- ═══════════════════════════════════════════════════════════════════════════
-- Kirana Connect — PostgreSQL Schema
-- Run via: psql $DATABASE_URL -f 001_initial.sql
-- Supabase: paste into SQL editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable PostGIS for geo queries (Supabase has this by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(15) UNIQUE NOT NULL,
  name          VARCHAR(100),
  email         VARCHAR(100),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer | store_owner
  onesignal_id  TEXT,                                    -- for push notifications
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STORES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(150) NOT NULL,
  description       TEXT,
  image_url         TEXT,
  phone             VARCHAR(15),
  address           TEXT,
  location          GEOGRAPHY(POINT, 4326),   -- PostGIS geo point (lng, lat)
  rating            NUMERIC(3,2) DEFAULT 0,
  total_ratings     INTEGER DEFAULT 0,
  is_open           BOOLEAN DEFAULT TRUE,
  delivery_enabled  BOOLEAN DEFAULT TRUE,
  delivery_radius   NUMERIC(5,2) DEFAULT 5.0, -- km
  min_order_amount  NUMERIC(10,2) DEFAULT 0,
  opening_time      TIME DEFAULT '08:00',
  closing_time      TIME DEFAULT '22:00',
  commission_rate   NUMERIC(5,4) DEFAULT 0.02, -- 2%
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_location ON stores USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);

-- ─── ITEM CATEGORIES ─────────────────────────────────────────────────────────
CREATE TYPE item_category AS ENUM (
  'Biscuits & Snacks',
  'Wafers & Chips',
  'Beverages',
  'Dairy',
  'Grocery Staples',
  'Cleaning & Washing',
  'Personal Care',
  'Packaged Foods',
  'Spices',
  'Oils & Ghee'
);

-- ─── ITEMS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  category        item_category NOT NULL,
  image_url       TEXT,
  price_per_kg    NUMERIC(10,2),              -- for weight-based items
  price_per_unit  NUMERIC(10,2),              -- for unit-based items
  is_weight_based BOOLEAN DEFAULT TRUE,
  unit            VARCHAR(20) DEFAULT 'kg',   -- kg, g, piece, pack
  stock_qty       NUMERIC(10,3) DEFAULT 0,    -- in kg or units
  low_stock_alert NUMERIC(10,3) DEFAULT 1,    -- alert threshold
  is_available    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_store ON items(store_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE TYPE order_status AS ENUM (
  'placed',
  'accepted',
  'rejected',
  'preparing',
  'ready',
  'dispatched',
  'delivered',
  'collected',
  'cancelled'
);

CREATE TYPE delivery_type AS ENUM ('delivery', 'pickup');
CREATE TYPE payment_method AS ENUM ('upi', 'card', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES users(id),
  store_id          UUID NOT NULL REFERENCES stores(id),
  status            order_status NOT NULL DEFAULT 'placed',
  delivery_type     delivery_type NOT NULL DEFAULT 'delivery',
  delivery_address  TEXT,
  payment_method    payment_method NOT NULL DEFAULT 'cash',
  payment_status    payment_status NOT NULL DEFAULT 'pending',
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee      NUMERIC(10,2) DEFAULT 0,
  total_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  otp               VARCHAR(6),               -- for pickup verification
  prep_time_minutes INTEGER,
  cashfree_order_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id      UUID NOT NULL REFERENCES items(id),
  item_name    VARCHAR(200) NOT NULL,         -- snapshot at time of order
  category     item_category NOT NULL,
  quantity     NUMERIC(10,3) NOT NULL,        -- grams or units
  unit         VARCHAR(20) NOT NULL,
  price_per_kg NUMERIC(10,2),
  unit_price   NUMERIC(10,2) NOT NULL,        -- price at time of order
  total_price  NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─── STORE TRANSACTIONS (Financial Ledger) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS store_transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          UUID NOT NULL REFERENCES stores(id),
  order_id          UUID NOT NULL REFERENCES orders(id),
  total_amount      NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  net_amount        NUMERIC(10,2) NOT NULL,
  payment_method    payment_method NOT NULL,
  payment_status    payment_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_store ON store_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON store_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON store_transactions(created_at);

-- ─── RATINGS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id),
  order_id    UUID NOT NULL REFERENCES orders(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, customer_id)
);

-- ─── FAVOURITES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, store_id)
);

-- ─── OTP STORE ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone      VARCHAR(15) NOT NULL,
  otp        VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_stores
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_items
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
