-- Run in Supabase SQL editor (once) to gate admin UI by auth user id.
-- Add yourself: insert into public.admin_users (user_id) values ('<uuid from auth.users>');

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admin_users enable row level security;

create policy "admin_users_select_own"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);
