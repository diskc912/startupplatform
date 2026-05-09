'use client'

import { useTransition } from 'react'
import { adminDeletePost } from '@/app/actions/admin'

export default function AdminDeleteButton({ targetId, targetType }: { targetId: string, targetType: 'idea' | 'problem' | 'comment' }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Admin: Are you sure you want to permanently delete this?')) {
      startTransition(async () => {
        const res = await adminDeletePost(targetId, targetType)
        if (!res.success) {
          alert(res.error || 'Failed to delete. Check Supabase RLS policies.')
        } else {
          alert('Post deleted successfully.')
        }
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs hover:underline flex items-center gap-1 transition-opacity disabled:opacity-50"
      style={{ color: 'var(--error)' }}
      title="Admin Delete"
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
