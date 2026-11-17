-- Maket: per-user accounts (applied to Supabase project kwoftzpxtytcgahsgjro as migration "per_user_accounts").
-- Kept here for reference only; build.py does not use it.

-- 1) users table (replaces secrets). No RLS policies: reachable only through the RPCs below.
create table if not exists public.users(
  username text primary key check (username ~ '^[^/[:space:]]{2,30}$'),
  hash text not null,
  created_at timestamptz not null default now());
alter table public.users enable row level security;

-- move the existing owner password (sha256 hash) to the account "abdullah"
insert into public.users(username,hash) select 'abdullah', h from public.secrets where id=1 on conflict do nothing;

-- 2) reviews get an owner
alter table public.reviews add column if not exists owner text references public.users(username) on update cascade;
update public.reviews set owner='abdullah' where owner is null;
alter table public.reviews alter column owner set not null;
create index if not exists reviews_owner_idx on public.reviews(owner);
create index if not exists notes_review_idx on public.notes(review_id);

-- 3) existing cloud data (old single-owner path) -> abdullah
update public.kv set path='u/abdullah/data' where path='data/users/me';

-- 4) helpers
create or replace function public._un(u text) returns text language sql immutable set search_path='' as $$ select lower(btrim(coalesce(u,''))) $$;
create or replace function public._uok(u text, k text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_variable
declare h text;
begin
  select users.hash into h from public.users where username = public._un(u);
  if h is null or k is null then return false; end if;
  if h like '$2%' then return h = extensions.crypt(k, h); end if;
  if h = encode(extensions.digest(k,'sha256'),'hex') then
    update public.users set hash = extensions.crypt(k, extensions.gen_salt('bf')) where username = public._un(u); -- upgrade old hash
    return true; end if;
  return false;
end $$;
create or replace function public._kp(u text, p text) returns text language sql immutable set search_path='' as $$ select 'u/'||public._un(u)||'/'||coalesce(p,'') $$;

-- 5) accounts
create or replace function public.user_signup(u text, k text) returns text
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_variable
begin
  if public._un(u) !~ '^[^/[:space:]]{2,30}$' then return 'badname'; end if;
  if length(coalesce(k,'')) < 4 then return 'short'; end if;
  if exists(select 1 from public.users where username = public._un(u)) then return 'taken'; end if;
  insert into public.users(username,hash) values (public._un(u), extensions.crypt(k, extensions.gen_salt('bf')));
  return 'new';
end $$;
create or replace function public.user_login(u text, k text) returns text
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if public._uok(u,k) then return 'ok'; end if; return 'bad'; end $$;

-- 6) private key/value store, scoped to u/<username>/
create or replace function public.kv_get(u text, k text, p text, i text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  return (select data from public.kv where path = public._kp(u,p) and id = i); end $$;
create or replace function public.kv_list(u text, k text, p text) returns table(id text, data jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  return query select kv.id, kv.data from public.kv where kv.path = public._kp(u,p); end $$;
create or replace function public.kv_set(u text, k text, p text, i text, d jsonb) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  insert into public.kv(path,id,data,u) values (public._kp(u,p),i,d,now())
  on conflict (path,id) do update set data = excluded.data, u = now(); end $$;
create or replace function public.kv_del(u text, k text, p text, i text) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  delete from public.kv where path = public._kp(u,p) and id = i; end $$;

-- 7) review links, owned
create or replace function public.review_put(u text, k text, i text, n text, s jsonb) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  if exists(select 1 from public.reviews where id = i and owner <> public._un(u)) then raise exception 'denied'; end if;
  insert into public.reviews(id,name,st,u,owner) values (i,n,s,now(),public._un(u))
  on conflict (id) do update set name = excluded.name, st = excluded.st, u = now(); end $$;
create or replace function public.review_del(u text, k text, i text) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  delete from public.reviews where id = i and owner = public._un(u); end $$;
create or replace function public.review_list(u text, k text) returns table(id text, name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  return query select r.id, r.name from public.reviews r where r.owner = public._un(u); end $$;
create or replace function public.note_del(u text, k text, i text) returns void
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
begin if not public._uok(u,k) then raise exception 'denied'; end if;
  delete from public.notes n using public.reviews r where n.id = i and r.id = n.review_id and r.owner = public._un(u); end $$;

-- 8) old single-password RPCs: dropped together with secrets
drop function if exists public.owner_claim(text);
drop function if exists public.kv_get(text,text,text);
drop function if exists public.kv_list(text,text);
drop function if exists public.kv_set(text,text,text,jsonb);
drop function if exists public.kv_del(text,text,text);
drop function if exists public.review_put(text,text,text,jsonb);
drop function if exists public.review_del(text,text);
drop function if exists public.note_del(text,text);
drop function if exists public._ok(text);
drop table if exists public.secrets;

-- 9) permissions: only the public RPCs are callable by the site
revoke all on function public._uok(text,text), public._un(text), public._kp(text,text) from public, anon, authenticated;
revoke all on function public.user_signup(text,text), public.user_login(text,text),
  public.kv_get(text,text,text,text), public.kv_list(text,text,text), public.kv_set(text,text,text,text,jsonb), public.kv_del(text,text,text,text),
  public.review_put(text,text,text,text,jsonb), public.review_del(text,text,text), public.review_list(text,text), public.note_del(text,text,text) from public;
grant execute on function public.user_signup(text,text), public.user_login(text,text),
  public.kv_get(text,text,text,text), public.kv_list(text,text,text), public.kv_set(text,text,text,text,jsonb), public.kv_del(text,text,text,text),
  public.review_put(text,text,text,text,jsonb), public.review_del(text,text,text), public.review_list(text,text), public.note_del(text,text,text) to anon, authenticated;
