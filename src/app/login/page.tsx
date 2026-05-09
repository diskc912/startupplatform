'use client'

import { useActionState, use } from 'react'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/app/actions/auth'
import type { AuthFormState } from '@/lib/types'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = use(searchParams)
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined
  )

  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <h1 className="text-xl font-bold mb-1">Sign in</h1>
      <p className="text-sm text-gray-500 mb-6">
        Welcome back. Sign in to continue.
      </p>

      {message && (
        <p className="text-sm text-green-600 border border-green-200 bg-green-50 px-3 py-2 mb-6">
          {message}
        </p>
      )}

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
            className="border border-gray-300 px-3 py-2 text-sm w-full focus:border-black outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Your password"
            className="border border-gray-300 px-3 py-2 text-sm w-full focus:border-black outline-none"
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" title="Forgot password?" className="text-[10px] text-gray-500 hover:text-black transition-colors">
              Forgot password?
            </Link>
          </div>
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
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center">
        <span className="text-sm text-gray-400">or</span>
      </div>

      <form action={signInWithGoogle} className="mt-4">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Sign in with Google
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-black font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
