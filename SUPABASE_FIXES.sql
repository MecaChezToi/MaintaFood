-- ============================================================
-- FIXES SUPABASE — À COLLER DANS LE SQL EDITOR DE SUPABASE
-- ============================================================

-- Ce fichier sert à corriger une base déjà créée.
-- Collez-le dans https://supabase.com/dashboard/project/<votre-projet>/sql/new
-- puis cliquez "Run".

-- ============================================================
-- 1) FIX RLS : un technicien doit voir les OT qu'il a créés
-- (sinon : "je crée une intervention et je ne la vois pas")
-- ============================================================

drop policy if exists "int_select" on public.interventions;
create policy "int_select" on public.interventions for select using (
  technician_id = auth.uid()
  or created_by = auth.uid()
  or public.current_user_role() in ('admin','chef')
);

drop policy if exists "int_update" on public.interventions;
create policy "int_update" on public.interventions for update using (
  technician_id = auth.uid()
  or created_by = auth.uid()
  or public.current_user_role() in ('admin','chef')
);

-- 1. S'assurer que le bucket Storage existe (si pas déjà fait)
-- Note : Si le bucket n'existe pas, créez-le d'abord dans Storage → New Bucket :
-- Nom : intervention-photos
-- Public : Non

-- ============================================================
-- 2) STORAGE : autoriser les utilisateurs authentifiés à lister
-- et voir les fichiers dans intervention-photos
-- (utile pour Audit + documents machines)
-- ============================================================
-- Si vous n'avez pas encore exécuté la fin de 001_initial_schema.sql,
-- vous pouvez (re)créer les policies suivantes (idempotent).

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'intervention-photos' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can view photos" on storage.objects;
create policy "Authenticated users can view photos"
  on storage.objects for select
  using (bucket_id = 'intervention-photos' and auth.role() = 'authenticated');

-- 2. Vérification rapide des policies RLS (déjà présentes dans la migration initiale)
-- (rien à faire, c'est déjà dans 001_initial_schema.sql)

-- 3. Si vous avez déjà une base, vous pouvez exécuter ces requêtes pour vérifier :

-- Voir les profils :
-- SELECT * FROM profiles;

-- Voir les équipements :
-- SELECT * FROM equipments;

-- Voir les pièces :
-- SELECT * FROM parts;

-- Voir les interventions :
-- SELECT * FROM interventions ORDER BY created_at DESC;

-- ============================================================
-- Pour mettre à jour les prix HTVA/TVAC :
-- ============================================================
-- Si vous voulez ajouter des champs prix HT/TVA explicitement dans la table parts :
-- (décommenter si besoin)
--
-- ALTER TABLE parts ADD COLUMN IF NOT EXISTS price_ht numeric(10,2);
-- ALTER TABLE parts ADD COLUMN IF NOT EXISTS tva_rate numeric(5,2) default 20.00;
-- ALTER TABLE parts ADD COLUMN IF NOT EXISTS price_ttc numeric(10,2) GENERATED ALWAYS AS (price_ht * (1 + tva_rate / 100)) STORED;
--
-- Mettre à jour les données existantes :
-- UPDATE parts SET price_ht = price WHERE price IS NOT NULL AND price_ht IS NULL;
