-- Admin KYC Management Migration
-- Run this after init.sql

-- Add rejection_reason and reviewed_by to kyc_documents
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add document_file_url for actual file uploads (separate from document_url text reference)
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS document_file_url TEXT;

-- Allow multiple KYC submissions per user (one per attempt, track history)
-- The existing UNIQUE constraint on user_id in kyc_documents means only one record per user.
-- We'll keep this but use ON CONFLICT DO UPDATE to update existing record with new submission.

-- Ensure kyc_documents has submitted_at for ordering
-- (already exists in init.sql)

-- Seed: Create first admin user
-- Replace 'admin@dkart.com' with the actual admin email before running.
-- The admin user can log in via OTP with this email.
INSERT INTO users (email, is_verified, role, status)
VALUES ('admin@dkart.com', TRUE, 'admin', 'Active')
ON CONFLICT (email) DO UPDATE
  SET role = 'admin', is_verified = TRUE;

-- Optionally create a profile for the admin
INSERT INTO user_profiles (user_id, first_name, last_name)
SELECT id, 'Admin', 'DKart' FROM users WHERE email = 'admin@dkart.com'
ON CONFLICT (user_id) DO NOTHING;
