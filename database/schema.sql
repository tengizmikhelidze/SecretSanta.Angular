-- Secret Santa Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS secret_santa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE secret_santa;

-- ============================================
-- Table: parties
-- Stores main party information
-- ============================================
CREATE TABLE parties (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  status ENUM('created', 'pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'created',
  party_date DATE NULL,
  location VARCHAR(255) NULL,
  max_amount DECIMAL(10, 2) NULL,
  personal_message TEXT NULL,
  host_can_see_all BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: participants
-- Stores participant information for each party
-- ============================================
CREATE TABLE participants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  party_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to BIGINT UNSIGNED NULL,
  wishlist TEXT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notification_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES participants(id) ON DELETE SET NULL,

  INDEX idx_party_id (party_id),
  INDEX idx_email (email),
  INDEX idx_is_host (is_host),
  UNIQUE INDEX idx_party_email (party_id, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: assignments
-- Stores Secret Santa gift assignments
-- ============================================
CREATE TABLE assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  party_id CHAR(36) NOT NULL,
  giver_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
  FOREIGN KEY (giver_id) REFERENCES participants(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES participants(id) ON DELETE CASCADE,

  UNIQUE INDEX idx_giver (party_id, giver_id),
  INDEX idx_receiver (receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: notifications
-- Tracks email notifications sent
-- ============================================
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  party_id CHAR(36) NOT NULL,
  participant_id BIGINT UNSIGNED NOT NULL,
  type ENUM('invitation', 'reminder', 'assignment', 'update') NOT NULL,
  status ENUM('pending', 'sent', 'failed', 'bounced') NOT NULL DEFAULT 'pending',
  subject VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,

  INDEX idx_party_id (party_id),
  INDEX idx_participant_id (participant_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: party_settings
-- Additional settings and preferences
-- ============================================
CREATE TABLE party_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  party_id CHAR(36) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,

  UNIQUE INDEX idx_party_setting (party_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: wishlists
-- Stores participant wishlists
-- ============================================
CREATE TABLE wishlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  participant_id BIGINT UNSIGNED NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT NULL,
  item_url VARCHAR(500) NULL,
  price_range VARCHAR(50) NULL,
  priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,

  INDEX idx_participant_id (participant_id),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: audit_logs
-- Tracks important actions for security
-- ============================================
CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  party_id CHAR(36) NULL,
  participant_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,

  INDEX idx_party_id (party_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

