'use client'

import { useTransition } from 'react'
import { deleteMyPost } from '@/app/actions/userPosts'

export default function UserDeleteButton({ targetId, targetType }: { targetId: string, targetType: 'idea' | 'problem' }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      startTransition(async () => {
        const res = await deleteMyPost(targetId, targetType)
        if (!res.success) {
          alert(res.error || 'Failed to delete post.')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs hover:underline flex items-center gap-1 transition-opacity disabled:opacity-50 font-medium"
      style={{ color: 'var(--error)' }}
      title="Delete my post"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
