import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from '@/lib/utils'
import Avatar from './Avatar'
import UpvoteButton from './UpvoteButton'
import ReportButton from './ReportButton'
import GangupButton from './GangupButton'
import AdminDeleteButton from './AdminDeleteButton'
import { toggleUpvoteAction } from '@/app/actions/engagement'
import type { Idea } from '@/lib/types'

interface FeedCardProps {
  idea: Idea
  /** ID of the currently logged-in user (undefined if not logged in) */
  currentUserId?: string
  /** Set of user IDs the current user has already ganged */
  gangedUserIds?: Set<string>
  priority?: boolean
  isAdmin?: boolean
}

export default function FeedCard({ idea, currentUserId, gangedUserIds, priority = false, isAdmin = false }: FeedCardProps) {
  const username = (idea as any).author_username ?? 'unknown'
  const avatarUrl = (idea as any).author_avatar_url ?? null
  const authorId = idea.author_id
  // Show gangup only if there's a logged-in user and it's not their own post
  const showGangup = currentUserId && currentUserId !== authorId

  return (
    <article className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar username={username} avatarUrl={avatarUrl} size={24} />
        <Link
          href={`/profile/${username}`}
          className="text-xs font-medium hover:underline"
          style={{ color: 'var(--muted)' }}
        >
          {username}
        </Link>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>·</span>
        <time className="text-xs" style={{ color: 'var(--muted)' }}>
          {formatDistanceToNow(new Date(idea.created_at))}
        </time>
      </div>

      {/* Title */}
      <Link href={`/ideas/${idea.id}`} className="group">
        <h2 className="text-base font-semibold group-hover:underline leading-snug mb-1" style={{ color: 'var(--foreground)' }}>
          {idea.title}
        </h2>
      </Link>

      {/* Description preview (truncated) */}
      <p className="text-sm leading-relaxed line-clamp-3 mb-3" style={{ color: 'var(--muted)' }}>
        {idea.description}
      </p>

      {/* Attached image */}
      {idea.image_url && (
        <div className="mb-3" style={{ border: '1px solid var(--border)' }}>
          <Image
            src={idea.image_url}
            alt={`Image for ${idea.title}`}
            width={720}
            height={400}
            className="w-full object-cover max-h-64"
            priority={priority}
          />
        </div>
      )}

      {/* Footer: upvotes + comment link + gangup */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
        <UpvoteButton 
          itemId={idea.id} 
          initialUpvotes={idea.upvote_count} 
          initialHasUpvoted={!!idea.has_upvoted} 
          onToggleUpvote={toggleUpvoteAction}
        />
        <Link
          href={`/ideas/${idea.id}`}
          className="hover:underline"
          style={{ color: 'var(--muted)' }}
        >
          Discuss →
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {showGangup && (
            <GangupButton
              targetUserId={authorId}
              initialIsGanged={gangedUserIds?.has(authorId) ?? false}
            />
          )}
          {isAdmin && (
            <AdminDeleteButton targetId={idea.id} targetType="idea" />
          )}
          <ReportButton targetId={idea.id} targetType="idea" />
        </div>
      </div>
    </article>
  )
}

