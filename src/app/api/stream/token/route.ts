import { StreamChat } from 'stream-chat'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
  const apiSecret = process.env.STREAM_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Stream keys missing' }, { status: 500 })
  }

  const serverClient = StreamChat.getInstance(apiKey, apiSecret)
  const token = serverClient.createToken(user.id)

  return NextResponse.json({ token })
}
