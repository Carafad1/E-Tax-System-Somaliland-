-- E-Tax System Somaliland - MySQL seed data (reference)
--
-- OPTIONAL. The recommended way to seed development data is:
--   cd backend && python -m database.seed
-- which works against whichever DATABASE_URL is configured (SQLite or
-- MySQL) and always uses fresh, correctly-hashed credentials.
--
-- This file is provided for DBA reference / pure-SQL environments. It
-- assumes database/schema.sql has already been applied.
--
-- IMPORTANT: All data in this file is DEMO/SAMPLE data. It must never be
-- represented as real government records. The admin password below
-- (1234) is a development-only credential - change it before any
-- non-local use.
--
-- Usage:
--   mysql -u root -p etax_somaliland < database/seed.sql

USE etax_somaliland;

-- ---------------------------------------------------------------------
-- Admin account (username: admin / password: 1234 - DEVELOPMENT ONLY)
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
-- Tax types
-- ---------------------------------------------------------------------
INSERT INTO tax_types (name, description, frequency, min_amount, currency, is_active, created_at, updated_at) VALUES
  ('Yearly Tax', 'Annual taxpayer obligation.', 'yearly', 100000, 'SLSH', TRUE, NOW(), NOW()),
  ('Daily Tax', 'Daily market/vendor tax.', 'daily', 5000, 'SLSH', TRUE, NOW(), NOW()),
  ('Business Tax', 'Registered business tax obligation.', 'yearly', 250000, 'SLSH', TRUE, NOW(), NOW()),
  ('Income Tax', 'Personal income tax.', 'yearly', 150000, 'SLSH', TRUE, NOW(), NOW()),
  ('GST', 'Goods and services tax.', 'monthly', 50000, 'SLSH', TRUE, NOW(), NOW()),
  ('Other Government Tax', 'Other government-configured tax.', 'other', 10000, 'SLSH', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = name;

-- ---------------------------------------------------------------------
-- Sample citizens (DEMO DATA ONLY)
-- Password for both: Demo@1234   |   Payment PIN for both: 1234
-- ---------------------------------------------------------------------
INSERT INTO users (
  full_name, email, phone, id_number, tin, city_id, address, occupation,
  taxpayer_type, business_name, business_type, password_hash, payment_pin_hash,
  status, role, created_at, updated_at
) VALUES (
  'Ahmed Mohamed', 'ahmed.mohamed@example.com', '+252634000001', 'SL0001',
  'TIN-2026-100001', (SELECT id FROM cities WHERE name = 'Hargeisa'),
  'Hargeisa, Somaliland', 'Trader', 'individual', NULL, NULL,
  '$2b$12$BLORgjnZjnBCV6l75AWP5eLxY3GC9fMOrt2dSkoYYgMakP0hvtALu',
  '$2b$12$NhkkNtXpCVVsk6uRudFk6OrhmLhxB8PvXCTh.mv14SFYYfPLdCotC',
  'active', 'citizen', NOW(), NOW()
) ON DUPLICATE KEY UPDATE phone = phone;

INSERT INTO users (
  full_name, email, phone, id_number, tin, city_id, address, occupation,
  taxpayer_type, business_name, business_type, password_hash, payment_pin_hash,
  status, role, created_at, updated_at
) VALUES (
  'Ayaan Ali', 'ayaan.ali@example.com', '+252634000002', 'SL0002',
  'TIN-2026-100002', (SELECT id FROM cities WHERE name = 'Hargeisa'),
  'Hargeisa, Somaliland', 'Business Owner', 'business', 'Ayaan General Trading', 'Retail',
  '$2b$12$BLORgjnZjnBCV6l75AWP5eLxY3GC9fMOrt2dSkoYYgMakP0hvtALu',
  '$2b$12$NhkkNtXpCVVsk6uRudFk6OrhmLhxB8PvXCTh.mv14SFYYfPLdCotC',
  'active', 'citizen', NOW(), NOW()
) ON DUPLICATE KEY UPDATE phone = phone;

-- ---------------------------------------------------------------------
-- Sample payment + receipt (DEMO DATA ONLY - not a real transaction)
-- ---------------------------------------------------------------------
INSERT INTO payments (
  reference_id, transaction_id, user_id, tax_type_id, amount, currency,
  payment_method, status, notes, payment_date, created_at, updated_at
) VALUES (
  'ETX-2026-100001', 'TXN-20260101000001',
  (SELECT id FROM users WHERE phone = '+252634000001'),
  (SELECT id FROM tax_types WHERE name = 'Yearly Tax'),
  100000, 'SLSH', 'ZAAD', 'completed',
  'Demo/sample payment - not a real government transaction.',
  NOW(), NOW(), NOW()
) ON DUPLICATE KEY UPDATE reference_id = reference_id;

INSERT INTO receipts (receipt_number, payment_id, verification_token, created_at)
VALUES (
  'RCPT-2026-100001',
  (SELECT id FROM payments WHERE reference_id = 'ETX-2026-100001'),
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  NOW()
) ON DUPLICATE KEY UPDATE receipt_number = receipt_number;
