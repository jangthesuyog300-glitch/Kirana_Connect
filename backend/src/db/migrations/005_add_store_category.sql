-- Add category column to stores table
ALTER TABLE stores ADD COLUMN category VARCHAR(50);

-- Update existing stores with default categories
UPDATE stores SET category = 'Grocery' WHERE category IS NULL;
