'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { fetchFeedBatchAction } from '@/app/actions/feed'
import FeedCard from '@/components/FeedCard'
import ProblemCard from '@/components/ProblemCard'
import type { Idea, Problem } from '@/lib/types'

interface InfiniteFeedProps {
  feedType: 'ideas' | 'problems'
  tabType: 'trending' | 'gang'
  initialItems: any[]
  currentUserId?: string
  gangedUserIdsArray: string[]
  isAdmin: boolean
}

export default function InfiniteFeed({
  feedType,
  tabType,
  initialItems,
  currentUserId,
  gangedUserIdsArray,
  isAdmin,
}: InfiniteFeedProps) {
  const [items, setItems] = useState<any[]>(initialItems)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialItems.length === 50)
  const [isFetching, setIsFetching] = useState(false)

  // Reconstruct the Set for the cards
  const gangedUserIds = useMemo(() => new Set(gangedUserIdsArray), [gangedUserIdsArray])

  const { ref, inView } = useInView({
    rootMargin: '800px', // Trigger when 800px from the bottom
  })

  const loadMoreItems = useCallback(async () => {
    if (isFetching || !hasMore) return

    setIsFetching(true)
    try {
      const newItems = await fetchFeedBatchAction(feedType, tabType, page)
      
      if (newItems.length > 0) {
        setItems(prev => {
          // Prevent duplicates just in case
          const existingIds = new Set(prev.map((i: any) => i.id))
          const filteredNew = newItems.filter((i: any) => !existingIds.has(i.id))
          return [...prev, ...filteredNew]
        })
        setPage(prev => prev + 1)
      }
      
      // If we received fewer than 50 items, we've hit the end
      if (newItems.length < 50) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to fetch more items:', error)
      setHasMore(false)
    } finally {
      setIsFetching(false)
    }
  }, [isFetching, hasMore, feedType, tabType, page])

  useEffect(() => {
    if (inView) {
      loadMoreItems()
    }
  }, [inView, loadMoreItems])

  // Reset state if initialItems change (e.g. changing tabs or feeds)
  useEffect(() => {
    setItems(initialItems)
    setPage(1)
    setHasMore(initialItems.length >= 50)
    setIsFetching(false)
  }, [initialItems])

  return (
    <div>
      <div>
        {items.map((item, index) =>
          feedType === 'problems' ? (
            <ProblemCard 
              key={item.id} 
              problem={item as Problem} 
              currentUserId={currentUserId} 
              gangedUserIds={gangedUserIds} 
              isAdmin={isAdmin} 
            />
          ) : (
            <FeedCard 
              key={item.id} 
              idea={item as Idea} 
              currentUserId={currentUserId} 
              gangedUserIds={gangedUserIds} 
              priority={index === 0} 
              isAdmin={isAdmin} 
            />
          )
        )}
      </div>

      {hasMore && (
        <div ref={ref} className="h-10 flex items-center justify-center mt-4">
          {isFetching && (
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              Loading more...
            </span>
          )}
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
          You've reached the end of the feed.
        </div>
      )}
    </div>
  )
}
