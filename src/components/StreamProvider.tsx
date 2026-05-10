'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { StreamChat } from 'stream-chat'
import { Chat } from 'stream-chat-react'
import { createClient } from '@/lib/supabase/client'

export const StreamContext = createContext<{ client: StreamChat | null, isReady: boolean }>({
  client: null,
  isReady: false
})

// Keep the instance outside so it doesn't recreate on re-renders unnecessarily
let streamClient: StreamChat | null = null

export default function StreamProvider({ children }: { children: React.ReactNode }) {
  const [clientReady, setClientReady] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY

  useEffect(() => {
    if (!apiKey) return

    let isMounted = true
    const initStream = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Disconnect if user logs out
        if (streamClient) {
          await streamClient.disconnectUser()
          streamClient = null
          if (isMounted) setClientReady(false)
        }
        return
      }

      // Fetch the profile to get username and avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      if (!profile) return

      // Fetch the token from our secure API route
      const response = await fetch('/api/stream/token')
      if (!response.ok) return
      
      const { token } = await response.json()

      if (!streamClient) {
        streamClient = StreamChat.getInstance(apiKey)
      }

      // Prevent calling connectUser multiple times in React Strict Mode
      if (streamClient.userID === user.id) {
        if (isMounted) setClientReady(true)
        return
      }

      // If connected as a different user, disconnect first
      if (streamClient.userID) {
        await streamClient.disconnectUser()
      }

      // Connect the user to Stream, syncing their profile info
      try {
        await streamClient.connectUser(
          {
            id: user.id,
            name: profile.username || user.id,
            image: profile.avatar_url || undefined,
          },
          token
        )
      } catch (err) {
        console.error('Stream connection error:', err)
      }

      if (isMounted) {
        setClientReady(true)
      }
    }

    initStream()

    return () => {
      isMounted = false
    }
  }, [apiKey])

  return (
    <StreamContext.Provider value={{ client: streamClient, isReady: clientReady }}>
      {children}
    </StreamContext.Provider>
  )
}
