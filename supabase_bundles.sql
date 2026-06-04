-- Bundles / Collections : packs de livres vendus ensemble à prix réduit
create table if not exists public.bundles (
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

-- Tracer l'achat d'un pack (en plus des purchases par livre)
alter table public.purchases
  add column if not exists bundle_id uuid references public.bundles(id);

-- Lecture publique des packs publiés
alter table public.bundles enable row level security;

drop policy if exists "Public read published bundles" on public.bundles;
create policy "Public read published bundles"
  on public.bundles for select
  using (is_published = true);
