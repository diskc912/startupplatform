'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleUpvoteAction(ideaId: string): Promise<{ success: boolean; isUpvoted?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to upvote' }
    }

    const { data: isUpvoted, error } = await supabase.rpc('toggle_upvote', {
      p_idea_id: ideaId
    })

    if (error) {
      console.error('[Supabase] toggleUpvote error:', error)
      return { success: false, error: error.message }
    }
    
    // Insert notification if the upvote was added (not removed)
    if (isUpvoted) {
      // Get the post owner
      const { data: ideaData } = await supabase
        .from('ideas')
        .select('author_id')
        .eq('id', ideaId)
        .single()
        
      if (ideaData && ideaData.author_id !== user.id) {
        const { error: notiError } = await supabase
          .from('notifications')
          .insert({
            receiver_id: ideaData.author_id,
            sender_id: user.id,
            type: 'upvote',
            target_id: ideaId
          })
          
        if (notiError) {
          console.error("[Supabase Error] Failed to insert upvote notification:", notiError)
        }
      }
    }
    
    // Revalidate paths that show upvotes
    revalidatePath('/notifications')
    revalidatePath(`/ideas/${ideaId}`)
    
    return { success: true, isUpvoted: isUpvoted as boolean }
  } catch (err) {
    console.error('Action error toggling upvote:', err)
    return { success: false, error: 'Failed to upvote' }
  }
}

export async function postCommentAction(ideaId: string, content: string, parentId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to comment' }
    }

    if (!content.trim()) {
      return { success: false, error: 'Comment cannot be empty' }
    }

    const { error } = await supabase.from('comments').insert({
      idea_id: ideaId,
      author_id: user.id,
      content: content.trim(),
      parent_id: parentId || null
    })

    if (error) {
      console.error('[Supabase] postComment error:', error)
      return { success: false, error: error.message }
    }

    // Get the post owner for notification
    const { data: ideaData } = await supabase
      .from('ideas')
      .select('author_id')
      .eq('id', ideaId)
      .single()
      
    if (ideaData && ideaData.author_id !== user.id) {
      const { error: notiError } = await supabase
        .from('notifications')
        .insert({
          receiver_id: ideaData.author_id,
          sender_id: user.id,
          type: 'comment',
          target_id: ideaId
        })
        
      if (notiError) {
        console.error("[Supabase Error] Failed to insert comment notification:", notiError)
      }
    }

    revalidatePath('/notifications')
    revalidatePath(`/ideas/${ideaId}`)
    return { success: true }
  } catch (err) {
    console.error('Action error posting comment:', err)
    return { success: false, error: 'Failed to post comment' }
  }
}
