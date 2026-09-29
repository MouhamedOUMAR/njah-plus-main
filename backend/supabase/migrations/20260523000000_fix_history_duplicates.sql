-- Clean up duplicate history records, keeping only the most recent one for each user/lesson pair
DELETE FROM public.history h1
USING public.history h2
WHERE h1.id < h2.id
  AND h1.user_id = h2.user_id
  AND h1.lesson_id = h2.lesson_id;

-- Add unique constraint to enable correct UPSERT behavior in recordHistory action
ALTER TABLE public.history
ADD CONSTRAINT history_user_lesson_unique UNIQUE (user_id, lesson_id);

-- Update Dashboard RPC to ensure it reflects accurate counts
NOTIFY pgrst, 'reload schema';
