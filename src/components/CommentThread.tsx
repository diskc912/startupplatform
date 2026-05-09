'use client'

import { useState, useTransition } from 'react'
import CommentItem from './CommentItem'

interface CommentThreadProps {
  itemId: string
  comments: any[]
  onPostComment: (itemId: string, content: string, parentId?: string) => Promise<{ success: boolean; error?: string }>
}

export default function CommentThread({ itemId, comments, onPostComment }: CommentThreadProps) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await onPostComment(itemId, content)
      if (result.success) {
        setContent('')
      } else {
        alert(result.error || 'Failed to post comment')
      }
    })
  }

  // Find root comments (comments without a parent_id)
  const rootComments = comments.filter(c => !c.parent_id)

  return (
    <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-black mb-4 dark:text-white">Comments ({comments.length})</h3>
      
      <form onSubmit={handlePost} className="mb-8">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          placeholder="Leave a comment..."
          className="w-full text-sm border border-gray-300 p-3 focus:outline-none focus:border-black min-h-[80px] resize-y dark:bg-black dark:border-gray-700 dark:text-white dark:focus:border-white"
          required
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="bg-black text-white text-sm px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {rootComments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet. Be the first to start the discussion!</p>
        ) : (
          rootComments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              itemId={itemId}
              replies={comments.filter(c => c.parent_id === comment.id)}
              allComments={comments}
              onPostComment={onPostComment}
            />
          ))
        )}
      </div>
    </div>
  )
}
