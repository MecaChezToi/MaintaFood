# FixOps GMAO — Guide de déploiement complet

## Structure du projet

```
fixops/
├── app/
│   ├── layout.tsx              ← Layout principal + PWA meta tags
│   ├── page.tsx                ← Redirection auth/dashboard
│   ├── globals.css             ← Styles globaux + design tokens
│   ├── auth/page.tsx           ← Page de connexion
│   ├── dashboard/page.tsx      ← Tableau de bord
│   ├── interventions/page.tsx  ← Liste + détail interventions
│   ├── plan/page.tsx           ← Plan du site interactif
│   ├── store/page.tsx          ← Magasin + localisation pièces
│   ├── audit/page.tsx          ← Journal d'audit (admin/chef)
│   ├── users/page.tsx          ← Gestion utilisateurs (admin)
│   └── settings/page.tsx       ← Paramètres (admin)
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       ← Shell sidebar + mobile nav
│   │   └── AuthProvider.tsx    ← Context auth Supabase
│   ├── ui/                     ← Composants réutilisables
│   └── modals/                 ← Modals intervention, machine...
├── lib/
│   └── supabase.ts             ← Client + toutes les fonctions DB
├── types/
│   └── index.ts                ← Types TypeScript complets
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Schema complet à exécuter
├── public/
│   ├── manifest.json           ← PWA manifest
│   └── icons/                  ← Icônes app (à générer)
├── .env.local.example          ← Template variables d'environnement
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## ÉTAPE 1 — Créer le projet Supabase (15 min)

1. Aller sur https://supabase.com → compte gratuit
2. **New project** → nom: `fixops-prod` → région: **West EU (Ireland)**
3. Attendre 2 minutes
4. Aller dans **Settings → API** → copier :
   - `Project URL`
   - `anon public key`

---

## ÉTAPE 2 — Créer la base de données (10 min)

1. Dans Supabase → **SQL Editor** → **New query**
2. Copier tout le contenu de `supabase/migrations/001_initial_schema.sql`
3. Cliquer **Run** — toutes les tables, triggers et politiques sont créés

### Créer le bucket pour les photos

Dans Supabase → **Storage** → **New bucket** :
- Nom : `intervention-photos`
- Public : **Non** (les photos sont privées)
- Cliquer **Create**

---

## ÉTAPE 3 — Créer les comptes utilisateurs (10 min)

Dans Supabase → **Authentication → Users** → **Add user** → **Create new user**

Créer les 6 comptes :
```
admin@votre-societe.fr        Mot de passe fort
chef@votre-societe.fr         Mot de passe fort
lucas@votre-societe.fr        Mot de passe
sophie@votre-societe.fr       Mot de passe
karim@votre-societe.fr        Mot de passe
marie@votre-societe.fr        Mot de passe
```

Puis dans **SQL Editor**, récupérer les UUID créés :
```sql
select id, email from auth.users order by created_at;
```

Insérer les profils (remplacer les UUID) :
```sql
insert into profiles (id, name, role, avatar, color) values
('UUID-admin',  'Alexandre Moreau', 'admin',      'AM', '#e8643c'),
('UUID-chef',   'Bernard Lefebvre', 'chef',        'BL', '#a855f7'),
('UUID-lucas',  'Lucas Martin',     'technician',  'LM', '#3c82e8'),
('UUID-sophie', 'Sophie Bernard',   'technician',  'SB', '#3cb87a'),
('UUID-karim',  'Karim Benali',     'technician',  'KB', '#f59e0b'),
('UUID-marie',  'Marie Durand',     'technician',  'MD', '#06b6d4');
```

---

## ÉTAPE 4 — Installer Node.js et créer le projet Next.js (30 min)

### Installer Node.js
Télécharger sur https://nodejs.org → version **LTS** (20.x) → installer

### Créer le projet
Ouvrir un terminal (Invite de commandes sur Windows) :

```bash
# Créer le projet Next.js
npx create-next-app@latest fixops --typescript --app --no-tailwind --src-dir=false

# Aller dans le dossier
cd fixops

# Installer les dépendances
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs date-fns

# Vérifier que ça fonctionne
npm run dev
# → Ouvrir http://localhost:3000
```

### Copier les fichiers générés
Remplacer les fichiers créés par ceux fournis dans ce projet :
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `components/` (dossier complet)
- `lib/supabase.ts`
- `types/index.ts`
- `public/manifest.json`
- `next.config.js`
- `tsconfig.json`

### Configurer les variables d'environnement
```bash
# Copier le template
cp .env.local.example .env.local

# Éditer .env.local avec vos vraies valeurs
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé
```

---

## ÉTAPE 5 — Générer les icônes PWA (5 min)

Aller sur https://www.pwabuilder.com/imageGenerator ou https://favicon.io

Créer une image 512x512 avec le logo FixOps (⚙️ sur fond #00c896),
puis générer toutes les tailles et les placer dans `public/icons/` :

```
public/icons/
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-192.png
├── icon-384.png
└── icon-512.png
```

---

## ÉTAPE 6 — Tester en local (15 min)

```bash
npm run dev
```

Ouvrir http://localhost:3000 et vérifier :
- [ ] Connexion avec admin@votre-societe.fr fonctionne
- [ ] Dashboard s'affiche
- [ ] Création d'une intervention
- [ ] Rapport technicien
- [ ] Magasin visible

---

## ÉTAPE 7 — Déployer sur Vercel (15 min)

### Option A — Interface web (recommandé)

1. Créer un compte sur https://vercel.com (gratuit)
2. Pousser le code sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit FixOps"
   # Créer un repo sur github.com
   git remote add origin https://github.com/votre-compte/fixops.git
   git push -u origin main
   ```
3. Sur Vercel → **New Project** → importer le repo GitHub
4. Dans **Environment Variables**, ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Cliquer **Deploy** → votre app est en ligne en 2 minutes

### Option B — CLI

```bash
npm install -g vercel
vercel
# Suivre les instructions
# Ajouter les env vars quand demandé
```

---

## ÉTAPE 8 — Domaine personnalisé (optionnel, 10 min)

Sur Vercel → **Settings → Domains** → ajouter `gmao.votre-societe.fr`

Configurer le DNS chez votre registrar :
```
Type  : CNAME
Nom   : gmao
Valeur: cname.vercel-dns.com
```

---

## ÉTAPE 9 — Installer sur les téléphones Android (5 min/téléphone)

1. Ouvrir **Chrome** sur le téléphone Android
2. Aller sur `https://gmao.votre-societe.fr`
3. Se connecter avec son compte
4. Appuyer sur les **⋮ (3 points)** en haut à droite de Chrome
5. Appuyer sur **"Ajouter à l'écran d'accueil"**
6. Confirmer → L'icône FixOps apparaît sur le bureau
7. La prochaine ouverture se fait en plein écran, comme une vraie app

---

## Mises à jour

Pour mettre à jour l'application après des modifications :

```bash
git add .
git commit -m "Description de la modification"
git push
```

Vercel détecte le push et redéploie automatiquement en 1-2 minutes.
**Tous les téléphones ont la mise à jour sans rien faire.**

---

## Coûts mensuels

| Service         | Plan        | Coût      |
|-----------------|-------------|-----------|
| Supabase        | Free        | 0 €/mois  |
| Vercel          | Hobby       | 0 €/mois  |
| Domaine `.fr`   | —           | ~1 €/mois |
| **Total**       |             | **~1 €/mois** |

> Quand l'usage grandit (plus de 50k requêtes/jour ou 500MB de données) :
> - Supabase Pro : 25 $/mois
> - Vercel Pro : 20 $/mois

---

## Support

Pour toute modification de l'application (nouvelles fonctionnalités, 
ajustements d'interface, correctifs), revenir sur Claude et décrire 
ce qui doit changer. Le code est mis à jour et re-déployé en quelques 
minutes avec `git push`.
