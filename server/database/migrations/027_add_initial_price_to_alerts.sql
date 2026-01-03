-- Add initial_price column to price_alerts table
-- This stores the price when the alert was created for progress calculation

ALTER TABLE price_alerts 
ADD COLUMN IF NOT EXISTS initial_price DECIMAL(20, 8);

-- Update existing alerts to set initial_price = current_price where null
UPDATE price_alerts 
SET initial_price = current_price 
WHERE initial_price IS NULL AND current_price IS NOT NULL;

-- For alerts without current_price, set initial_price = target_price
UPDATE price_alerts 
SET initial_price = target_price 
WHERE initial_price IS NULL;
