import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditProfileForm from '@/components/EditProfileForm'
import type { Profile } from '@/lib/types'

export const metadata = {
  title: 'Settings | Founder Ideas',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  // Ensure user is signed in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch their profile
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profileData) {
    console.error('Error fetching profile:', error)
    return <div className="p-8 text-center text-sm">Failed to load profile.</div>
  }

  return (
    <div className="pt-2 pb-12">
      <EditProfileForm profile={profileData as Profile} />
    </div>
  )
}
