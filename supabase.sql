create extension if not exists pgcrypto;
create table if not exists public.surpresas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null,
 your_name text not null, partner_name text not null, nickname text,
 message_title text, message text, signature text,
 song_name text, artist text, music_type text default 'none', music_url text,
 photos jsonb not null default '[]'::jsonb, puzzle_url text, theme text default 'pink',
 start_date timestamptz, surprise_message text, created_at timestamptz not null default now()
);
alter table public.surpresas enable row level security;
create policy "public read surprises" on public.surpresas for select using (true);
create policy "creator insert surprises" on public.surpresas for insert to authenticated with check (auth.uid()=owner_id);
create policy "creator update surprises" on public.surpresas for update to authenticated using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "creator delete surprises" on public.surpresas for delete to authenticated using (auth.uid()=owner_id);
-- Create a Storage bucket named 'surpresas' and make it public.
create policy "public read surprise files" on storage.objects for select using (bucket_id='surpresas');
create policy "creator upload surprise files" on storage.objects for insert to authenticated with check (bucket_id='surpresas' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "creator update surprise files" on storage.objects for update to authenticated using (bucket_id='surpresas' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='surpresas' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "creator delete surprise files" on storage.objects for delete to authenticated using (bucket_id='surpresas' and (storage.foldername(name))[1]=auth.uid()::text);
