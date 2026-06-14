-- =====================================================================
-- Om Coins — schema, RLS, and awarding RPC
-- Run against the same Supabase project as the rest of Om Daily.
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------- Tables ---------------------------------------------------

create table if not exists public.dharma_coin_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_coins integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.dharma_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('streak', 'prayer', 'lotus_level', 'redemption', 'bonus')),
  source_ref text,
  base_amount integer not null,
  multiplier numeric(4,2) not null default 1.0,
  amount integer not null,
  streak_at_award integer,
  earned_at_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists dharma_coin_tx_user_created_idx
  on public.dharma_coin_transactions (user_id, created_at desc);

create index if not exists dharma_coin_tx_user_date_source_idx
  on public.dharma_coin_transactions (user_id, earned_at_date, source);

-- ---------- Row-Level Security ---------------------------------------

alter table public.dharma_coin_balances enable row level security;
alter table public.dharma_coin_transactions enable row level security;

drop policy if exists "balances_select_own" on public.dharma_coin_balances;
create policy "balances_select_own"
  on public.dharma_coin_balances for select
  using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.dharma_coin_transactions;
create policy "transactions_select_own"
  on public.dharma_coin_transactions for select
  using (auth.uid() = user_id);

-- Writes go through SECURITY DEFINER RPC below; no insert/update policies.

-- ---------- Multiplier helper ----------------------------------------

create or replace function public.dharma_streak_multiplier(p_streak integer)
returns numeric
language sql
immutable
as $$
  select case
    when p_streak >= 90 then 2.0
    when p_streak >= 30 then 1.5
    when p_streak >= 7  then 1.25
    else 1.0
  end::numeric(4,2);
$$;

-- ---------- Award RPC ------------------------------------------------
-- Returns a single row:
--   awarded     : final coins added (0 if capped / duplicate)
--   base        : pre-multiplier amount
--   multiplier  : streak tier multiplier applied
--   total       : new running balance
--   reason      : 'awarded' | 'already_today_streak' | 'already_today_prayer'
--                 | 'lotus_cap_reached' | 'lotus_level_already_claimed'
--                 | 'unauthenticated' | 'unknown_source'
--   streak      : current streak at award time

create or replace function public.award_dharma_coins(
  p_source text,
  p_source_ref text default null,
  p_user_timezone text default 'UTC'
)
returns table (
  awarded integer,
  base integer,
  multiplier numeric,
  total integer,
  reason text,
  streak integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_streak integer := 0;
  v_multiplier numeric(4,2) := 1.0;
  v_base integer := 0;
  v_amount integer := 0;
  v_today date;
  v_today_count integer := 0;
  v_total integer := 0;
  v_reason text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return query select 0, 0, 1.0::numeric, 0, 'unauthenticated'::text, 0;
    return;
  end if;

  -- Local "today" for this user (defaults to UTC if timezone invalid)
  begin
    v_today := (now() at time zone p_user_timezone)::date;
  exception when others then
    v_today := (now() at time zone 'UTC')::date;
  end;

  select coalesce(streak_count, 0)
    into v_streak
    from public.profiles
   where id = v_user_id;
  v_streak := coalesce(v_streak, 0);
  v_multiplier := public.dharma_streak_multiplier(v_streak);

  if p_source = 'streak' then
    select count(*) into v_today_count
      from public.dharma_coin_transactions
     where user_id = v_user_id
       and source = 'streak'
       and earned_at_date = v_today;
    if v_today_count > 0 then
      v_reason := 'already_today_streak';
    else
      v_base := 1;
    end if;

  elsif p_source = 'prayer' then
    select count(*) into v_today_count
      from public.dharma_coin_transactions
     where user_id = v_user_id
       and source = 'prayer'
       and earned_at_date = v_today;
    if v_today_count > 0 then
      v_reason := 'already_today_prayer';
    else
      v_base := 2;
    end if;

  elsif p_source = 'lotus_level' then
    -- Same level can never be claimed twice (lifetime)
    if p_source_ref is not null then
      perform 1 from public.dharma_coin_transactions
        where user_id = v_user_id
          and source = 'lotus_level'
          and source_ref = p_source_ref;
      if found then
        v_reason := 'lotus_level_already_claimed';
      end if;
    end if;

    if v_reason is null then
      -- Max 3 levels per day count toward points
      select count(*) into v_today_count
        from public.dharma_coin_transactions
       where user_id = v_user_id
         and source = 'lotus_level'
         and earned_at_date = v_today;
      if v_today_count >= 3 then
        v_reason := 'lotus_cap_reached';
      else
        v_base := 2;
      end if;
    end if;

  else
    v_reason := 'unknown_source';
  end if;

  if v_base > 0 then
    -- Round half away from zero; multiplier always >= 1
    v_amount := round(v_base * v_multiplier)::integer;

    insert into public.dharma_coin_transactions
      (user_id, source, source_ref, base_amount, multiplier, amount, streak_at_award, earned_at_date)
    values
      (v_user_id, p_source, p_source_ref, v_base, v_multiplier, v_amount, v_streak, v_today);

    insert into public.dharma_coin_balances (user_id, total_coins, updated_at)
    values (v_user_id, v_amount, now())
    on conflict (user_id)
    do update set
      total_coins = public.dharma_coin_balances.total_coins + excluded.total_coins,
      updated_at = now();

    v_reason := 'awarded';
  end if;

  select coalesce(total_coins, 0) into v_total
    from public.dharma_coin_balances where user_id = v_user_id;

  return query select v_amount, v_base, v_multiplier, coalesce(v_total, 0), v_reason, v_streak;
end;
$$;

grant execute on function public.award_dharma_coins(text, text, text) to authenticated;
grant execute on function public.dharma_streak_multiplier(integer) to authenticated;

-- ---------- Backfill balance row for existing users (optional) -------
-- Ensures every existing user has a 0-coin row so the home pill renders
-- a value on first load instead of a missing-row case.

insert into public.dharma_coin_balances (user_id, total_coins)
select id, 0
from auth.users
on conflict (user_id) do nothing;
