import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Avatar from '@/components/Avatar'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() || ''

  const supabase = await createClient()

  let profiles: any[] = []

  if (query) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${query}%`)
      .order('username')
      .limit(20)

    profiles = data || []
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        Search Founders
      </h1>

      {/* Google-style rounded search bar */}
      <form action="/search" method="GET" className="mb-8">
        <div
          className="flex items-center gap-2 px-4 py-2 transition-shadow"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            backgroundColor: 'var(--background)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          }}
        >
          {/* Search icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search founders by username..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            className="text-sm font-medium px-4 py-1 transition-colors"
            style={{
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
              borderRadius: '9999px',
            }}
          >
            Search
          </button>
        </div>
      </form>

      {query ? (
        <div className="space-y-4">
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Found {profiles.length} result{profiles.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>

          {profiles.length > 0 ? (
            <div className="flex flex-col gap-3">
              {profiles.map(profile => (
                <Link
                  href={`/profile/${profile.username}`}
                  key={profile.id}
                  className="block p-4 transition-all group"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--background)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={48} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold group-hover:underline truncate" style={{ color: 'var(--foreground)' }}>
                        {profile.username}
                      </h2>
                      {profile.bio && (
                        <p className="text-sm truncate mt-1" style={{ color: 'var(--muted)' }}>
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" style={{ border: '1px dashed var(--border)', borderRadius: '12px' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No founders found matching &quot;{query}&quot;.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12" style={{ border: '1px dashed var(--border)', borderRadius: '12px' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Enter a username to search for founders.</p>
        </div>
      )}
    </div>
  )
}
