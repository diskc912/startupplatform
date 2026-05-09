'use server'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { revalidatePath } from 'next/cache'
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAvatarPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ url: string; key: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to upload an avatar.' }
  }

  if (contentType !== 'image/webp') {
    return { error: 'Only .webp images are accepted.' }
  }

  // Scope to avatars/ and use user ID to ensure uniqueness and security
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `avatars/${user.id}/${Date.now()}_${safeFilename}`

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn: 60 })
    return { url, key }
  } catch (err) {
    console.error('[R2] Failed to generate avatar presigned URL:', err)
    return { error: 'Failed to generate upload URL. Please try again.' }
  }
}

type ProfileFormState = {
  error?: string
  success?: boolean
} | undefined

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to update your profile.' }
  }

  const bio = (formData.get('bio') as string | null)?.trim()
  const youtubeUrl = (formData.get('youtube_pitch_url') as string | null)?.trim()
  const avatarUrl = (formData.get('avatar_url') as string | null)?.trim()
  const twitterUrl = (formData.get('twitter_url') as string | null)?.trim()
  const githubUrl = (formData.get('github_url') as string | null)?.trim()
  const linkedinUrl = (formData.get('linkedin_url') as string | null)?.trim()
  const websiteUrl = (formData.get('website_url') as string | null)?.trim()

  const updates: Record<string, string | null> = {
    bio: bio || null,
    youtube_pitch_url: youtubeUrl || null,
    twitter_url: twitterUrl || null,
    github_url: githubUrl || null,
    linkedin_url: linkedinUrl || null,
    website_url: websiteUrl || null,
  }

  // Only update avatar if provided
  // 'remove' is used as a signal to clear the avatar
  if (avatarUrl === 'remove') {
    updates.avatar_url = null
  } else if (avatarUrl) {
    updates.avatar_url = avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('[Supabase] updateProfile error:', error)
    return { error: error.message }
  }

  revalidatePath('/settings')
  
  // Refetch to get username for redirect
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  if (profile) {
    revalidatePath(`/profile/${profile.username}`)
    redirect(`/profile/${profile.username}`)
  }

  return { success: true }
}
