-- ============================================================
-- FIXOPS GMAO — Migration initiale
-- Coller dans Supabase SQL Editor et cliquer Run
-- ============================================================

-- ─── TYPES ÉNUMÉRÉS ─────────────────────────────────────────
create type eq_status    as enum ('ok','panne','maintenance');
create type int_status   as enum ('a_faire','en_cours','termine','valide');
create type priority_lvl as enum ('normale','haute','critique');
create type user_role    as enum ('admin','chef','technician');

-- ─── PROFILS UTILISATEURS ───────────────────────────────────
-- Étend la table auth.users native de Supabase
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  role        user_role default 'technician',
  avatar      text,
  color       text default '#3c82e8',
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── CONFIGURATION DU SITE ──────────────────────────────────
create table site_config (
  id               int primary key default 1,  -- ligne unique
  name             text default 'Mon Usine',
  address          text,
  siret            text,
  certifications   text,
  updated_at       timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into site_config (id, name, address, siret, certifications)
values (1, 'Usine Agroalimentaire', 'Votre adresse', '000 000 000 00000', 'IFS Food v8 · BRC · ISO 22000');

-- ─── ÉQUIPEMENTS ────────────────────────────────────────────
create table equipments (
  id                uuid default gen_random_uuid() primary key,
  name              text not null,
  location          text,
  zone              text,
  category          text,
  status            eq_status default 'ok',
  serial            text,
  color             text default '#3c82e8',
  -- Position sur le plan SVG (pourcentages)
  pos_x             numeric(5,2) default 50,
  pos_y             numeric(5,2) default 50,
  pos_w             numeric(5,2) default 10,
  pos_h             numeric(5,2) default 8,
  -- Informations techniques
  schema_desc       text,
  manual_ref        text,
  food_safe         boolean default false,
  last_inspection   date,
  next_inspection   date,
  preventive_interval_days int,
  preventive_tasks  text[],
  next_preventive   date,
  -- Audit
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── PIÈCES DE RECHANGE ─────────────────────────────────────
create table parts (
  id               uuid default gen_random_uuid() primary key,
  ref              text not null unique,
  name             text not null,
  category         text,
  unit             text default 'pcs',
  qty              int default 0 check (qty >= 0),
  min_qty          int default 1,
  price            numeric(10,2),
  supplier         text,
  supplier_ref     text,
  supplier_contact text,
  -- Localisation physique dans le magasin
  location         text,          -- ex: "A1-E3"
  location_detail  text,          -- ex: "Armoire A1, étagère 3, bac rouge"
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── COMPATIBILITÉ ÉQUIPEMENT ↔ PIÈCE ───────────────────────
create table equipment_parts (
  equipment_id  uuid references equipments(id) on delete cascade,
  part_id       uuid references parts(id) on delete cascade,
  primary key (equipment_id, part_id)
);

-- ─── INTERVENTIONS ──────────────────────────────────────────
create table interventions (
  id                  uuid default gen_random_uuid() primary key,
  title               text not null,
  description         text,
  equipment_id        uuid references equipments(id),
  technician_id       uuid references profiles(id),
  created_by          uuid references profiles(id),
  status              int_status default 'a_faire',
  priority            priority_lvl default 'normale',
  food_impact         boolean default false,
  production_stopped  boolean default false,
  -- Rapport d'intervention (rempli par le technicien)
  report_actions      text,
  report_observations text,
  report_duration     int,            -- minutes
  report_verdict      text,           -- conforme | non_conforme | a_surveiller
  report_hygiene      boolean default false,
  report_cleaning     boolean default false,
  signed_at           timestamptz,
  signed_by           uuid references profiles(id),
  -- Timestamps
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── PHOTOS D'INTERVENTION ──────────────────────────────────
create table intervention_photos (
  id               uuid default gen_random_uuid() primary key,
  intervention_id  uuid references interventions(id) on delete cascade,
  url              text not null,          -- URL Supabase Storage
  filename         text,
  uploaded_by      uuid references profiles(id),
  created_at       timestamptz default now()
);

-- ─── COMMENTAIRES ───────────────────────────────────────────
create table intervention_comments (
  id               uuid default gen_random_uuid() primary key,
  intervention_id  uuid references interventions(id) on delete cascade,
  text             text not null,
  author_id        uuid references profiles(id),
  created_at       timestamptz default now()
);

-- ─── PIÈCES UTILISÉES PAR INTERVENTION ──────────────────────
create table intervention_parts (
  id               uuid default gen_random_uuid() primary key,
  intervention_id  uuid references interventions(id) on delete cascade,
  part_id          uuid references parts(id),
  qty_used         int default 1 check (qty_used > 0),
  created_at       timestamptz default now()
);

-- ─── JOURNAL D'AUDIT ────────────────────────────────────────
-- Non modifiable — conforme IFS/BRC/ISO 22000
create table audit_log (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id),
  action      text not null,
  target      text,
  detail      text,
  ip_address  text,
  created_at  timestamptz default now()
  -- PAS de updated_at : les logs ne se modifient jamais
);

-- ─── TRIGGERS ───────────────────────────────────────────────

-- Déduire le stock automatiquement quand une pièce est utilisée
create or replace function deduct_part_stock()
returns trigger as $$
begin
  update parts
  set qty = qty - NEW.qty_used, updated_at = now()
  where id = NEW.part_id;
  
  -- Log dans l'audit
  insert into audit_log (action, target, detail)
  select 
    'Consommation stock',
    p.name,
    'Qté: -' || NEW.qty_used || ' | OT: ' || NEW.intervention_id
  from parts p where p.id = NEW.part_id;
  
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_part_used
  after insert on intervention_parts
  for each row execute function deduct_part_stock();

-- updated_at automatique sur toutes les tables
create or replace function touch_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger touch_profiles      before update on profiles      for each row execute function touch_updated_at();
create trigger touch_equipments    before update on equipments    for each row execute function touch_updated_at();
create trigger touch_parts         before update on parts         for each row execute function touch_updated_at();
create trigger touch_interventions before update on interventions for each row execute function touch_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
alter table profiles             enable row level security;
alter table equipments           enable row level security;
alter table parts                enable row level security;
alter table equipment_parts      enable row level security;
alter table interventions        enable row level security;
alter table intervention_photos  enable row level security;
alter table intervention_comments enable row level security;
alter table intervention_parts   enable row level security;
alter table audit_log            enable row level security;
alter table site_config          enable row level security;

-- Helper : récupérer le rôle de l'utilisateur connecté
create or replace function current_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILS : chacun voit son propre profil, admin/chef voient tout
create policy "profiles_select" on profiles for select using (
  id = auth.uid() or current_user_role() in ('admin','chef')
);
create policy "profiles_update" on profiles for update using (
  id = auth.uid() or current_user_role() = 'admin'
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, avatar, color, active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email, '@', 1), 'Utilisateur'),
    'technician',
    upper(left(coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email, '@', 1), 'U'), 2)),
    '#3c82e8',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ÉQUIPEMENTS : tout le monde peut lire, admin/chef peuvent écrire
create policy "eq_select" on equipments for select using (true);
create policy "eq_insert" on equipments for insert with check (current_user_role() in ('admin','chef'));
create policy "eq_update" on equipments for update using (current_user_role() in ('admin','chef'));
create policy "eq_delete" on equipments for delete using (current_user_role() = 'admin');

-- PIÈCES : tout le monde lit, chef/admin écrivent
create policy "parts_select" on parts for select using (true);
create policy "parts_insert" on parts for insert with check (current_user_role() in ('admin','chef'));
create policy "parts_update" on parts for update using (current_user_role() in ('admin','chef'));

-- COMPATIBILITÉ
create policy "eqparts_select" on equipment_parts for select using (true);
create policy "eqparts_write"  on equipment_parts for all using (current_user_role() in ('admin','chef'));

-- INTERVENTIONS : technicien voit les siennes, chef/admin voient tout
create policy "int_select" on interventions for select using (
  technician_id = auth.uid()
  or created_by = auth.uid()
  or current_user_role() in ('admin','chef')
);
create policy "int_insert" on interventions for insert with check (
  auth.uid() is not null
);
create policy "int_update" on interventions for update using (
  technician_id = auth.uid()
  or created_by = auth.uid()
  or current_user_role() in ('admin','chef')
);

-- PHOTOS : lire si on peut lire l'intervention
create policy "photos_select" on intervention_photos for select using (
  exists (
    select 1 from interventions i
    where i.id = intervention_id
    and (i.technician_id = auth.uid() or current_user_role() in ('admin','chef'))
  )
);
create policy "photos_insert" on intervention_photos for insert with check (
  auth.uid() is not null
);

-- COMMENTAIRES
create policy "comments_select" on intervention_comments for select using (
  exists (
    select 1 from interventions i
    where i.id = intervention_id
    and (i.technician_id = auth.uid() or current_user_role() in ('admin','chef'))
  )
);
create policy "comments_insert" on intervention_comments for insert with check (auth.uid() is not null);

-- PIÈCES UTILISÉES
create policy "int_parts_select" on intervention_parts for select using (true);
create policy "int_parts_insert" on intervention_parts for insert with check (auth.uid() is not null);

-- AUDIT LOG : lecture admin/chef, insertion via triggers uniquement
create policy "audit_select" on audit_log for select using (current_user_role() in ('admin','chef'));

-- CONFIG SITE : lecture tout le monde, écriture admin
create policy "config_select" on site_config for select using (true);
create policy "config_update" on site_config for update using (current_user_role() = 'admin');

-- ─── STORAGE BUCKET POUR PHOTOS ─────────────────────────────
-- À créer manuellement dans Supabase → Storage → New bucket
-- Nom: "intervention-photos"  Public: false
-- Ou via SQL (nécessite l'extension storage) :
-- insert into storage.buckets (id, name, public) values ('intervention-photos', 'intervention-photos', false);

-- ─── DONNÉES DE DÉMONSTRATION ───────────────────────────────
-- Insérer APRÈS avoir créé les comptes dans Authentication
-- Remplacer les UUID par ceux réels de auth.users

-- insert into profiles (id, name, role, avatar, color) values
-- ('UUID-ICI', 'Alexandre Moreau', 'admin', 'AM', '#e8643c'),
-- ('UUID-ICI', 'Bernard Lefebvre', 'chef', 'BL', '#a855f7'),
-- ('UUID-ICI', 'Lucas Martin', 'technician', 'LM', '#3c82e8');

insert into equipments (name, location, zone, category, status, serial, color, pos_x, pos_y, pos_w, pos_h, schema_desc, manual_ref, food_safe, last_inspection, next_inspection)
values
('Compresseur Atlas #3', 'Atelier B', 'B', 'Pneumatique', 'ok', 'ATL-2019-003', '#3c82e8', 18, 30, 10, 8, 'Compresseur à vis 15kW, débit 2.4 m³/min, pression max 10 bars. Filtration ISO 8573-1 Classe 1 (air alimentaire).', 'ATL-15KW-2019-FR', true, '2025-02-15', '2025-08-15'),
('Tour CNC Mazak', 'Usinage', 'A', 'Machine-outil', 'panne', 'MZK-2021-011', '#e8643c', 40, 15, 12, 10, 'Tour CNC 2 axes, broche 5500 tr/min, puissance 11kW.', 'MZK-QTN100-2021', false, '2025-01-10', '2025-07-10'),
('Tapis convoyeur ligne A', 'Production ligne A', 'C', 'Convoyeur', 'ok', 'CVY-2020-001', '#3cb87a', 60, 50, 16, 6, 'Convoyeur à bande alimentaire 18m, bande PU lisse homologuée contact alimentaire.', 'CVY-FOOD-2020', true, '2025-03-01', '2025-06-01'),
('Groupe électrogène', 'Local technique', 'D', 'Électrique', 'maintenance', 'GE-2020-002', '#f59e0b', 75, 20, 10, 8, 'Groupe 80kVA, moteur diesel Perkins 1104D. Démarrage auto sur coupure réseau.', 'GE-80KVA-2020', false, '2025-01-20', '2025-07-20'),
('Chambre froide +4°C', 'Zone stockage', 'B', 'Froid', 'ok', 'CF-2018-001', '#06b6d4', 20, 55, 12, 10, 'Chambre froide 120m³, groupe frigorifique 12kW, contrôle HACCP continu.', 'CF-POS-2018', true, '2025-04-01', '2025-07-01'),
('Doseuse automatique', 'Production ligne A', 'C', 'Process', 'ok', 'DOS-2022-003', '#a855f7', 62, 60, 8, 8, 'Doseuse volumétrique, précision ±0.5g, nettoyage CIP intégré, inox 316L.', 'DOS-VOL-2022', true, '2025-03-15', '2025-09-15');

insert into parts (ref, name, category, unit, qty, min_qty, price, supplier, supplier_ref, supplier_contact, location, location_detail)
values
('FLT-AIR-001', 'Filtre à air 50µm', 'Filtration', 'pcs', 12, 3, 24.50, 'Atlas Copco', '1621737500', '0800 235 235', 'A1-E3', 'Armoire A1, étagère 3, bac rouge'),
('JNT-INOX-022', 'Joint EPDM alimentaire Ø22', 'Joints', 'pcs', 45, 10, 5.80, 'Norelem', '03100-022', '01 60 86 60 86', 'B2-E1', 'Armoire B2, étagère 1, boîte joints noire'),
('RLT-6205-2RS', 'Roulement 6205-2RS inox', 'Roulements', 'pcs', 2, 2, 18.90, 'SKF France', '6205-2RS1', '01 69 18 60 00', 'A2-E2', 'Armoire A2, étagère 2, compartiment roulements'),
('BND-PU-600', 'Bande PU contact alimentaire 600mm', 'Convoyage', 'm', 8, 3, 42.00, 'Habasit', 'F-5EL/U2-600', '03 88 78 39 00', 'C1-SOL', 'Zone C1, rouleau au sol, étiquette verte'),
('HUI-FG-VG46', 'Huile alimentaire FG VG 46 (5L)', 'Lubrifiants', 'L', 25, 10, 18.50, 'Total Lubmarine', 'NEVASTANE-AW-46', '0800 600 600', 'D1-E1', 'Local technique D1, étagère basse, bidons blancs'),
('FUS-10A-250V', 'Fusible 10A 250V', 'Électrique', 'pcs', 3, 5, 1.20, 'Schneider Electric', 'DF2-CA10', '0825 012 500', 'A1-E1', 'Armoire A1, étagère 1, tiroir fusibles'),
('CON-MOT-LC1D', 'Contacteur moteur LC1D09', 'Électrique', 'pcs', 2, 1, 42.00, 'Schneider Electric', 'LC1D09B7', '0825 012 500', 'A1-E2', 'Armoire A1, étagère 2, boîte contacteurs'),
('VAN-INOX-24V', 'Vanne inox solénoïde 24V alim.', 'Pneumatique', 'pcs', 1, 1, 89.00, 'Bürkert', '6014-A-15-FKM', '01 41 21 94 94', 'B3-E2', 'Armoire B3, étagère 2, pièces pneumatiques');

-- ─── FONCTION AJUSTEMENT STOCK SÉCURISÉ ──────────────────────
-- Met à jour le stock de façon sécurisée (évite les conflits simultanés)
create or replace function adjust_part_stock(part_id uuid, new_qty int)
returns void as $$
begin
  update parts
  set qty = new_qty, updated_at = now()
  where id = part_id;
end;
$$ language plpgsql security definer;

-- Politique storage pour les photos d'intervention
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'intervention-photos' and auth.role() = 'authenticated');

create policy "Authenticated users can view photos"
  on storage.objects for select
  using (bucket_id = 'intervention-photos' and auth.role() = 'authenticated');
