'use client'

import { useTransition, useState } from 'react'

interface UpvoteButtonProps {
  itemId: string
  initialUpvotes: number
  initialHasUpvoted: boolean
  onToggleUpvote: (id: string) => Promise<{ success: boolean; isUpvoted?: boolean; error?: string }>
}

export default function UpvoteButton({
  itemId,
  initialUpvotes,
  initialHasUpvoted,
  onToggleUpvote
}: UpvoteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted)

  const handleUpvote = () => {
    const newHasUpvoted = !hasUpvoted
    const newUpvotes = newHasUpvoted ? upvotes + 1 : upvotes - 1

    setHasUpvoted(newHasUpvoted)
    setUpvotes(newUpvotes)

    startTransition(async () => {
      const result = await onToggleUpvote(itemId)
      if (!result.success) {
        setHasUpvoted(!newHasUpvoted)
        setUpvotes(!newHasUpvoted ? newUpvotes + 1 : newUpvotes - 1)
        alert(result.error || 'Failed to toggle upvote. Please sign in.')
      } else if (result.isUpvoted !== undefined && result.isUpvoted !== newHasUpvoted) {
        setHasUpvoted(result.isUpvoted)
        const correctedUpvotes = result.isUpvoted ? upvotes + 1 : upvotes - 1
        setUpvotes(correctedUpvotes)
      }
    })
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 active:scale-90 shadow-sm border ${
        hasUpvoted
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-transparent text-[var(--muted)] border-[var(--border)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
      }`}
      style={{
        opacity: isPending ? 0.7 : 1,
      }}
      aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote idea'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-4 h-4 transition-transform duration-200 ${hasUpvoted ? 'fill-current translate-y-[-1px]' : 'group-hover:translate-y-[-2px]'}`}
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
      <span>{upvotes}</span>
    </button>
  )
}

