'use client'

import { useActionState } from 'react'
import { updateUserPassword } from '@/app/actions/auth'
import type { AuthFormState } from '@/lib/types'

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateUserPassword,
    undefined
  )

  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <h1 className="text-xl font-bold mb-1">New Password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Please enter a new password for your account.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            New Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="border border-gray-300 px-3 py-2 text-sm w-full focus:border-black outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="Repeat your new password"
            className="border border-gray-300 px-3 py-2 text-sm w-full focus:border-black outline-none transition-colors"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="border border-black bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
