SET @db_name = DATABASE();

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD COLUMN gclid VARCHAR(255) DEFAULT NULL AFTER request_body',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND COLUMN_NAME = 'gclid'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD COLUMN utm_source VARCHAR(255) DEFAULT NULL AFTER gclid',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND COLUMN_NAME = 'utm_source'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD COLUMN utm_medium VARCHAR(255) DEFAULT NULL AFTER utm_source',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND COLUMN_NAME = 'utm_medium'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD COLUMN utm_campaign VARCHAR(255) DEFAULT NULL AFTER utm_medium',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND COLUMN_NAME = 'utm_campaign'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD COLUMN utm_content VARCHAR(255) DEFAULT NULL AFTER utm_campaign',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND COLUMN_NAME = 'utm_content'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD INDEX audit_request_logs_gclid_idx (gclid)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND INDEX_NAME = 'audit_request_logs_gclid_idx'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE audit_request_logs ADD INDEX audit_request_logs_utm_source_idx (utm_source)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'audit_request_logs'
    AND INDEX_NAME = 'audit_request_logs_utm_source_idx'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
