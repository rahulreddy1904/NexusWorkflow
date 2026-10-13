-- Migration 004: Workspace Join Codes for Collaborative Team Onboarding
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS join_code VARCHAR(32);
UPDATE workspaces SET join_code = 'NX-DEMO-2026' WHERE slug = 'acme-ops' AND (join_code IS NULL OR join_code = '');
