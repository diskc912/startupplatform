'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Failed to mark notifications as read:', error)
    return { error: 'Failed to mark as read' }
  }

  revalidatePath('/notifications')
  revalidatePath('/', 'layout') // Revalidate layout to update Navbar bell everywhere

  return { success: true }
}

export async function markAllAsReadQuietly() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  // Explicitly skipping revalidatePath!
  // This lets the client locally hide the bell dot via usePathname without
  // forcefully re-rendering the current Notifications page and wiping out
  // the unread styles while the user is looking at them.
  return { success: true }
}
