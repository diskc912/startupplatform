import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import MessageBell from '@/components/MessageBell'
import NotificationBell from '@/components/NotificationBell'
import Avatar from '@/components/Avatar'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profileUsername = null
  let profileAvatarUrl = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    profileUsername = profile?.username
    profileAvatarUrl = profile?.avatar_url
  }

  return (
    <header
      className="sticky top-0 z-10 border-b"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <nav className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between gap-4">

        {/* LEFT: Brand + Search */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center hover:no-underline"
          >
            <Image 
              src="/logo.png" 
              alt="Founder Ideas" 
              width={24} 
              height={24} 
              className="rounded-sm"
              priority
            />
          </Link>

          <form action="/search" method="GET" className="hidden lg:block">
            <input
              type="text"
              name="q"
              placeholder="Search founders..."
              className="text-sm border px-4 py-1.5 w-64 focus:outline-none transition-colors placeholder:text-xs"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                borderRadius: '9999px',
              }}
            />
          </form>
        </div>

        {/* RIGHT: Nav links */}
        <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:underline whitespace-nowrap" style={{ color: 'var(--muted)' }}>
            Feed
          </Link>

          {user ? (
            <>

              <Link
                href="/settings"
                className="hover:underline whitespace-nowrap hidden sm:inline"
                style={{ color: 'var(--muted)' }}
              >
                Settings
              </Link>
              <Link
                href="/ideas/new"
                className="hover:underline whitespace-nowrap border transition-colors px-2 py-0.5"
                style={{ color: 'var(--muted)', borderColor: 'var(--border)', borderRadius: '9999px' }}
              >
                + Post
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:underline whitespace-nowrap"
                style={{ color: 'var(--muted)' }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-0.5 text-xs font-medium border transition-colors hover:opacity-80 whitespace-nowrap"
                style={{ borderColor: 'var(--foreground)', color: 'var(--foreground)', borderRadius: '9999px' }}
              >
                Sign up
              </Link>
            </>
          )}

          <div className="flex items-center gap-3">
            <NotificationBell />
            <MessageBell />
            {profileUsername && (
              <Link
                href="/profile"
                className="hover:opacity-80 transition-opacity ml-1"
              >
                <Avatar username={profileUsername} avatarUrl={profileAvatarUrl} size={32} />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
