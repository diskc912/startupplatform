import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import Avatar from './Avatar'
import UpvoteButton from './UpvoteButton'
import ReportButton from './ReportButton'
import GangupButton from './GangupButton'
import AdminDeleteButton from './AdminDeleteButton'
import { toggleProblemUpvoteAction } from '@/app/actions/problems'
import type { Problem } from '@/lib/types'

interface ProblemCardProps {
  problem: Problem
  currentUserId?: string
  gangedUserIds?: Set<string>
  isAdmin?: boolean
}

export default function ProblemCard({ problem, currentUserId, gangedUserIds, isAdmin = false }: ProblemCardProps) {
  const username = problem.author_username ?? 'unknown'
  const avatarUrl = problem.author_avatar_url ?? null
  const authorId = problem.author_id
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
          {formatDistanceToNow(new Date(problem.created_at))}
        </time>
      </div>

      {/* Title */}
      <Link href={`/problems/${problem.id}`} className="group">
        <h2 className="text-base font-semibold group-hover:underline leading-snug mb-1" style={{ color: 'var(--foreground)' }}>
          {problem.title}
        </h2>
      </Link>

      {/* Description preview (truncated) */}
      <p className="text-sm leading-relaxed line-clamp-3 mb-3 whitespace-pre-wrap" style={{ color: 'var(--muted)' }}>
        {problem.description}
      </p>

      {/* Footer: upvotes + comment link + gangup */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
        <UpvoteButton 
          itemId={problem.id} 
          initialUpvotes={problem.upvote_count} 
          initialHasUpvoted={!!problem.has_upvoted} 
          onToggleUpvote={toggleProblemUpvoteAction}
        />
        <Link
          href={`/problems/${problem.id}`}
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
            <AdminDeleteButton targetId={problem.id} targetType="problem" />
          )}
          <ReportButton targetId={problem.id} targetType="problem" />
        </div>
      </div>
    </article>
  )
}

