import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Admin only if a row exists in public.admin_users for this user.
 * (Must match RLS on articles; env-based email lists cannot grant DB writes.)
 */
export async function userIsAdmin(user: User): Promise<boolean> {
  if (!supabase) {
    return false
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return false
  }

  return !!data
}
