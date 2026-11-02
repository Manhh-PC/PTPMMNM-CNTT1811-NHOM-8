-- Select the existing PixelNote schema in Workbench before running ALL statements.
-- Run as a schema administrator. Preserves rows, IDs, images and annotations.
-- Idempotent for MySQL 8.0: safe to run again after a partial execution.

SET @pixelnote_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='system_role'), 'SELECT 1', 'ALTER TABLE `users` ADD COLUMN `system_role` ENUM(''user'',''admin'') NOT NULL DEFAULT ''user''');
PREPARE pixelnote_stmt FROM @pixelnote_ddl;
EXECUTE pixelnote_stmt;
DEALLOCATE PREPARE pixelnote_stmt;

SET @pixelnote_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='is_active'), 'SELECT 1', 'ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1');
PREPARE pixelnote_stmt FROM @pixelnote_ddl;
EXECUTE pixelnote_stmt;
DEALLOCATE PREPARE pixelnote_stmt;

SET @pixelnote_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name='auth_version'), 'SELECT 1', 'ALTER TABLE `users` ADD COLUMN `auth_version` INT UNSIGNED NOT NULL DEFAULT 1');
PREPARE pixelnote_stmt FROM @pixelnote_ddl;
EXECUTE pixelnote_stmt;
DEALLOCATE PREPARE pixelnote_stmt;

SET @pixelnote_ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='projects' AND column_name='admin_locked'), 'SELECT 1', 'ALTER TABLE `projects` ADD COLUMN `admin_locked` TINYINT(1) NOT NULL DEFAULT 0');
PREPARE pixelnote_stmt FROM @pixelnote_ddl;
EXECUTE pixelnote_stmt;
DEALLOCATE PREPARE pixelnote_stmt;

CREATE TABLE IF NOT EXISTS admin_guard (
 id TINYINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE=InnoDB;
INSERT IGNORE INTO admin_guard(id) VALUES(1);

CREATE TABLE IF NOT EXISTS admin_audit_log (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 actor_id BIGINT UNSIGNED NULL,
 action VARCHAR(50) NOT NULL,
 object_type VARCHAR(20) NOT NULL,
 object_id BIGINT UNSIGNED NOT NULL,
 details JSON NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE SET NULL,
 INDEX(created_at), INDEX(object_type,object_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
