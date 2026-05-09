import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { groupNotifications, getNotificationText } from '@/utils/notifications'
import { markAllAsRead } from '@/app/actions/notifications'
import { AutoMarkAsRead } from './AutoMarkAsRead'
import type { Notification } from '@/lib/types'

export const metadata = {
  title: 'Notifications | Founder Ideas',
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all notifications (limit to 100 as per DB design)
  const { data: rawNotifications, error } = await supabase
    .from('notifications')
    .select(`
      id,
      receiver_id,
      sender_id,
      type,
      target_id,
      is_read,
      created_at,
      profiles:sender_id (id, username, avatar_url)
    `)
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching notifications:', error)
  }

  // Use the utility to intelligently group notifications
  // Typecasting is necessary because PostgREST returns profiles as an object or array depending on the relationship,
  // but we know it's a 1:1 join here (sender_id -> profiles.id)
  const groupedNotifications = groupNotifications((rawNotifications || []) as unknown as Notification[])
  const hasUnread = groupedNotifications.some(n => !n.is_read)

  return (
    <div className="max-w-xl mx-auto pt-6 pb-12 px-4">
      <AutoMarkAsRead />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Notifications</h1>
        {hasUnread && (
          <form action={async () => {
            'use server';
            await markAllAsRead();
          }}>
            <button
              type="submit"
              className="text-xs font-medium px-3 py-1.5 transition-colors border"
              style={{
                color: 'var(--background)',
                backgroundColor: 'var(--foreground)',
                borderColor: 'var(--foreground)',
                borderRadius: '9999px',
              }}
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {groupedNotifications.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>
          You have no notifications yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedNotifications.map((group) => {
            const text = getNotificationText(group)
            
            // Determine routing
            let href = '#'
            if (group.type === 'gangup' && group.senders.length > 0) {
              href = `/profile/${group.senders[0].username}`
            } else if ((group.type === 'upvote' || group.type === 'comment') && group.target_id) {
              href = `/ideas/${group.target_id}` // Assuming target_id is an idea/post ID
            }

            return (
              <Link 
                key={group.id} 
                href={href}
                className="block p-4 border transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900 relative"
                style={{ 
                  borderColor: 'var(--border)', 
                  borderLeftWidth: !group.is_read ? '3px' : '1px',
                  borderLeftColor: !group.is_read ? 'var(--foreground)' : 'var(--border)',
                  backgroundColor: !group.is_read ? 'rgba(128, 128, 128, 0.05)' : 'transparent',
                  borderRadius: '12px' 
                }}
              >
                {!group.is_read && (
                  <span 
                    className="absolute right-4 top-4 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--foreground)' }}
                  />
                )}
                
                <div className="flex items-start gap-3">
                  {/* Sender Avatar(s) - just show the primary one for ultra-minimalist feel */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--border)' }}>
                     {group.senders.length > 0 && group.senders[0].avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={group.senders[0].avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--muted)' }}>No img</div>
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center pr-4">
                    <p className="text-sm font-medium leading-snug" style={{ color: 'var(--foreground)' }}>
                      {text}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {getRelativeTime(group.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
