import Image from 'next/image'

interface AvatarProps {
  username: string
  avatarUrl: string | null
  size?: number
}

/**
 * Circular avatar with ui-avatars.com fallback.
 * Uses next/image for optimization. Add your Supabase Storage
 * hostname to next.config.ts images.remotePatterns when ready.
 */
export default function Avatar({ username, avatarUrl, size = 32 }: AvatarProps) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=${size * 2}`
  const src = avatarUrl || fallback

  return (
    <Image
      src={src}
      alt={`${username}'s avatar`}
      width={size}
      height={size}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, borderRadius: '9999px' }}
      unoptimized={!avatarUrl} // ui-avatars URLs are external; skip optimization for fallback
    />
  )
}
