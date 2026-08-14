SET NAMES utf8mb4;

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`) VALUES
(UUID(), 'legal_entity_name', '*', '"GZL Teknoloji"'),
(UUID(), 'responsible_publisher_name', '*', '"Atakan Şahin"'),
(UUID(), 'technical_contact_name', '*', '"Orhan Güzel"')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
