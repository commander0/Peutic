-- Migration: Add dashboard_broadcast_message to global_settings
ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS dashboard_broadcast_message TEXT;

-- Update the first row (id=1) to ensure it's initialized correctly if needed
UPDATE global_settings SET dashboard_broadcast_message = '' WHERE id = 1 AND dashboard_broadcast_message IS NULL;
