SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Bildirimler ─────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`         CHAR(36)     NOT NULL,
  `user_id`    CHAR(36)     NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `message`    TEXT         NOT NULL,
  `type`       VARCHAR(50)  NOT NULL,
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id`      (`user_id`),
  KEY `idx_notifications_user_read`    (`user_id`, `is_read`),
  KEY `idx_notifications_created_at`   (`created_at`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Destek Biletleri ────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `support_ticket_messages`;
DROP TABLE IF EXISTS `support_tickets`;
DROP TABLE IF EXISTS `support_faqs_i18n`;
DROP TABLE IF EXISTS `support_faqs`;

CREATE TABLE `support_faqs` (
  `id`            CHAR(36)     NOT NULL,
  `category`      VARCHAR(100) NOT NULL DEFAULT 'genel',
  `display_order` INT          NOT NULL DEFAULT 0,
  `is_published`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `support_faqs_category_idx`  (`category`),
  KEY `support_faqs_order_idx`     (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `support_faqs_i18n` (
  `faq_id`   CHAR(36)      NOT NULL,
  `locale`   VARCHAR(10)   NOT NULL DEFAULT 'tr',
  `question` VARCHAR(500)  NOT NULL,
  `answer`   LONGTEXT      NOT NULL,
  KEY `fk_support_faq_i18n` (`faq_id`),
  CONSTRAINT `fk_support_faq_i18n`
    FOREIGN KEY (`faq_id`) REFERENCES `support_faqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `support_tickets` (
  `id`         CHAR(36)     NOT NULL,
  `user_id`    CHAR(36)     DEFAULT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `email`      VARCHAR(255) NOT NULL,
  `subject`    VARCHAR(255) NOT NULL,
  `message`    LONGTEXT     NOT NULL,
  `category`   VARCHAR(100) NOT NULL DEFAULT 'genel',
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'open',
  `priority`   VARCHAR(20)  NOT NULL DEFAULT 'normal',
  `admin_note` LONGTEXT     DEFAULT NULL,
  `ip`         VARCHAR(64)  DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `support_tickets_status_idx`   (`status`),
  KEY `support_tickets_category_idx` (`category`),
  KEY `support_tickets_created_idx`  (`created_at`),
  CONSTRAINT `fk_support_ticket_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `support_ticket_messages` (
  `id`          CHAR(36)    NOT NULL,
  `ticket_id`   CHAR(36)    NOT NULL,
  `sender_type` VARCHAR(16) NOT NULL,
  `author_id`   CHAR(36)    DEFAULT NULL,
  `body`        LONGTEXT    NOT NULL,
  `created_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `support_ticket_messages_ticket_idx`  (`ticket_id`),
  KEY `support_ticket_messages_created_idx` (`created_at`),
  CONSTRAINT `fk_support_ticket_message_ticket`
    FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_support_ticket_message_author`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
