-- Add dedicated pickup OTP fields on orders.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ;

-- Backfill from legacy otp column when present.
UPDATE orders
SET otp_code = otp
WHERE otp_code IS NULL
  AND otp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_otp_code ON orders(otp_code);
CREATE INDEX IF NOT EXISTS idx_orders_otp_expiry ON orders(otp_expiry);
