-- Worker management + order assignment

-- Map workers to stores (one worker can belong to one store).
CREATE TABLE IF NOT EXISTS store_workers (
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  worker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_store_workers_store ON store_workers(store_id);
CREATE INDEX IF NOT EXISTS idx_store_workers_worker ON store_workers(worker_id);

-- Worker busy status (one active order at a time).
CREATE TABLE IF NOT EXISTS worker_status (
  worker_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  is_busy         BOOLEAN NOT NULL DEFAULT FALSE,
  active_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_status_store ON worker_status(store_id);
CREATE INDEX IF NOT EXISTS idx_worker_status_busy ON worker_status(is_busy);

-- Orders assigned to a worker.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_worker ON orders(assigned_worker_id);
