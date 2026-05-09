'use client'

import { useTransition } from 'react'
import { adminDeletePost, adminRestorePost } from '@/app/actions/admin'

export default function AdminActions({ targetId, targetType }: { targetId: string, targetType: 'idea' | 'problem' }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Are you sure you want to permanently delete this post?')) {
      startTransition(async () => {
        const res = await adminDeletePost(targetId, targetType)
        if (!res.success) {
          alert(res.error)
        }
      })
    }
  }

  const handleRestore = () => {
    if (confirm('Are you sure you want to restore this post? It will become visible again and its reports will be cleared.')) {
      startTransition(async () => {
        const res = await adminRestorePost(targetId, targetType)
        if (!res.success) {
          alert(res.error)
        }
      })
    }
  }

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleRestore}
        disabled={isPending}
        className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Processing...' : 'Restore Post'}
      </button>
      <button 
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Deleting...' : 'Delete Permanently'}
      </button>
    </div>
  )
}
