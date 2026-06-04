-- Quick win 1: key benefits on books
alter table public.books
  add column if not exists key_benefits text[] not null default '{}';

-- Quick win 3: expiry date on promotions
alter table public.promotions
  add column if not exists expires_at timestamptz;
