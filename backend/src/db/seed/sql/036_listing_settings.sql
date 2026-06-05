SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
SELECT UUID(), 'listing_featured_pricing', '*', '{"daily":{"price":99,"days":1},"weekly":{"price":499,"days":7},"monthly":{"price":1499,"days":30}}'
WHERE NOT EXISTS (
  SELECT 1 FROM `site_settings`
  WHERE `key` = 'listing_featured_pricing' AND `locale` = '*'
);
