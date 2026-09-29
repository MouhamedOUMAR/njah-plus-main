-- One-time: set a known password_hash for the admin account whose hash was lost.
-- Password is: Admin1234  (admin must change after first login)
UPDATE public.profiles
SET password_hash = 'pbkdf2:sha256:100000:6f1b9452c50805a8fbf2daf9dffa3d5a:c488835e71f2a01eddf34268cdecf144f18deba2ff1432d9d2c2fb7c8952db4a'
WHERE phone = '+22247288080'
  AND password_hash IS NULL;
