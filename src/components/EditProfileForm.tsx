'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { getAvatarPresignedUrl, updateProfile } from '@/app/actions/profile'
import { signOut, deleteAccount } from '@/app/actions/auth'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Profile } from '@/lib/types'

type UploadState =
  | { status: 'idle' }
  | { status: 'compressing' }
  | { status: 'uploading'; progress: number }
  | { status: 'done'; publicUrl: string }
  | { status: 'error'; message: string }

type ProfileFormState = { error?: string; success?: boolean } | undefined

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hiddenImageUrlRef = useRef<HTMLInputElement>(null)

  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [_isPending, startTransition] = useTransition()

  const [formState, formAction, isSubmitting] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, undefined)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadState({ status: 'compressing' })
    let compressed: Blob
    try {
      compressed = await imageCompression(file, {
        maxWidthOrHeight: 256, // Minimal size for Avatars
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

    setUploadState({ status: 'uploading', progress: 0 })
    const result = await getAvatarPresignedUrl(webpFilename, 'image/webp')

    if ('error' in result) {
      setUploadState({ status: 'error', message: result.error as string })
      return
    }

    const { url } = result

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

    const presignedPath = new URL(url).pathname 
    const key = presignedPath.replace(/^\/[^/]+\//, '')
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`

    if (hiddenImageUrlRef.current) {
      hiddenImageUrlRef.current.value = publicUrl
    }

    setUploadState({ status: 'done', publicUrl })
  }

  function clearImage() {
    setUploadState({ status: 'idle' })
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (hiddenImageUrlRef.current) hiddenImageUrlRef.current.value = ''
  }

  function removeExistingImage() {
    if (hiddenImageUrlRef.current) hiddenImageUrlRef.current.value = 'remove'
    setUploadState({ status: 'done', publicUrl: '' })
  }

  const isUploading =
    uploadState.status === 'compressing' ||
    uploadState.status === 'uploading'

  // Determine what image to aggressively show (optimistic override)
  const displayAvatarUrl = uploadState.status === 'done' 
    ? uploadState.publicUrl 
    : profile.avatar_url;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <form action={formAction} className="flex flex-col gap-6 w-full" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Edit Profile</h1>
      
      {/* Avatar upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Avatar</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--border)', border: '1px solid var(--border)' }}>
            {displayAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--muted)' }}>No img</div>
            )}
          </div>
          
          <div className="flex-1">
            <input
              ref={hiddenImageUrlRef}
              type="hidden"
              name="avatar_url"
            />

            {uploadState.status === 'idle' || uploadState.status === 'error' ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="avatar-image"
                  className="inline-block px-3 py-1.5 text-xs cursor-pointer transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--background)' }}
                >
                  Change Avatar
                  <input
                    id="avatar-image"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {displayAvatarUrl && (
                  <button
                    type="button"
                    onClick={removeExistingImage}
                    className="text-xs px-2 transition-colors"
                    style={{ color: 'var(--muted)' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : uploadState.status === 'compressing' ? (
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Compressing...</div>
            ) : uploadState.status === 'uploading' ? (
              <div className="w-full max-w-[200px]">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}>
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
               <div className="text-xs text-green-500 font-medium flex items-center gap-2 mt-1">
                 {uploadState.publicUrl === '' ? '✓ Removed' : '✓ Uploaded'}
                 <button
                    type="button"
                    onClick={clearImage}
                    className="text-xs font-normal hover:underline"
                    style={{ color: 'var(--muted)' }}
                  >
                    Undo
                  </button>
               </div>
            )}
            {uploadState.status === 'error' && (
              <p className="text-xs text-red-500 mt-2">{uploadState.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Bio / Tagline
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio || ''}
          rows={3}
          maxLength={300}
          placeholder="Short bio about who you are"
          className="px-3 py-2 text-sm outline-none w-full resize-y"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Youtube Pitch */}
      <div className="flex flex-col gap-1">
        <label htmlFor="youtube" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Your Showreel or Pitch Deck <span style={{ color: 'var(--muted)' }} className="font-normal">(YouTube URL)</span>
        </label>
        <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
          This video will be embedded directly on your profile as an interactive iframe.
        </p>
        <input
          id="youtube"
          name="youtube_pitch_url"
          type="url"
          defaultValue={profile.youtube_pitch_url || ''}
          placeholder="https://youtube.com/watch?v=..."
          className="px-3 py-2 text-sm outline-none w-full"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Generic Links */}
      <div className="flex flex-col gap-3 pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Links</h2>
        <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
          Add up to 4 custom links (e.g. your website, socials, or portfolio).
        </p>
        
        {(['twitter_url', 'github_url', 'linkedin_url', 'website_url'] as const).map((field, i) => (
          <div key={field} className="flex flex-col gap-1">
            <label htmlFor={field} className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Link {i + 1}</label>
            <input
              id={field}
              name={field}
              type="url"
              defaultValue={profile[field] || ''}
              placeholder="https://..."
              className="px-3 py-2 text-sm outline-none w-full"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
        ))}
      </div>

      {/* Server-side Error */}
      {formState?.error && (
        <p className="text-sm text-red-500 px-3 py-2" style={{ border: '1px solid var(--border)' }}>
          {formState.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-5 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)', border: '1px solid var(--foreground)' }}
        >
          {isSubmitting ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </form>

    {/* Appearance */}
    <div className="flex flex-col gap-3 pt-8 mt-4 w-full" style={{ borderTop: '1px solid var(--border)' }}>
      <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Appearance</h2>
      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
        Toggle between light and dark mode.
      </p>
      <div className="flex justify-start">
        <ThemeToggle />
      </div>
    </div>

    {/* Danger Zone */}
    <div className="flex flex-col gap-3 pt-8 mt-4 w-full" style={{ borderTop: '1px solid var(--border)' }}>
      <h2 className="text-sm font-bold text-red-500">Danger Zone</h2>
      
      <form action={signOut}>
        <button
          type="submit"
          className="w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md"
          style={{ color: 'var(--foreground)', border: '1px solid var(--border)' }}
        >
          Log out
        </button>
      </form>

      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950 rounded-md"
        style={{ border: '1px solid var(--border)' }}
      >
        Delete Account
      </button>
    </div>

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-bold text-red-600 mb-2">Delete Account</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Are you absolutely sure? This action cannot be undone. To confirm, please type your username: <strong style={{ color: 'var(--foreground)' }}>{profile.username}</strong>
          </p>
          <input 
            type="text" 
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            className="w-full px-3 py-2 text-sm border outline-none mb-4"
            style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            placeholder={profile.username}
          />
          <div className="flex gap-3 justify-end">
            <button 
              type="button"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <form action={deleteAccount}>
              <button 
                disabled={deleteConfirmText !== profile.username}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md disabled:opacity-50 transition-opacity"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
  </div>
  )
}
