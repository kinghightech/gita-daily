-- Delete-account RPC for Apple App Store compliance (5.1.1(v)).
-- A signed-in user can delete their own account and all related data.
-- Uses auth.uid() so each caller can only delete themselves.

CREATE OR REPLACE FUNCTION public.delete_current_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.dharma_coin_transactions    WHERE user_id = uid;
  DELETE FROM public.dharma_coin_balances        WHERE user_id = uid;
  DELETE FROM public.user_activity               WHERE user_id = uid;
  DELETE FROM public.user_notes                  WHERE user_id = uid;
  DELETE FROM public.user_badges                 WHERE user_id = uid;
  DELETE FROM public.user_festival_favorites     WHERE user_id = uid;
  DELETE FROM public.user_favorites              WHERE user_id = uid;
  DELETE FROM public.world_lotus_progress        WHERE user_id = uid;
  DELETE FROM public.streaks                     WHERE user_id = uid;
  DELETE FROM public.profiles                    WHERE id      = uid;
  DELETE FROM auth.users                         WHERE id      = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_current_user_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_current_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_current_user_account() TO authenticated;
