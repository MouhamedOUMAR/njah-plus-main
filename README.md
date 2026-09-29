# najah+

Plateforme mobile-first de cours universitaires pour les etudiants en licence
L1, L2 et L3, avec gestion des semestres S1 a S6.

## Structure

- `frontend/`: application Next.js, interface etudiant et administration.
- `backend/supabase/schema.sql`: schema de reference pour une nouvelle base.
- `backend/supabase/migrations/`: migrations SQL a executer dans l'ordre.
- `backend/supabase/functions/`: fonctions Edge pour OTP et authentification.

## Demarrage

1. Creer `frontend/.env.local` a partir de `frontend/.env.example`.
2. Installer et lancer le frontend :

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

## Verification

```bash
cd frontend
npm run typecheck
npm run build
```

## Base de donnees

Pour une nouvelle base, appliquer d'abord `backend/supabase/schema.sql`, puis les
migrations de `backend/supabase/migrations/` dans l'ordre chronologique. Les deux
dernieres migrations renforcent l'acces aux medias prives et empechent les
etudiants d'ouvrir les cours non publies.

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans le navigateur ni la commiter.
