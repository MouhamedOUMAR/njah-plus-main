-- Migration Script: Normalize YouTube URLs to raw 11-character video IDs
-- This script does NOT touch any authentication or profile tables.
-- It strictly normalizes the `video_url` column in the `lessons` table.

BEGIN;

-- 1. Identify rows with full YouTube URLs and extract the 11-character ID.
-- We use regexp_match to find exactly 11 word/dash characters after common YouTube paths.
UPDATE public.lessons
SET 
  video_type = 'youtube',
  video_url = (regexp_match(video_url, '(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})'))[1]
WHERE 
  (video_url LIKE '%youtu.be/%' OR video_url LIKE '%youtube.com/%')
  AND video_url IS NOT NULL
  AND (regexp_match(video_url, '(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})'))[1] IS NOT NULL;

-- 2. Ensure any existing bare 11-character IDs are correctly tagged as 'youtube'
UPDATE public.lessons
SET video_type = 'youtube'
WHERE 
  length(video_url) = 11 
  AND video_url NOT LIKE '%/%'
  AND video_url NOT LIKE '% %'
  AND (video_type IS NULL OR video_type != 'youtube');

COMMIT;
