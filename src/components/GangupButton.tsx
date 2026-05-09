'use client'

import { useState, useTransition } from 'react'
import { toggleGangup } from '@/app/actions/gangup'

interface GangupButtonProps {
  targetUserId: string
  initialIsGanged: boolean
}

export default function GangupButton({ targetUserId, initialIsGanged }: GangupButtonProps) {
  const [isGanged, setIsGanged] = useState(initialIsGanged)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    const prevState = isGanged
    setIsGanged(!isGanged) // optimistic update

    startTransition(async () => {
      const res = await toggleGangup(targetUserId)
      if (!res.success) {
        setIsGanged(prevState) // rollback on failure
        alert(res.error)
      } else {
        setIsGanged(res.isGanged)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium px-5 py-1.5 transition-all duration-200 disabled:opacity-60"
      style={{
        borderRadius: '9999px',
        border: isGanged ? '1.5px solid var(--border)' : '1.5px solid var(--foreground)',
        backgroundColor: isGanged ? 'transparent' : 'var(--foreground)',
        color: isGanged ? 'var(--muted)' : 'var(--background)',
      }}
    >
      {isGanged ? 'Ungang' : 'Gangup'}
    </button>
  )
}
