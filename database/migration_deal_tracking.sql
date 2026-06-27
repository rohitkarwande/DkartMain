-- Deal tracking migration: enhance inquiry status pipeline
-- Statuses: Pending → In Progress → Deal Locked → Closed / Rejected

-- Update inquiry status check constraint to include new statuses
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Update default check (PostgreSQL allows all values via no CHECK, or redeclare)
-- We handle validation in application layer for flexibility.

-- Index for fast admin funnel query
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
