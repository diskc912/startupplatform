'use client'

import { useState, useTransition } from 'react'
import { reportAction } from '@/app/actions/report'

interface ReportButtonProps {
  targetId: string
  targetType: 'idea' | 'problem' | 'comment'
}

export default function ReportButton({ targetId, targetType }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [reported, setReported] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    startTransition(async () => {
      const res = await reportAction(targetId, targetType, reason)
      if (res.success) {
        setReported(true)
        setIsOpen(false)
      } else {
        alert(res.error || 'Failed to submit report.')
      }
    })
  }

  if (reported) {
    return <span className="text-xs text-green-600">Reported</span>
  }

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs hover:underline"
        style={{ color: 'var(--muted)' }}
      >
        Report
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 p-3 rounded-md shadow-lg border z-10"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Reason for reporting:</label>
            <textarea 
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="text-xs p-2 border rounded-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              rows={3}
              placeholder="Spam, inappropriate content..."
            />
            <div className="flex justify-end gap-2 mt-1">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs"
                style={{ color: 'var(--muted)' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isPending}
                className="text-xs px-2 py-1 rounded-sm"
                style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
              >
                {isPending ? '...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
