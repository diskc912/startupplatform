import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NotificationBellClient from './NotificationBellClient'

export default async function NotificationBell() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch count of unread notifications
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread notifications count:', error)
  }

  const unreadCount = count || 0

  return <NotificationBellClient unreadCount={unreadCount} />
}
