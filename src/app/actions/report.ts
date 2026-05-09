'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reportAction(targetId: string, targetType: 'idea' | 'problem' | 'comment', reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to report.' }
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_id: targetId,
      target_type: targetType,
      reason: reason
    })

    if (error) {
      console.error('[Supabase] reportAction error:', error)
      return { success: false, error: error.message }
    }

    // Revalidate paths just in case the item was hidden by the trigger
    revalidatePath('/')
    revalidatePath('/?feed=problems')
    revalidatePath(`/ideas/${targetId}`)
    revalidatePath(`/problems/${targetId}`)

    return { success: true }
  } catch (err) {
    console.error('Action error reporting:', err)
    return { success: false, error: 'Failed to submit report.' }
  }
}
