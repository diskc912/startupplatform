'use client'

import { useEffect } from 'react'
import { markAllAsReadQuietly } from '@/app/actions/notifications'

export function AutoMarkAsRead() {
  useEffect(() => {
    // Fire and forget: Mark everything as read in the DB so that next time
    // they navigate away and the layout fetches again, the bell count is zero.
    // Since we DON'T revalidate here, the unread cards on the screen won't suddenly
    // flash and lose their unread styling while the user is trying to read them!
    markAllAsReadQuietly()
  }, [])

  return null
}
