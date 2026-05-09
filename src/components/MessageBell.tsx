'use client'

import Link from 'next/link'
import { useContext, useEffect, useState } from 'react'
import { StreamContext } from '@/components/StreamProvider'

/**
 * MessageBell — shows a chat bubble icon in the navbar.
 * When there are unread messages, a green dot badge appears.
 * Connects to Stream Chat via StreamContext to listen for real-time updates.
 */
export default function MessageBell() {
  const { client, isReady } = useContext(StreamContext)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isReady || !client) return

    // Get initial unread count from the client state
    const getInitialUnread = async () => {
      try {
        // Query all messaging channels this user is in
        const channels = await client.queryChannels(
          { type: 'messaging', members: { $in: [client.userID!] } },
          {},
          { state: true }
        )
        const total = channels.reduce((sum, ch) => sum + (ch.countUnread() ?? 0), 0)
        setUnreadCount(total)
      } catch {
        // Silently fail — badge just won't show
      }
    }

    getInitialUnread()

    // Listen for new messages arriving
    const handleNewMessage = (event: any) => {
      // Only count if the message is NOT from the current user
      if (event.message?.user?.id !== client.userID) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    // Listen for the user reading a channel (mark as read)
    const handleMarkRead = async () => {
      // Re-query total unread across all channels
      try {
        const channels = await client.queryChannels(
          { type: 'messaging', members: { $in: [client.userID!] } },
          {},
          { state: true }
        )
        const total = channels.reduce((sum, ch) => sum + (ch.countUnread() ?? 0), 0)
        setUnreadCount(total)
      } catch {}
    }

    client.on('message.new', handleNewMessage)
    client.on('message.read', handleMarkRead)
    client.on('notification.mark_read', handleMarkRead)

    return () => {
      client.off('message.new', handleNewMessage)
      client.off('message.read', handleMarkRead)
      client.off('notification.mark_read', handleMarkRead)
    }
  }, [isReady, client])

  // Don't render if user is not connected to Stream at all
  if (!isReady || !client) return null

  return (
    <Link
      href="/messages"
      className="relative flex items-center"
      title={unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'Messages'}
      aria-label="Messages"
    >
      {/* Chat bubble icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        style={{ color: 'var(--muted)' }}
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {/* Green dot badge — only shows when there are unread messages */}
      {unreadCount > 0 && (
        <span
          className="absolute flex items-center justify-center"
          style={{
            top: '-4px',
            right: '-5px',
            minWidth: unreadCount > 9 ? '14px' : '8px',
            height: unreadCount > 9 ? '14px' : '8px',
            backgroundColor: '#22c55e', /* green-500 */
            borderRadius: '9999px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1,
            padding: unreadCount > 9 ? '0 2px' : '0',
          }}
        >
          {unreadCount > 9 ? '9+' : ''}
        </span>
      )}
    </Link>
  )
}
