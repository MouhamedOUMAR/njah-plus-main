-- Update admin password to a numeric-only password: 12345678
UPDATE public.profiles
SET password_hash = 'pbkdf2:sha256:100000:516e382f815ae3ac2e08b99f25c072cd:d21b2b151354e2833bd1eeac28ee1597881d235d4f9fe5a53adfd2a5290393f2'
WHERE phone = '+22247288080';
