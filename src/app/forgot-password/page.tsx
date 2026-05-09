'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions/auth'
import type { AuthFormState } from '@/lib/types'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    undefined
  )

  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <Link href="/login" className="text-xs text-gray-500 hover:text-black mb-4 inline-block">
        ← Back to sign in
      </Link>
      
      <h1 className="text-xl font-bold mb-1">Reset Password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="border border-gray-300 px-3 py-2 text-sm w-full focus:border-black outline-none transition-colors"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {state.error}
          </p>
        )}

        {state?.message && (
          <p className="text-sm text-green-600 border border-green-200 bg-green-50 px-3 py-2">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="border border-black bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
