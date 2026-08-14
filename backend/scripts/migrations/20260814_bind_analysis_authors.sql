SET NAMES utf8mb4;
SET time_zone = '+00:00';

UPDATE hf_analysis_reports AS report
INNER JOIN hf_authors AS author
  ON author.full_name = report.author
  AND author.is_active = 1
SET report.author_id = author.id
WHERE report.author_id IS NULL;
