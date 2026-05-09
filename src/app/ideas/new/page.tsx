import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewIdeaForm from '@/components/NewIdeaForm'

export const metadata = {
  title: 'Post an Idea | Founder Ideas',
  description: 'Share a new startup idea with the community.',
}

export default async function NewIdeaPage() {
  // If not logged in, redirect — proxy.ts also guards this route,
  // but this guards the render too.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-1">Post a new idea</h1>
      <p className="text-sm text-gray-500 mb-6">
        Share your startup idea with the community. Be specific about the
        problem and the intended audience.
      </p>
      <NewIdeaForm />
    </div>
  )
}
