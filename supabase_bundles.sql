-- Bundles / Collections : packs de livres vendus ensemble à prix réduit
create table if not exists bundles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  book_ids uuid[] not null default '{}',
  price integer not null default 0,        -- prix du pack en centimes (USD)
  cover_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tracer l'achat d'un pack (seulement si la table purchases existe)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'purchases') then
    alter table purchases add column if not exists bundle_id uuid references bundles(id);
  end if;
end $$;

-- Lecture publique des packs publiés
alter table bundles enable row level security;

drop policy if exists "Public read published bundles" on bundles;
create policy "Public read published bundles"
  on bundles for select
  using (is_published = true);
