-- =====================================================================
-- Skip-a-level with Om Coins
-- Spend a fixed number of coins to mark the current level complete and
-- unlock the next, atomically. Works for every playable path.
-- Run against the same Supabase project as the rest of Om Daily.
-- Idempotent: safe to re-run.
-- =====================================================================

-- Cost is fixed at 5 coins (kept in sync with SKIP_LEVEL_COST in lib/omCoins.ts).
--
-- Returns a single row:
--   ok          : true when coins were spent and the level advanced
--   reason      : 'skipped' | 'insufficient_coins' | 'not_current_level'
--                 | 'cannot_skip_gate' | 'unknown_path' | 'no_profile'
--                 | 'unauthenticated'
--   new_balance : running coin balance after the spend
--   new_level   : the path's current level after the skip
--   cost        : coins charged (or that would have been charged)
--
-- Guard rails:
--   • You can only skip the level you are currently on (prevents skipping
--     ahead to locked levels and prevents double-spend on a stale screen).
--   • The Wisdom Gate (each path's capstone) can never be skipped.
--   • The spend + the level advance happen in one transaction, so coins are
--     never charged without the level moving forward.
--
-- NOTE: uses static SQL throughout. An earlier version read the level column
-- with dynamic `EXECUTE ... INTO`, but EXECUTE does NOT set the FOUND flag in
-- PL/pgSQL, so the `if not found` check was always true and the function
-- returned 'no_profile' for everyone. CASE-based static SELECT INTO sets FOUND
-- correctly.

create or replace function public.skip_level_with_coins(
  p_path text,
  p_level integer,
  p_user_timezone text default 'UTC'
)
returns table (
  ok boolean,
  reason text,
  new_balance integer,
  new_level integer,
  cost integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cost constant integer := 5;
  v_today date;
  v_balance integer := 0;
  v_current integer;
  v_gate integer;
  v_new_level integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return query select false, 'unauthenticated'::text, 0, 0, v_cost;
    return;
  end if;

  -- Path slug → Wisdom Gate level (mirrors PATH_WISDOM_GATE_LEVEL in lib/).
  v_gate := case p_path
    when 'lotus' then 21
    when 'mountain' then 24
    when 'garden' then 34
    when 'forest' then 36
    else null
  end;
  if v_gate is null then
    return query select false, 'unknown_path'::text, 0, 0, v_cost;
    return;
  end if;

  -- Local "today" for this user (defaults to UTC if timezone invalid).
  begin
    v_today := (now() at time zone p_user_timezone)::date;
  exception when others then
    v_today := (now() at time zone 'UTC')::date;
  end;

  -- Current level for this path. Static SELECT INTO so FOUND is set correctly.
  select case p_path
           when 'lotus' then current_world_lotus_level
           when 'mountain' then current_mountain_path_level
           when 'garden' then current_garden_path_level
           when 'forest' then current_forest_path_level
         end
    into v_current
    from public.profiles
   where id = v_user_id;
  if not found then
    return query select false, 'no_profile'::text, 0, 0, v_cost;
    return;
  end if;
  v_current := coalesce(v_current, 1);

  -- Can only skip the level you are currently on.
  if p_level <> v_current then
    return query select false, 'not_current_level'::text, 0, v_current, v_cost;
    return;
  end if;

  -- The Wisdom Gate must be earned, never bought.
  if p_level >= v_gate then
    return query select false, 'cannot_skip_gate'::text, 0, v_current, v_cost;
    return;
  end if;

  -- Balance check.
  select coalesce(total_coins, 0) into v_balance
    from public.dharma_coin_balances where user_id = v_user_id;
  v_balance := coalesce(v_balance, 0);
  if v_balance < v_cost then
    return query select false, 'insufficient_coins'::text, v_balance, v_current, v_cost;
    return;
  end if;

  -- Record the spend as a negative redemption transaction.
  insert into public.dharma_coin_transactions
    (user_id, source, source_ref, base_amount, multiplier, amount, streak_at_award, earned_at_date)
  values
    (v_user_id, 'redemption', format('skip:%s:%s', p_path, p_level), -v_cost, 1.0, -v_cost, null, v_today);

  update public.dharma_coin_balances
     set total_coins = total_coins - v_cost,
         updated_at = now()
   where user_id = v_user_id
   returning total_coins into v_balance;

  -- Advance only the relevant path's current level.
  v_new_level := p_level + 1;
  update public.profiles
     set current_world_lotus_level   = case when p_path = 'lotus'    then v_new_level else current_world_lotus_level end,
         current_mountain_path_level = case when p_path = 'mountain' then v_new_level else current_mountain_path_level end,
         current_garden_path_level   = case when p_path = 'garden'   then v_new_level else current_garden_path_level end,
         current_forest_path_level   = case when p_path = 'forest'   then v_new_level else current_forest_path_level end
   where id = v_user_id;

  return query select true, 'skipped'::text, coalesce(v_balance, 0), v_new_level, v_cost;
end;
$$;

grant execute on function public.skip_level_with_coins(text, integer, text) to authenticated;
