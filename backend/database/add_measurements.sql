ALTER TABLE size_controls
ADD COLUMN IF NOT EXISTS measurements JSONB;
