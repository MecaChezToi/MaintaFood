# Guide de configuration — FixOps GMAO

🎉 **Application prête à l'emploi !** Le build a réussi.

---

## Étape 1 — Créer un projet Supabase (5-10 minutes)

1.  Aller sur [https://supabase.com](https://supabase.com) et créer un compte gratuit
2.  Cliquer sur **"New Project"**
    - Nom du projet : `fixops-gmao`
    - Mot de passe de base de données : Choisir un mot de passe sécurisé (gardez-le !)
    - Région : Choisir **West EU (Ireland)** (pour la conformité RGPD)
3.  Attendre 2-3 minutes que le projet soit prêt

---

## Étape 2 — Configurer la base de données

1.  Dans votre projet Supabase, aller dans **SQL Editor** (icône 📝)
2.  Cliquer sur **"New query"**
3.  Ouvrir le fichier `supabase/migrations/001_initial_schema.sql` dans votre projet
4.  Copier TOUT le contenu et le coller dans l'éditeur SQL
5.  Cliquer sur **"Run"** (en bas à droite)

✅ Toutes les tables, triggers et politiques de sécurité sont créés !

---

## Étape 3 — Créer le bucket Storage

1.  Dans Supabase, aller dans **Storage** (icône 📦)
2.  Cliquer sur **"New bucket"**
3.  Nom : `intervention-photos`
4.  **Public bucket** : Laisser **désactivé** (les photos sont privées)
5.  Cliquer sur **"Create bucket"**

---

## Étape 4 — Récupérer les clés API

1.  Dans Supabase, aller dans **Settings** (icône ⚙️) → **API**
2.  Copier ces deux valeurs :
    - `Project URL` (ex: `https://xxxxxxxxx.supabase.co`)
    - `anon public` (une longue chaîne de caractères)

---

## Étape 5 — Configurer le fichier .env.local

1.  Ouvrir le fichier `.env.local` dans votre projet `c:\Users\schem\Desktop\Gmao\fixops\`
2.  Remplacer les valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE-ANON-KEY
```

Par exemple :
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Étape 6 — Créer les comptes utilisateurs

1.  Dans Supabase, aller dans **Authentication** (icône 🔐) → **Users**
2.  Cliquer sur **"Add user"** → **"Create new user"**
3.  Créer ces 6 comptes (choisissez des mots de passe forts) :

| Email | Rôle |
|-------|------|
| `admin@votre-societe.fr` | Administrateur |
| `chef@votre-societe.fr` | Chef technique |
| `lucas@votre-societe.fr` | Technicien |
| `sophie@votre-societe.fr` | Technicien |
| `karim@votre-societe.fr` | Technicien |
| `marie@votre-societe.fr` | Technicien |

4.  **IMPORTANT** : Après avoir créé les utilisateurs, aller dans **SQL Editor** → **New query** et exécuter :
    ```sql
    select id, email from auth.users order by created_at;
    ```
    Copiez les UUIDs !

5.  Toujours dans **SQL Editor**, exécuter cette requête (remplacez les UUIDs par les vôtres) :

    ```sql
    insert into profiles (id, name, role, avatar, color) values
    ('UUID-ADMIN',  'Alexandre Moreau', 'admin',      'AM', '#e8643c'),
    ('UUID-CHEF',   'Bernard Lefebvre', 'chef',        'BL', '#a855f7'),
    ('UUID-LUCAS',  'Lucas Martin',     'technician',  'LM', '#3c82e8'),
    ('UUID-SOPHIE', 'Sophie Bernard',   'technician',  'SB', '#3cb87a'),
    ('UUID-KARIM',  'Karim Benali',     'technician',  'KB', '#f59e0b'),
    ('UUID-MARIE',  'Marie Durand',     'technician',  'MD', '#06b6d4');
    ```

---

## Étape 7 — Lancer l'application !

1.  Ouvrir un terminal dans le dossier `c:\Users\schem\Desktop\Gmao\fixops`
2.  Exécuter :
    ```bash
    npm run dev
    ```
3.  Ouvrir votre navigateur sur [http://localhost:3000](http://localhost:3000)
4.  Se connecter avec `admin@votre-societe.fr` et le mot de passe que vous avez défini

🎉 **C'est prêt !** L'application est fonctionnelle !

---

## Déployer en production (optionnel)

Si vous voulez déployer sur Vercel :

1.  Installer Vercel CLI : `npm i -g vercel`
2.  Exécuter : `vercel`
3.  Suivre les instructions
4.  Dans les paramètres du projet Vercel, ajouter les variables d'environnement :
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Fonctionnalités de l'application

✅ **Tableau de bord** : Vue d'ensemble des interventions, équipements, stocks
✅ **Plan du site** : Carte interactive de l'usine
✅ **Interventions** : Créer, suivre, compléter des ordres de travail
✅ **Magasin** : Gestion du stock, localisation des pièces, fournisseurs
✅ **Journal d'audit** : Traçabilité complète (conforme IFS/BRC/ISO 22000)
✅ **Utilisateurs** : Gestion des comptes
✅ **Paramètres** : Configuration du site
✅ **PWA** : Peut être installé comme une app native sur Android

---

## Besoin d'aide ?

Si vous rencontrez des problèmes :
1.  Vérifiez que `.env.local` contient les bonnes valeurs
2.  Vérifiez que la migration SQL a bien été exécutée
3.  Vérifiez que les profils ont été créés dans la table `profiles`
