'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NotificationBellClient({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname()
  
  // Hide the dot if we are currently looking at the notifications page!
  // This satisfies the "once the bell is clicked, the dot should be gone" requirement
  // without needing a hard refresh or losing the unread card highlighting.
  const showDot = unreadCount > 0 && pathname !== '/notifications'

  return (
    <Link
      href="/notifications"
      className="relative flex items-center"
      title="Notifications"
      aria-label="Notifications"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 transition-colors hover:text-black dark:hover:text-white"
        style={{ color: 'var(--muted)' }}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {showDot && (
        <span
          className="absolute bg-red-500"
          style={{
            top: '-2px',
            right: '-1px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            border: '1px solid var(--background)' // tiny outline to make it pop
          }}
        />
      )}
    </Link>
  )
}
