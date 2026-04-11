-- =============================================================
-- 030_audit_schema.sql
-- Audit tables:
--   - audit_request_logs
--   - audit_auth_events
--   - audit_events   (domain/system events for SSE)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------
-- audit_request_logs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_request_logs` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `req_id`           VARCHAR(64)  NOT NULL,
  `method`           VARCHAR(16)  NOT NULL,
  `url`              LONGTEXT     NOT NULL,  -- full url incl query
  `path`             VARCHAR(255) NOT NULL,  -- pathname only

  `status_code`      INT          NOT NULL,
  `response_time_ms` INT          NOT NULL DEFAULT 0,

  `ip`               VARCHAR(64)  NOT NULL,
  `user_agent`       LONGTEXT     DEFAULT NULL,
  `referer`          LONGTEXT     DEFAULT NULL,

  `user_id`          VARCHAR(64)  DEFAULT NULL,
  `is_admin`         INT          NOT NULL DEFAULT 0,

  `country`          VARCHAR(8)   DEFAULT NULL,
  `city`             VARCHAR(64)  DEFAULT NULL,

  `error_message`    VARCHAR(512) DEFAULT NULL,
  `error_code`       VARCHAR(64)  DEFAULT NULL,
  `request_body`     LONGTEXT     DEFAULT NULL,

  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `audit_request_logs_created_idx` (`created_at`),
  KEY `audit_request_logs_user_idx` (`user_id`),
  KEY `audit_request_logs_path_idx` (`path`),
  KEY `audit_request_logs_ip_idx` (`ip`),
  KEY `audit_request_logs_status_idx` (`status_code`),
  KEY `audit_request_logs_method_idx` (`method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- audit_auth_events
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_auth_events` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `event`      VARCHAR(32)  NOT NULL,   -- login_success|login_failed|logout|...
  `user_id`    VARCHAR(64)  DEFAULT NULL,
  `email`      VARCHAR(255) DEFAULT NULL,

  `ip`         VARCHAR(64)  NOT NULL,
  `user_agent` LONGTEXT     DEFAULT NULL,

  `country`    VARCHAR(8)   DEFAULT NULL,
  `city`       VARCHAR(64)  DEFAULT NULL,

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `audit_auth_events_created_idx` (`created_at`),
  KEY `audit_auth_events_event_idx` (`event`),
  KEY `audit_auth_events_user_idx` (`user_id`),
  KEY `audit_auth_events_ip_idx` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- audit_events (domain/system events)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_events` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `ts`            DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `level`         VARCHAR(16)     NOT NULL, -- info|warn|error|debug (kullandığın tipe göre)
  `topic`         VARCHAR(128)    NOT NULL, -- mail.sent, auth.login_success, ...

  `message`       LONGTEXT        DEFAULT NULL,

  `actor_user_id` VARCHAR(64)     DEFAULT NULL,
  `ip`            VARCHAR(64)     DEFAULT NULL,

  `entity_type`   VARCHAR(64)     DEFAULT NULL,
  `entity_id`     VARCHAR(64)     DEFAULT NULL,

  `meta_json`     LONGTEXT        DEFAULT NULL, -- JSON string

  PRIMARY KEY (`id`),

  KEY `audit_events_ts_idx` (`ts`),
  KEY `audit_events_topic_ts_idx` (`topic`, `ts`),
  KEY `audit_events_level_ts_idx` (`level`, `ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
