import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedCard from '@/components/FeedCard'
import ProblemCard from '@/components/ProblemCard'
import UserDeleteButton from '@/components/UserDeleteButton'
import type { Idea, Problem } from '@/lib/types'

export const metadata = {
  title: 'My Dashboard | founder ideas.',
}

export default async function PersonalProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to get username and youtube url
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, youtube_pitch_url')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch ideas using the existing RPC
  const { data: ideasData } = await supabase.rpc('get_ideas_by_username', {
    p_username: profile.username
  })
  
  const ideas = (ideasData as Idea[]) || []

  // Fetch problems authored by user
  const { data: problemsData } = await supabase
    .from('problems')
    .select('*, author:profiles(*)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  // Map problems to match Problem type (mock has_upvoted for own dashboard)
  const problems = (problemsData || []).map((p: any) => ({
    ...p,
    has_upvoted: false
  })) as Problem[]

  // Function to extract youtube video ID perfectly
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  const youtubeId = profile.youtube_pitch_url ? getYoutubeVideoId(profile.youtube_pitch_url) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>My Dashboard</h1>
      </div>

      {youtubeId && (
        <div className="mb-12 border rounded-md overflow-hidden" style={{ borderColor: 'var(--border)' }}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Ideas Column */}
        <section>
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            My Ideas ({ideas.length})
          </h2>
          {ideas.length === 0 ? (
            <div className="py-8 text-center border border-dashed rounded-md" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You haven't posted any ideas yet.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {ideas.map((idea) => (
                <div key={idea.id} className="relative">
                  <div className="absolute top-4 right-0 z-10">
                    <UserDeleteButton targetId={idea.id} targetType="idea" />
                  </div>
                  <FeedCard idea={idea} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Problems Column */}
        <section>
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            My Problems ({problems.length})
          </h2>
          {problems.length === 0 ? (
            <div className="py-8 text-center border border-dashed rounded-md" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You haven't posted any problems yet.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {problems.map((problem) => (
                <div key={problem.id} className="relative">
                  <div className="absolute top-4 right-0 z-10">
                    <UserDeleteButton targetId={problem.id} targetType="problem" />
                  </div>
                  <ProblemCard problem={problem} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
