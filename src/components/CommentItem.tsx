'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import Avatar from './Avatar'
import ReportButton from './ReportButton'

interface CommentItemProps {
  comment: any
  itemId: string
  replies: any[]
  allComments: any[]
  depth?: number
  onPostComment: (itemId: string, content: string, parentId?: string) => Promise<{ success: boolean; error?: string }>
}

export default function CommentItem({ comment, itemId, replies, allComments, depth = 0, onPostComment }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isPending, startTransition] = useTransition()
  
  const username = comment.profiles?.username || 'unknown'
  const avatarUrl = comment.profiles?.avatar_url || null

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    startTransition(async () => {
      const result = await onPostComment(itemId, replyContent, comment.id)
      if (result.success) {
        setReplyContent('')
        setIsReplying(false)
      } else {
        alert(result.error || 'Failed to post reply')
      }
    })
  }

  return (
    <div className={`mt-4 ${depth > 0 ? 'ml-4 sm:ml-8 border-l border-gray-100 dark:border-gray-800 pl-4' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Link href={`/profile/${username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar username={username} avatarUrl={avatarUrl} size={18} />
          <span className="text-xs font-semibold text-gray-800 hover:underline dark:text-white">{username}</span>
        </Link>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.created_at))}</span>
      </div>
      
      <div className="text-sm text-gray-700 whitespace-pre-wrap ml-6 dark:text-gray-300">
        {comment.content}
      </div>
      
      <div className="ml-6 mt-1 mb-2 flex items-center gap-3">
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className="text-xs font-medium text-gray-500 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white"
        >
          {isReplying ? 'Cancel' : 'Reply'}
        </button>
        <ReportButton targetId={comment.id} targetType="comment" />
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className="ml-6 mb-4 mt-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            disabled={isPending}
            placeholder="Write a reply..."
            className="w-full text-sm border border-gray-300 p-2 focus:outline-none focus:border-black min-h-[60px] resize-y dark:bg-black dark:border-gray-700 dark:text-white dark:focus:border-white"
            required
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending || !replyContent.trim()}
              className="bg-black text-white text-xs px-3 py-1.5 font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isPending ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      )}

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="mt-2">
          {replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              itemId={itemId}
              replies={allComments.filter(c => c.parent_id === reply.id)}
              allComments={allComments}
              depth={depth + 1}
              onPostComment={onPostComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}
