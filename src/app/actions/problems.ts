'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function toggleProblemUpvoteAction(problemId: string): Promise<{ success: boolean; isUpvoted?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to upvote' }
    }

    const { data: isUpvoted, error } = await supabase.rpc('toggle_problem_upvote', {
      p_problem_id: problemId
    })

    if (error) {
      console.error('[Supabase] toggleProblemUpvote error:', error)
      return { success: false, error: error.message }
    }
    
    // Revalidate paths that show problem upvotes
    revalidatePath(`/problems/${problemId}`)
    
    return { success: true, isUpvoted: isUpvoted as boolean }
  } catch (err) {
    console.error('Action error toggling problem upvote:', err)
    return { success: false, error: 'Failed to upvote' }
  }
}

export async function postProblemCommentAction(problemId: string, content: string, parentId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to comment' }
    }

    if (!content.trim()) {
      return { success: false, error: 'Comment cannot be empty' }
    }

    const { error } = await supabase.from('problem_comments').insert({
      problem_id: problemId,
      author_id: user.id,
      content: content.trim(),
      parent_id: parentId || null
    })

    if (error) {
      console.error('[Supabase] postProblemComment error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/problems/${problemId}`)
    return { success: true }
  } catch (err) {
    console.error('Action error posting problem comment:', err)
    return { success: false, error: 'Failed to post comment' }
  }
}

type ProblemFormState = {
  error?: string
  success?: boolean
} | undefined

export async function createProblem(
  _prevState: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to post a problem.' }
  }

  const { ratelimit } = await import('@/lib/ratelimit')
  
  // Rate limiting (Fail open if Redis is unconfigured or offline)
  let success = true
  try {
    const result = await ratelimit.limit(`ratelimit_problem_${user.id}`)
    success = result.success
  } catch (e) {
    console.error('Rate limit error:', e)
  }

  if (!success) {
    return { error: 'You are posting too fast. Please wait a minute before posting again.' }
  }

  const title = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim()

  if (!title || title.length < 5) {
    return { error: 'Title must be at least 5 characters.' }
  }
  if (!description || description.length < 20) {
    return { error: 'Description must be at least 20 characters.' }
  }

  const { error } = await supabase.from('problems').insert({
    author_id: user.id,
    title,
    description,
    upvote_count: 0,
  })

  if (error) {
    console.error('[Supabase] createProblem error:', error)
    return { error: error.message }
  }

  revalidatePath('/?feed=problems')
  redirect('/?feed=problems')
}
