'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { getR2PresignedUrl, createIdea } from '@/app/actions/ideas'

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadState =
  | { status: 'idle' }
  | { status: 'compressing' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; publicUrl: string; filename: string }
  | { status: 'error'; message: string }

type IdeaFormState = { error?: string; success?: boolean } | undefined

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewIdeaForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hiddenImageUrlRef = useRef<HTMLInputElement>(null)

  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })
  const [_isPending, startTransition] = useTransition()

  // createIdea is wired up via useActionState for inline server-side errors
  const [formState, formAction, isSubmitting] = useActionState<
    IdeaFormState,
    FormData
  >(createIdea, undefined)

  // ─── Image compression + R2 upload ──────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Client-side compression → convert to .webp, max 1200px wide
    setUploadState({ status: 'compressing' })
    let compressed: Blob
    try {
      compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.82,
      })
    } catch (err) {
      console.error('[Compression]', err)
      setUploadState({ status: 'error', message: 'Image compression failed.' })
      return
    }

    const webpFilename = `${file.name.replace(/\.[^.]+$/, '')}.webp`

    // 2. Fetch a presigned PUT URL from the Server Action
    setUploadState({ status: 'uploading', progress: 0 })
    const result = await getR2PresignedUrl(webpFilename, 'image/webp')

    if ('error' in result) {
      setUploadState({ status: 'error', message: result.error })
      return
    }

    const { url } = result

    // 3. PUT the compressed blob directly to R2 (no proxy through Next.js)
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url, true)
      xhr.setRequestHeader('Content-Type', 'image/webp')

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadState({
            status: 'uploading',
            progress: Math.round((ev.loaded / ev.total) * 100),
          })
        }
      }

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`R2 upload failed: ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(compressed)
      })
    } catch (err) {
      console.error('[R2 Upload]', err)
      setUploadState({ status: 'error', message: 'Upload to storage failed.' })
      return
    }

    // 4. Derive the public URL using the R2_PUBLIC_URL env var + the key
    //    The key structure is: ideas/<userId>/<timestamp>_<filename>
    //    We extract the key from the presigned URL path.
    const presignedPath = new URL(url).pathname // e.g. /founder-ideas/ideas/uid/ts_file.webp
    // Remove the leading bucket-name segment if present (R2 path-style)
    const key = presignedPath.replace(/^\/[^/]+\//, '') // → ideas/uid/ts_file.webp
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`

    if (hiddenImageUrlRef.current) {
      hiddenImageUrlRef.current.value = publicUrl
    }

    setUploadState({ status: 'done', publicUrl, filename: webpFilename })
  }

  // ─── Cancel / reset ─────────────────────────────────────────────────────────

  function clearImage() {
    setUploadState({ status: 'idle' })
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (hiddenImageUrlRef.current) hiddenImageUrlRef.current.value = ''
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isUploading =
    uploadState.status === 'compressing' ||
    uploadState.status === 'uploading'

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor="idea-title" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Title <span style={{ color: 'var(--muted)' }} className="font-normal">(min 5 chars)</span>
        </label>
        <input
          id="idea-title"
          name="title"
          type="text"
          required
          minLength={5}
          maxLength={120}
          placeholder="e.g. AI-powered receipt scanner for freelancers"
          className="px-3 py-2 text-sm outline-none w-full"
          style={{ 
            border: '1px solid var(--border)', 
            backgroundColor: 'var(--background)', 
            color: 'var(--foreground)',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label htmlFor="idea-description" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Description{' '}
          <span style={{ color: 'var(--muted)' }} className="font-normal">(min 20 chars)</span>
        </label>
        <textarea
          id="idea-description"
          name="description"
          required
          minLength={20}
          rows={6}
          placeholder="Describe your startup idea, the problem it solves, and who it's for."
          className="px-3 py-2 text-sm outline-none w-full resize-y"
          style={{ 
            border: '1px solid var(--border)', 
            backgroundColor: 'var(--background)', 
            color: 'var(--foreground)',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--foreground)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Image{' '}
          <span style={{ color: 'var(--muted)' }} className="font-normal">
            (optional — compressed to .webp, max 1200px)
          </span>
        </span>

        {/* Hidden inputs */}
        <input
          ref={hiddenImageUrlRef}
          type="hidden"
          name="image_url"
        />

        {uploadState.status === 'idle' || uploadState.status === 'error' ? (
          <>
            <label
              htmlFor="idea-image"
              className="px-4 py-6 text-center text-sm cursor-pointer transition-colors"
              style={{ 
                border: '1px dashed var(--border)', 
                color: 'var(--muted)',
                backgroundColor: 'var(--background)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--foreground)';
                e.currentTarget.style.color = 'var(--foreground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--muted)';
              }}
            >
              Click to choose an image
              <input
                id="idea-image"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {uploadState.status === 'error' && (
              <p className="text-xs text-red-600">{uploadState.message}</p>
            )}
          </>
        ) : uploadState.status === 'compressing' ? (
          <div className="px-4 py-3 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Compressing image…
          </div>
        ) : uploadState.status === 'uploading' ? (
          <div className="px-4 py-3" style={{ border: '1px solid var(--border)' }}>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
              <span>Uploading to R2…</span>
              <span>{uploadState.progress}%</span>
            </div>
            <div className="w-full h-1" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-1 transition-all"
                style={{ width: `${uploadState.progress}%`, backgroundColor: 'var(--foreground)' }}
              />
            </div>
          </div>
        ) : (
          // done
          <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 min-w-0">
              {/* Small preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadState.publicUrl}
                alt="Preview"
                className="w-10 h-10 object-cover flex-shrink-0"
                style={{ border: '1px solid var(--border)' }}
              />
              <span className="text-xs truncate" style={{ color: 'var(--foreground)' }}>
                {uploadState.filename}
              </span>
              <span className="text-xs text-green-600 flex-shrink-0">✓ Uploaded</span>
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="text-xs border-none bg-transparent p-0 flex-shrink-0"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Server-side form error */}
      {formState?.error && (
        <p className="text-sm text-red-600 px-3 py-2" style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(255,0,0,0.05)' }}>
          {formState.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-5 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ 
            backgroundColor: 'var(--foreground)', 
            color: 'var(--background)',
            border: '1px solid var(--foreground)'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && !isUploading) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && !isUploading) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isSubmitting ? 'Posting…' : 'Post Idea'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm border-none bg-transparent p-0 transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
