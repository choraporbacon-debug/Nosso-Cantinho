create extension if not exists pgcrypto;

create table if not exists public.surpresas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  your_name text not null,
  partner_name text not null,
  nickname text,
  message_title text,
  message text,
  signature text,
  photos jsonb not null default '[]'::jsonb,
  puzzle_url text,
  song_name text,
  artist text,
  music_type text not null default 'none'
    check (music_type in ('none','mp3','youtube','url')),
  music_url text,
  theme text not null default 'wine',
  start_date timestamptz,
  surprise_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.surpresas enable row level security;

drop policy if exists "Public can view surprises" on public.surpresas;
create policy "Public can view surprises"
on public.surpresas for select
using (true);

drop policy if exists "Creators can create surprises" on public.surpresas;
create policy "Creators can create surprises"
on public.surpresas for insert to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Creators can update own surprises" on public.surpresas;
create policy "Creators can update own surprises"
on public.surpresas for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Creators can delete own surprises" on public.surpresas;
create policy "Creators can delete own surprises"
on public.surpresas for delete to authenticated
using (auth.uid() = owner_id);

-- Storage: crie manualmente no painel um bucket público chamado "surpresas".
-- As políticas abaixo permitem leitura pública e upload somente em:
-- <owner_id>/<surprise_id>/arquivo
drop policy if exists "Public read surprise files" on storage.objects;
create policy "Public read surprise files"
on storage.objects for select
using (bucket_id = 'surpresas');

drop policy if exists "Creators upload surprise files" on storage.objects;
create policy "Creators upload surprise files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'surpresas'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators update surprise files" on storage.objects;
create policy "Creators update surprise files"
on storage.objects for update to authenticated
using (
  bucket_id = 'surpresas'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'surpresas'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Creators delete surprise files" on storage.objects;
create policy "Creators delete surprise files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'surpresas'
  and (storage.foldername(name))[1] = auth.uid()::text
);