import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import FeedCard from '@/components/FeedCard'
import GangupButton from '@/components/GangupButton'
import { initiateChat } from '@/app/actions/chat'
import type { Idea, Profile } from '@/lib/types'

/** Instagram-style compact number formatter */
function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K'
  return String(n)
}
interface PageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  
  // Need to decode URI component just in case
  const decodedUsername = decodeURIComponent(username)
  
  const supabase = await createClient()

  // Fetch the user's profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', decodedUsername)
    .single()

  if (profileError || !profileData) {
    notFound()
  }

  const profile = profileData as Profile

  // Automatically applies session 'auth.uid()' to determine 'has_upvoted'
  const { data: ideasData } = await supabase.rpc('get_ideas_by_username', {
    p_username: decodedUsername
  })
  
  const ideas = (ideasData as Idea[]) || []

  // Function to extract youtube video ID perfectly
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  const youtubeId = profile.youtube_pitch_url ? getYoutubeVideoId(profile.youtube_pitch_url) : null

  // Function to safely extract a clean domain name for display
  const getCleanDomain = (url: string) => {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
      return parsedUrl.hostname.replace(/^www\./, '')
    } catch {
      return url // fallback
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  // Fetch gangup counts from the profile itself (DB counters)
  const gangMembersCount: number = (profile as any).gang_members_count ?? 0
  const gangingCount: number = (profile as any).ganging_count ?? 0

  // Check if current user has ganged this profile
  let isGanged = false
  if (user && !isOwnProfile) {
    const { data: gangRow } = await supabase
      .from('gangups')
      .select('id')
      .eq('ganger_id', user.id)
      .eq('ganged_id', profile.id)
      .maybeSingle()
    isGanged = !!gangRow
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* ─── Profile Header ────────────────────────────────────────────── */}
      <header className="py-8 mb-8 mt-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar 
            username={profile.username} 
            avatarUrl={profile.avatar_url} 
            size={96} 
          />
          
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold break-all" style={{ color: 'var(--foreground)' }}>
                {profile.username}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {!isOwnProfile && (
                  <form action={initiateChat.bind(null, profile.id)}>
                    <button 
                      type="submit"
                      className="text-sm font-medium border px-4 py-1.5 hover:opacity-80 transition-colors w-fit mx-auto sm:mx-0"
                      style={{ borderRadius: '9999px', borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'transparent' }}
                    >
                      Message
                    </button>
                  </form>
                )}
                {!isOwnProfile && (
                  <GangupButton targetUserId={profile.id} initialIsGanged={isGanged} />
                )}
              </div>
            </div>

            {/* Gang stats */}
            <div className="flex items-center gap-5 mb-3">
              <div className="text-center">
                <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{formatCount(gangMembersCount)}</span>
                <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>Gang Members</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{formatCount(gangingCount)}</span>
                <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>Ganging</span>
              </div>
            </div>
            
            <p className="text-sm mb-4 inline-block px-2 py-0.5 rounded" style={{ color: 'var(--muted)', backgroundColor: 'var(--border)', border: '1px solid var(--border)' }}>
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            
            {profile.bio ? (
              <p className="text-base leading-relaxed whitespace-pre-wrap max-w-2xl mb-4" style={{ color: 'var(--foreground)' }}>
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm italic mb-4" style={{ color: 'var(--muted)' }}>No bio provided.</p>
            )}

            {/* Links */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
              {profile.twitter_url && (
                <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline transition-colors decoration-gray-300 underline-offset-4">
                  {getCleanDomain(profile.twitter_url)}
                </a>
              )}
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline transition-colors decoration-gray-300 underline-offset-4">
                  {getCleanDomain(profile.github_url)}
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline transition-colors decoration-gray-300 underline-offset-4">
                  {getCleanDomain(profile.linkedin_url)}
                </a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline transition-colors decoration-gray-300 underline-offset-4">
                  {getCleanDomain(profile.website_url)}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Youtube Embed if provided */}
        {youtubeId && (
          <div className="mt-8 border border-gray-200">
            <div className="aspect-video w-full bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${youtubeId}`} 
                title={`${profile.username}'s Pitch`} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </header>

      {/* ─── Profile Feed ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          Ideas ({ideas.length})
        </h2>
        
        {ideas.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">This user hasn't posted any ideas yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {ideas.map((idea) => (
              <FeedCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
