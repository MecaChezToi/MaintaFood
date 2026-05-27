-- ============================================================
-- FIXES SUPABASE — À COLLER DANS LE SQL EDITOR DE SUPABASE
-- ============================================================

-- Ce fichier complète la migration initiale si besoin.
-- Collez-le dans https://supabase.com/dashboard/project/<votre-projet>/sql/new
-- et cliquez "Run".

-- 1. S'assurer que le bucket Storage existe (si pas déjà fait)
-- Note : Si le bucket n'existe pas, créez-le d'abord dans Storage → New Bucket :
-- Nom : intervention-photos
-- Public : Non

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
