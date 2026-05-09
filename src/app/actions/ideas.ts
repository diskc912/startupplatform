'use server'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { redirect } from 'next/navigation'
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'
import { ratelimit } from '@/lib/ratelimit'

/**
 * Generates a time-limited presigned PUT URL for a Cloudflare R2 upload.
 * The client uses this URL to upload directly to R2 — the binary never
 * passes through the Next.js server.
 *
 * @param filename  - The desired object key (e.g. "ideas/uuid.webp")
 * @param contentType - Must be "image/webp" (enforced on client before requesting)
 */
export async function getR2PresignedUrl(
  filename: string,
  contentType: string
): Promise<{ url: string; key: string } | { error: string }> {
  // Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to upload images.' }
  }

  // Only accept webp for this flow
  if (contentType !== 'image/webp') {
    return { error: 'Only .webp images are accepted.' }
  }

  // Scope the key to the user's id to prevent enumeration
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `ideas/${user.id}/${Date.now()}_${safeFilename}`

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    // URL expires in 60 seconds — enough for a compressed webp
    const url = await getSignedUrl(r2Client, command, { expiresIn: 60 })

    return { url, key }
  } catch (err) {
    console.error('[R2] Failed to generate presigned URL:', err)
    return { error: 'Failed to generate upload URL. Please try again.' }
  }
}

// --------------------------------------------------------------------------

type IdeaFormState = {
  error?: string
  success?: boolean
} | undefined

/**
 * Saves a new idea row to Supabase after the image has already been
 * uploaded to R2 by the client.
 */
export async function createIdea(
  _prevState: IdeaFormState,
  formData: FormData
): Promise<IdeaFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to post an idea.' }
  }

  // Rate limiting (Fail open if Redis is unconfigured or offline)
  let success = true
  try {
    const result = await ratelimit.limit(`ratelimit_idea_${user.id}`)
    success = result.success
  } catch (e) {
    console.error('Rate limit error:', e)
  }

  if (!success) {
    return { error: 'You are posting too fast. Please wait a minute before posting again.' }
  }

  const title = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim()
  const imageUrl = (formData.get('image_url') as string | null)?.trim() || null

  if (!title || title.length < 5) {
    return { error: 'Title must be at least 5 characters.' }
  }
  if (!description || description.length < 20) {
    return { error: 'Description must be at least 20 characters.' }
  }

  const { error } = await supabase.from('ideas').insert({
    author_id: user.id,
    title,
    description,
    image_url: imageUrl,
    upvote_count: 0,
  })

  if (error) {
    console.error('[Supabase] createIdea error:', error)
    return { error: error.message }
  }

  redirect('/')
}
