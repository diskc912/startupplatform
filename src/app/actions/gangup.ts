'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggles the gangup relationship between the current user and the target user.
 * Returns the new gangup state.
 */
export async function toggleGangup(targetUserId: string): Promise<{ success: boolean; isGanged: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, isGanged: false, error: 'You must be logged in to gangup.' }
    }

    if (user.id === targetUserId) {
      return { success: false, isGanged: false, error: "You can't gangup with yourself." }
    }

    // Check if already ganged
    const { data: existing } = await supabase
      .from('gangups')
      .select('ganger_id')
      .eq('ganger_id', user.id)
      .eq('ganged_id', targetUserId)
      .maybeSingle()

    let isGangedNow = false

    if (existing) {
      // Ungang - STRICT DELETE targeting both IDs
      const { error: deleteError } = await supabase
        .from('gangups')
        .delete()
        .eq('ganger_id', user.id)
        .eq('ganged_id', targetUserId)

      if (deleteError) {
        console.error('[Supabase Error] Ungang failed:', deleteError)
        return { success: false, isGanged: true, error: 'Failed to ungang. Try again.' }
      }
      isGangedNow = false
    } else {
      // Gang up
      const { error: insertError } = await supabase
        .from('gangups')
        .insert({ ganger_id: user.id, ganged_id: targetUserId })

      if (insertError) {
        console.error('[Supabase Error] Gangup failed:', insertError)
        return { success: false, isGanged: false, error: 'Failed to gangup. Try again.' }
      }
      isGangedNow = true

      // Insert gangup notification
      const { error: notiError } = await supabase
        .from('notifications')
        .insert({
          receiver_id: targetUserId,
          sender_id: user.id,
          type: 'gangup',
          target_id: null
        })
        
      if (notiError) {
        console.error("[Supabase Error] Failed to insert gangup notification:", notiError)
      }
    }

    // Fetch the target profile username to revalidate its specific path
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', targetUserId)
      .single()

    // Cache Invalidation: 
    // 1. Home feed (to update My Gang tab and feed buttons)
    // 2. The specific profile page
    // 3. Notifications feed
    revalidatePath('/')
    revalidatePath('/notifications')
    if (targetProfile?.username) {
      revalidatePath(`/profile/${targetProfile.username}`)
    }

    return { success: true, isGanged: isGangedNow }
  } catch (err) {
    console.error('toggleGangup unexpected error:', err)
    return { success: false, isGanged: false, error: 'Something went wrong.' }
  }
}
