# Frontend najah+

Application Next.js 16 pour les interfaces etudiant et administration.

## Configuration

Creer `.env.local` dans ce dossier :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

La cle service est utilisee uniquement dans les modules serveur et les routes API.

## Commandes

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

La police utilise une pile systeme locale, donc la compilation ne depend pas de
Google Fonts.
