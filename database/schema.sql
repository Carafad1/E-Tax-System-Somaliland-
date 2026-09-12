-- E-Tax System Somaliland - MySQL schema (reference)
--
-- This file mirrors the SQLAlchemy models in backend/models/ for MySQL
-- deployments. In normal development the schema is created automatically
-- by SQLAlchemy (db.create_all()) or Flask-Migrate, so running this file
-- by hand is OPTIONAL. It is provided for DBA reference, manual MySQL
-- setup, and documentation (see docs/DATABASE.md).
--
-- Usage:
--   mysql -u root -p etax_somaliland < database/schema.sql

CREATE DATABASE IF NOT EXISTS etax_somaliland
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE etax_somaliland;

-- ---------------------------------------------------------------------
-- cities
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_cities_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- tax_types
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tax_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  frequency VARCHAR(30) NOT NULL DEFAULT 'yearly',
  min_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'SLSH',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_tax_types_name (name),
  KEY ix_tax_types_frequency (frequency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NULL,
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- users (citizens/taxpayers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NOT NULL,
  id_number VARCHAR(50) NULL,
  tin VARCHAR(30) NOT NULL,
  city_id INT NULL,
  address VARCHAR(255) NULL,
  occupation VARCHAR(100) NULL,
  taxpayer_type VARCHAR(20) NOT NULL DEFAULT 'individual',
  business_name VARCHAR(150) NULL,
  business_type VARCHAR(50) NULL,
  registration_number VARCHAR(50) NULL,
  password_hash VARCHAR(255) NOT NULL,
  payment_pin_hash VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  role VARCHAR(20) NOT NULL DEFAULT 'citizen',
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_id_number (id_number),
  UNIQUE KEY uq_users_tin (tin),
  KEY ix_users_city_id (city_id),
  CONSTRAINT fk_users_city FOREIGN KEY (city_id) REFERENCES cities(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_id VARCHAR(40) NOT NULL,
  transaction_id VARCHAR(40) NOT NULL,
  user_id INT NOT NULL,
  tax_type_id INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'SLSH',
  payment_method VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes VARCHAR(255) NULL,
  payment_date DATETIME NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uq_payments_reference_id (reference_id),
  UNIQUE KEY uq_payments_transaction_id (transaction_id),
  KEY ix_payments_user_id (user_id),
  KEY ix_payments_tax_type_id (tax_type_id),
  KEY ix_payments_payment_method (payment_method),
  KEY ix_payments_status (status),
  KEY ix_payments_created_at (created_at),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_tax_type FOREIGN KEY (tax_type_id) REFERENCES tax_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- receipts
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(40) NOT NULL,
  payment_id INT NOT NULL,
  verification_token VARCHAR(64) NOT NULL,
  created_at DATETIME NULL,
  UNIQUE KEY uq_receipts_receipt_number (receipt_number),
  UNIQUE KEY uq_receipts_payment_id (payment_id),
  UNIQUE KEY uq_receipts_verification_token (verification_token),
  CONSTRAINT fk_receipts_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  description VARCHAR(255) NULL,
  ip_address VARCHAR(64) NULL,
  created_at DATETIME NULL,
  KEY ix_audit_logs_admin_id (admin_id),
  KEY ix_audit_logs_action (action),
  KEY ix_audit_logs_entity_type (entity_type),
  KEY ix_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NULL,
  KEY ix_notifications_user_id (user_id),
  KEY ix_notifications_created_at (created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
