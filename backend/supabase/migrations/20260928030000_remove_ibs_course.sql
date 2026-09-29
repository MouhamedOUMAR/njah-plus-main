BEGIN;

-- Remove the obsolete IBS course and all related lessons through ON DELETE CASCADE.
DELETE FROM public.courses
WHERE lower(btrim(title)) = 'ibs';

NOTIFY pgrst, 'reload schema';

COMMIT;
