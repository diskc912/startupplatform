'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteMyPost(postId: string, postType: 'idea' | 'problem') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const tableName = postType === 'idea' ? 'ideas' : 'problems'

    // Fetch post to verify authorship
    const { data: post, error: fetchError } = await supabase
      .from(tableName)
      .select('author_id')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return { success: false, error: 'Post not found.' }
    }

    if (post.author_id !== user.id) {
      return { success: false, error: 'Forbidden. You are not the author.' }
    }

    // Clean up associated reports to avoid orphaned data
    await supabase.from('reports').delete().eq('target_id', postId)

    // Delete the post
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', postId)

    if (deleteError) {
      console.error('[Supabase] deleteMyPost error:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // Revalidate relevant paths
    revalidatePath('/profile')
    revalidatePath('/')
    revalidatePath('/?feed=problems')

    return { success: true }
  } catch (err: any) {
    console.error('Action error deleting user post:', err)
    return { success: false, error: err.message || 'Failed to delete post.' }
  }
}
