-- E-Tax System Somaliland - MySQL seed data (reference)
--
-- OPTIONAL. The recommended way to seed data is:
--   cd backend && python -m database.seed
-- which works against whichever DATABASE_URL is configured (SQLite or
-- MySQL) and always uses fresh, correctly-hashed credentials.
--
-- This file is provided for DBA reference / pure-SQL environments. It
-- assumes database/schema.sql has already been applied.
--
-- IMPORTANT: This seeds only reference/config data - the admin account,
-- cities, and the three supported tax types. It creates NO citizens,
-- payments, or receipts: every taxpayer and payment record must come from
-- a real registration/transaction, never from seed data (see
-- backend/database/seed.py, the source of truth this file mirrors).
--
-- The admin password below (1234) is a placeholder - change it before
-- any non-local use.
--
-- Usage:
--   mysql -u root -p etax_somaliland < database/seed.sql

USE etax_somaliland;

-- ---------------------------------------------------------------------
-- Admin account (username: admin / password: 1234 - CHANGE BEFORE USE)
-- ---------------------------------------------------------------------
INSERT INTO admin_users (username, password_hash, full_name, role, is_active, created_at)
VALUES (
  'admin',
  '$2b$12$.lnCDqxmCPt7ZuEPw2f0S.YULq1U5N8rAILNBpmY4YZ/ehcx4HAG2',
  'System Administrator',
  'admin',
  TRUE,
  NOW()
)
ON DUPLICATE KEY UPDATE username = username;

-- ---------------------------------------------------------------------
-- Cities (major Somaliland cities/towns)
-- ---------------------------------------------------------------------
INSERT INTO cities (name, region, is_active, created_at, updated_at) VALUES
  ('Hargeisa', 'Woqooyi Galbeed', TRUE, NOW(), NOW()),
  ('Berbera', 'Sahil', TRUE, NOW(), NOW()),
  ('Burao', 'Togdheer', TRUE, NOW(), NOW()),
  ('Borama', 'Awdal', TRUE, NOW(), NOW()),
  ('Gabiley', 'Woqooyi Galbeed', TRUE, NOW(), NOW()),
  ('Erigavo', 'Sanaag', TRUE, NOW(), NOW()),
  ('Las Anod', 'Sool', TRUE, NOW(), NOW()),
  ('Sheikh', 'Sahil', TRUE, NOW(), NOW()),
  ('Odweyne', 'Togdheer', TRUE, NOW(), NOW()),
  ('Wajaale', 'Woqooyi Galbeed', TRUE, NOW(), NOW()),
  ('Balligubadle', 'Woqooyi Galbeed', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- ---------------------------------------------------------------------
-- Tax types - the only three the system supports (daily / semi-annual /
-- yearly), each with an independent minimum per currency. See
-- backend/services/tax_rules_service.py for how these minimums are
-- enforced (no SLSH<->USD conversion - each currency is checked against
-- its own minimum).
-- ---------------------------------------------------------------------
INSERT INTO tax_types (name, description, frequency, min_amount_slsh, min_amount_usd, is_active, created_at, updated_at) VALUES
  ('Maalinle', 'Daily tax obligation.', 'daily', 3000, 0.30, TRUE, NOW(), NOW()),
  ('Lix-biloodle', 'Tax obligation paid every six months.', 'semi_annual', 200000, 40, TRUE, NOW(), NOW()),
  ('Sanadle', 'Annual tax obligation.', 'yearly', 100000, 100, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;
