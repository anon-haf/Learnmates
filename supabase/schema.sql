create extension if not exists pgcrypto;

-- Minimal onboarding schema for Learnmates
-- Includes user profile and favorite onboarding subjects only.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  name text,
  email text,
  study_level text,
  boards text[] default array[]::text[],
  exam_session text,
  profile_complete boolean not null default false,
  onboarding_skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorite_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  level text not null,
  board text not null,
  created_at timestamptz not null default now(),
  unique (user_id, subject, level, board)
);

alter table public.profiles enable row level security;
alter table public.user_favorite_subjects enable row level security;

-- Policies for onboarding-related tables

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can manage own favorite subjects" on public.user_favorite_subjects;
create policy "Users can manage own favorite subjects"
  on public.user_favorite_subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Student'
    )
  )
  on conflict (id) do update
    set updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Check whether an email is already registered and which providers are linked
create or replace function public.get_email_auth_info(check_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  user_record record;
  provider_list text[];
begin
  select u.id, u.email_confirmed_at
  into user_record
  from auth.users u
  where lower(u.email) = lower(trim(check_email))
  limit 1;

  if not found then
    return json_build_object(
      'exists', false,
      'providers', '[]'::json,
      'email_confirmed', false
    );
  end if;

  select coalesce(array_agg(distinct i.provider), array[]::text[])
  into provider_list
  from auth.identities i
  where i.user_id = user_record.id;

  return json_build_object(
    'exists', true,
    'providers', to_json(provider_list),
    'email_confirmed', user_record.email_confirmed_at is not null
  );
end;
$$;

revoke all on function public.get_email_auth_info(text) from public;
grant execute on function public.get_email_auth_info(text) to anon, authenticated;

-- Username availability check without exposing other users' profiles
create or replace function public.is_username_available(desired_username text, for_user_id uuid default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(trim(desired_username))
      and (for_user_id is null or p.id <> for_user_id)
  );
$$;

revoke all on function public.is_username_available(text, uuid) from public;
grant execute on function public.is_username_available(text, uuid) to anon, authenticated;

-- Role-based access control for AI tutor
create table if not exists public.user_role (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_role enable row level security;

drop policy if exists "Users can read their own role" on public.user_role;
create policy "Users can read their own role"
  on public.user_role for select using (auth.uid() = user_id);
