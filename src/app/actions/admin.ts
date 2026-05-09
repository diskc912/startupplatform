'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function adminDeletePost(targetId: string, targetType: 'idea' | 'problem' | 'comment') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return { success: false, error: 'Forbidden. Admins only.' }
    }

    let tableName = ''
    if (targetType === 'idea') tableName = 'ideas'
    if (targetType === 'problem') tableName = 'problems'
    if (targetType === 'comment') tableName = 'comments' // Or problem_comments based on the specific type if needed

    if (!tableName) return { success: false, error: 'Invalid target type.' }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from(tableName).delete().eq('id', targetId)

    if (error) {
      console.error('[Supabase] adminDeletePost error:', error)
      return { success: false, error: error.message }
    }

    // Clean up reports for this target
    await adminSupabase.from('reports').delete().eq('target_id', targetId)

    revalidatePath('/adm1n')
    revalidatePath('/')
    revalidatePath('/?feed=problems')

    return { success: true }
  } catch (err) {
    console.error('Action error deleting post as admin:', err)
    return { success: false, error: 'Failed to delete.' }
  }
}

export async function adminRestorePost(targetId: string, targetType: 'idea' | 'problem' | 'comment') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return { success: false, error: 'Forbidden. Admins only.' }
    }

    let tableName = ''
    if (targetType === 'idea') tableName = 'ideas'
    if (targetType === 'problem') tableName = 'problems'
    
    // Comments don't have is_hidden in our current schema, but let's handle ideas and problems
    if (tableName) {
      const adminSupabase = createAdminClient()
      const { error } = await adminSupabase.from(tableName).update({ is_hidden: false }).eq('id', targetId)
      if (error) {
        console.error('[Supabase] adminRestorePost error:', error)
        return { success: false, error: error.message }
      }
      
      // Clean up reports for this target so Auto-Mod doesn't immediately hide it again
      await adminSupabase.from('reports').delete().eq('target_id', targetId)
    }

    revalidatePath('/adm1n')
    revalidatePath('/')
    revalidatePath('/?feed=problems')

    return { success: true }
  } catch (err) {
    console.error('Action error restoring post as admin:', err)
    return { success: false, error: 'Failed to restore.' }
  }
}
