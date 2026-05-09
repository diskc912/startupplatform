import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import UpvoteButton from '@/components/UpvoteButton'
import ReportButton from '@/components/ReportButton'
import AdminDeleteButton from '@/components/AdminDeleteButton'
import CommentThread from '@/components/CommentThread'
import { toggleProblemUpvoteAction, postProblemCommentAction } from '@/app/actions/problems'
import type { Problem, ProblemComment } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProblemPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: problemData, error: problemError } = await supabase
    .from('problems')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .single()

  if (problemError || !problemData) {
    console.error('Error fetching problem:', problemError)
    notFound()
  }

  const problem = problemData as unknown as Problem

  let hasUpvoted = false
  if (user) {
    const { data: upvoteData } = await supabase
      .from('problem_upvotes')
      .select('*')
      .eq('problem_id', id)
      .eq('user_id', user.id)
      .single()
      
    if (upvoteData) {
      hasUpvoted = true
    }
  }

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
  }

  const { data: commentsData } = await supabase
    .from('problem_comments')
    .select('*, profiles(username, avatar_url)')
    .eq('problem_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  const comments = (commentsData as unknown as ProblemComment[]) || []

  const username = problem.profiles?.username || 'unknown'
  const avatarUrl = problem.profiles?.avatar_url || null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link 
        href="/?feed=problems" 
        className="inline-block mb-6 text-sm hover:underline transition-colors back-link"
      >
        ← Back to Problems Feed
      </Link>
      
      <article>
        <div className="flex items-center gap-2 mb-4">
          <Avatar username={username} avatarUrl={avatarUrl} size={32} />
          <Link
            href={`/profile/${username}`}
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--foreground)' }}
          >
            {username}
          </Link>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>·</span>
          <time className="text-sm" style={{ color: 'var(--muted)' }}>
            {formatDistanceToNow(new Date(problem.created_at))}
          </time>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-4" style={{ color: 'var(--foreground)' }}>
          {problem.title}
        </h1>

        <div className="text-base leading-relaxed whitespace-pre-wrap mb-8" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
          {problem.description}
        </div>

        {/* Action Bar */}
        <div className="flex items-center pt-4 mb-4" style={{ borderTop: '1px solid var(--border)' }}>
          <UpvoteButton 
            itemId={problem.id} 
            initialUpvotes={problem.upvote_count} 
            initialHasUpvoted={hasUpvoted} 
            onToggleUpvote={toggleProblemUpvoteAction}
          />
          <div className="ml-auto flex items-center gap-3">
            {isAdmin && (
              <AdminDeleteButton targetId={problem.id} targetType="problem" />
            )}
            <ReportButton targetId={problem.id} targetType="problem" />
          </div>
        </div>
      </article>

      {/* Discussion area */}
      <CommentThread itemId={problem.id} comments={comments} onPostComment={postProblemCommentAction} />
    </div>
  )
}
