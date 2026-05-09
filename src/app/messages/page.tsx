'use client'

import { useState, useEffect, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import { Chat, Channel, ChannelHeader, ChannelList, MessageComposer, MessageList, Thread, Window } from 'stream-chat-react'
import 'stream-chat-react/dist/css/index.css'
import './chat.css'
import { StreamContext } from '@/components/StreamProvider'

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const channelId = searchParams.get('channel')
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)

  const { client, isReady } = useContext(StreamContext)

  useEffect(() => {
    if (channelId) {
      setActiveChannelId(channelId)
    }
  }, [channelId])

  if (!isReady || !client) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{ height: 'calc(100vh - 48px)', backgroundColor: 'var(--background)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Connecting to chat...</p>
      </div>
    )
  }

  const filters = { type: 'messaging', members: { $in: [client.userID!] } }
  const sort = { last_message_at: -1 as const }

  return (
    <div
      className="str-chat-override w-full"
      style={{
        height: 'calc(100vh - 48px)', /* Navbar height is 48px */
        borderTop: '1px solid var(--border)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'var(--background)',
      }}
    >
      <Chat client={client}>
        {/* Sidebar: channel list */}
        <div
          className="hidden sm:flex flex-col"
          style={{
            width: '320px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            backgroundColor: 'var(--background)',
          }}
        >
          <ChannelList
            filters={filters}
            sort={sort}
            setActiveChannelOnMount={!activeChannelId}
          />
        </div>

        {/* Main: message window */}
        <div className="flex flex-col flex-1 min-w-0 h-full" style={{ backgroundColor: 'var(--background)' }}>
          <Channel>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageComposer />
            </Window>
            <Thread />
          </Channel>
        </div>
      </Chat>
    </div>
  )
}
