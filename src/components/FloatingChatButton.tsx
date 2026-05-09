'use client'

import Link from 'next/link'
import { useContext, useEffect, useState } from 'react'
import { StreamContext } from '@/components/StreamProvider'

export default function FloatingChatButton() {
  const { client, isReady } = useContext(StreamContext)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isReady || !client) return

    const getInitialUnread = async () => {
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

    getInitialUnread()

    const handleNewMessage = (event: any) => {
      if (event.message?.user?.id !== client.userID) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    const handleMarkRead = async () => {
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

  if (!isReady || !client) return null

  return (
    <Link
      href="/messages"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {unreadCount > 0 && (
        <span
          className="absolute flex items-center justify-center"
          style={{
            top: '0px',
            right: '0px',
            minWidth: '16px',
            height: '16px',
            backgroundColor: '#ef4444', /* red-500 */
            borderRadius: '9999px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1,
            padding: unreadCount > 9 ? '0 4px' : '0',
            border: '2px solid var(--background)'
          }}
        >
          {unreadCount > 9 ? '9+' : ''}
        </span>
      )}
    </Link>
  )
}
