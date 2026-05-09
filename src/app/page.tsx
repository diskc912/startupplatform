import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FeedCard from '@/components/FeedCard'
import ProblemCard from '@/components/ProblemCard'
import type { Idea, Problem } from '@/lib/types'

export const metadata = {
  title: 'Home | founder ideas.',
  description: 'Discover startup problems to solve and ideas shared by founders.',
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string }>
}) {
  const { feed, tab } = await searchParams
  const isProblems = feed === 'problems'
  const isGangTab = tab === 'gang'

  let items: any[] = []
  let isLoggedIn = false
  let hasGangedAnyone = false
  let isAdmin = false

  // Fetch user-specific gangup data for the feed cards (bulk fetch to avoid N+1)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id
  const gangedUserIds = new Set<string>()

  if (currentUserId) {
    const { data: gangups } = await supabase
      .from('gangups')
      .select('ganged_id')
      .eq('ganger_id', currentUserId)
    
    gangups?.forEach(g => gangedUserIds.add(g.ganged_id))

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUserId)
      .single()
    
    isAdmin = profile?.is_admin || false
  }

  if (isGangTab) {
    // My Gang tab — always dynamic, user-specific, pure chronological order
    isLoggedIn = !!user

    if (user) {
      hasGangedAnyone = gangedUserIds.size > 0

      if (hasGangedAnyone) {
        if (isProblems) {
          const { data } = await supabase.rpc('get_ganged_problems')
          items = ((data as Problem[] | null) ?? []).slice(0, 50)
        } else {
          const { data } = await supabase.rpc('get_ganged_ideas')
          items = ((data as Idea[] | null) ?? []).slice(0, 50)
        }
      }
    }
  } else {
    // Trending tab — Redis-backed cache, ultra-fast, globally shared
    const { unstable_cache } = await import('next/cache')
    const { getTrendingProblemsCached, getTrendingIdeasCached } = await import('@/lib/cache')

    if (isProblems) {
      const fetchProblems = unstable_cache(
        async () => getTrendingProblemsCached(),
        ['trending-problems'],
        { revalidate: 30 }
      )
      items = await fetchProblems()
    } else {
      const fetchIdeas = unstable_cache(
        async () => getTrendingIdeasCached(),
        ['trending-ideas'],
        { revalidate: 30 }
      )
      items = await fetchIdeas()
    }
  }

  // Tab helpers
  const trendingHref = isProblems ? '/?feed=problems' : '/'
  const gangHref = isProblems ? '/?feed=problems&tab=gang' : '/?tab=gang'

  return (
    <div>
      {/* ── Top Row: Trending/My Gang tabs + Post button ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 gap-4 sm:gap-0 mt-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Gang/Trending selector */}
        <div
          className="flex items-center gap-1 p-1 w-fit"
          style={{ backgroundColor: 'var(--border)', borderRadius: '9999px' }}
        >
          <Link
            href={trendingHref}
            className="px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: !isGangTab ? 'var(--background)' : 'transparent',
              color: !isGangTab ? 'var(--foreground)' : 'var(--muted)',
              borderRadius: '9999px',
            }}
          >
            Trending
          </Link>
          <Link
            href={gangHref}
            className="px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isGangTab ? 'var(--background)' : 'transparent',
              color: isGangTab ? 'var(--foreground)' : 'var(--muted)',
              borderRadius: '9999px',
            }}
          >
            My Gang
          </Link>
        </div>

        {/* Ideas/Problems sub-switcher + Post button */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1 p-1"
            style={{ backgroundColor: 'var(--border)', borderRadius: '9999px' }}
          >
            <Link
              href={isGangTab ? '/?tab=gang' : '/'}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: !isProblems ? 'var(--background)' : 'transparent',
                color: !isProblems ? 'var(--foreground)' : 'var(--muted)',
                borderRadius: '9999px',
              }}
            >
              Ideas
            </Link>
            <Link
              href={isGangTab ? '/?feed=problems&tab=gang' : '/?feed=problems'}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: isProblems ? 'var(--background)' : 'transparent',
                color: isProblems ? 'var(--foreground)' : 'var(--muted)',
                borderRadius: '9999px',
              }}
            >
              Problems
            </Link>
          </div>

          <Link
            href={isProblems ? '/problems/new' : '/ideas/new'}
            className="text-sm px-4 py-1.5 font-medium transition-colors text-center hover:opacity-80 shadow-sm"
            style={{
              border: '1px solid var(--foreground)',
              color: 'var(--background)',
              backgroundColor: 'var(--foreground)',
              borderRadius: '9999px',
            }}
          >
            {isProblems ? '+ Post Problem' : '+ Post Idea'}
          </Link>
        </div>
      </div>

      {/* ── Feed content ── */}
      {isGangTab && !isLoggedIn ? (
        /* Not logged in state */
        <div className="py-20 text-center">
          <p className="text-2xl mb-2">🤝</p>
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Sign in to see your gang's feed
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Gangup with other founders to see their posts here.
          </p>
          <Link
            href="/login"
            className="text-sm font-medium px-5 py-2 transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)', borderRadius: '9999px' }}
          >
            Sign in
          </Link>
        </div>
      ) : isGangTab && isLoggedIn && !hasGangedAnyone ? (
        /* Logged in but no gangups */
        <div className="py-20 text-center">
          <p className="text-2xl mb-2">👀</p>
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Your gang is empty
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Explore the Trending feed and gang up with founders you find interesting.
          </p>
          <Link
            href="/"
            className="text-sm font-medium px-5 py-2 transition-colors hover:opacity-80"
            style={{ border: '1px solid var(--foreground)', color: 'var(--foreground)', backgroundColor: 'transparent', borderRadius: '9999px' }}
          >
            Explore Trending →
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No {isProblems ? 'problems' : 'ideas'} yet.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Be the first to{' '}
            <Link href={isProblems ? '/problems/new' : '/ideas/new'} className="underline" style={{ color: 'var(--foreground)' }}>
              share one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div>
          {items.map((item, index) =>
            isProblems
              ? <ProblemCard key={item.id} problem={item as Problem} currentUserId={currentUserId} gangedUserIds={gangedUserIds} isAdmin={isAdmin} />
              : <FeedCard key={item.id} idea={item as Idea} currentUserId={currentUserId} gangedUserIds={gangedUserIds} priority={index === 0} isAdmin={isAdmin} />
          )}
        </div>
      )}
    </div>
  )
}

