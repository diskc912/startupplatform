'use server'

import { createClient } from '@/lib/supabase/server'
import { StreamChat } from 'stream-chat'
import { redirect } from 'next/navigation'

export async function initiateChat(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
  const apiSecret = process.env.STREAM_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Stream configuration missing')
  }

  const serverClient = StreamChat.getInstance(apiKey, apiSecret)
  
  // Prevent messaging oneself
  if (user.id === targetUserId) {
    throw new Error('You cannot message yourself.')
  }

  // Initialize a 1v1 messaging channel between the two users
  const channel = serverClient.channel('messaging', {
    members: [user.id, targetUserId],
    created_by_id: user.id,
  })

  // Create the channel if it doesn't exist
  await channel.create()

  // Redirect to the messaging view with the channel ID
  redirect(`/messages?channel=${channel.id}`)
}
