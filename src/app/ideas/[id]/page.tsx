import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from '@/lib/utils'
import Avatar from '@/components/Avatar'
import UpvoteButton from '@/components/UpvoteButton'
import ReportButton from '@/components/ReportButton'
import AdminDeleteButton from '@/components/AdminDeleteButton'
import CommentThread from '@/components/CommentThread'
import { toggleUpvoteAction, postCommentAction } from '@/app/actions/engagement'
import type { Idea, Comment } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IdeaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verify auth for accurate upvote status
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch idea details
  const { data: ideaData, error: ideaError } = await supabase
    .from('ideas')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .single()

  if (ideaError || !ideaData) {
    console.error('Error fetching idea:', ideaError)
    notFound()
  }

  const idea = ideaData as unknown as Idea

  // Fetch if current user has upvoted this idea
  let hasUpvoted = false
  if (user) {
    const { data: upvoteData } = await supabase
      .from('upvotes')
      .select('*')
      .eq('idea_id', id)
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

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('idea_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  const comments = (commentsData as unknown as Comment[]) || []

  // Ensure flat fields available if passed to components expecting them
  const username = idea.profiles?.username || 'unknown'
  const avatarUrl = idea.profiles?.avatar_url || null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link 
        href="/" 
        className="inline-block mb-6 text-sm hover:underline transition-colors back-link"
      >
        ← Back to Feed
      </Link>
      
      <article>
        {/* Author row */}
        <div className="flex items-center gap-2 mb-4 px-4 sm:px-0">
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
            {formatDistanceToNow(new Date(idea.created_at))}
          </time>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-4 px-4 sm:px-0" style={{ color: 'var(--foreground)' }}>
          {idea.title}
        </h1>

        {/* Image (if exists) */}
        {idea.image_url && (
          <div className="mb-6 border" style={{ borderColor: 'var(--border)' }}>
            <Image
              src={idea.image_url}
              alt={`Image for ${idea.title}`}
              width={1200}
              height={675}
              className="w-full object-cover max-h-[500px]"
              unoptimized
            />
          </div>
        )}

        {/* Description */}
        <div className="text-base leading-relaxed whitespace-pre-wrap mb-8 px-4 sm:px-0" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
          {idea.description}
        </div>

        {/* Action Bar */}
        <div className="flex items-center pt-4 mb-4 mx-4 sm:mx-0" style={{ borderTop: '1px solid var(--border)' }}>
          <UpvoteButton 
            itemId={idea.id} 
            initialUpvotes={idea.upvote_count} 
            initialHasUpvoted={hasUpvoted} 
            onToggleUpvote={toggleUpvoteAction}
          />
          <div className="ml-auto flex items-center gap-3">
            {isAdmin && (
              <AdminDeleteButton targetId={idea.id} targetType="idea" />
            )}
            <ReportButton targetId={idea.id} targetType="idea" />
          </div>
        </div>
      </article>

      {/* Discussion area */}
      <CommentThread itemId={idea.id} comments={comments} onPostComment={postCommentAction} />
    </div>
  )
}
