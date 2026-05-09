'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProblem } from '@/app/actions/problems'

type ProblemFormState = { error?: string; success?: boolean } | undefined

export default function NewProblemPage() {
  const router = useRouter()
  const [_isPending, startTransition] = useTransition()

  const [formState, formAction, isSubmitting] = useActionState<
    ProblemFormState,
    FormData
  >(createProblem, undefined)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-black">Post a Problem</h1>
      
      <p className="text-sm text-gray-600 mb-8 border-l-2 border-black pl-4">
        Great startups are born from real frustrations. What is a painful problem you or your industry face daily that nobody has solved well?
      </p>

      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="problem-title" className="text-sm font-medium">
            Problem Summary <span className="text-gray-400 font-normal">(min 5 chars)</span>
          </label>
          <input
            id="problem-title"
            name="title"
            type="text"
            required
            minLength={5}
            maxLength={120}
            placeholder="e.g. Managing subscription receipts is a nightmare"
            className="border border-gray-300 px-3 py-2 text-sm focus:border-black outline-none w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="problem-description" className="text-sm font-medium">
            Details & Pain Points
            <span className="text-gray-400 font-normal ml-1">(min 20 chars)</span>
          </label>
          <textarea
            id="problem-description"
            name="description"
            required
            minLength={20}
            rows={8}
            placeholder="Describe the exact workflow that is broken. Who else faces this? How are you currently working around it?"
            className="border border-gray-300 px-3 py-2 text-sm focus:border-black outline-none w-full resize-y"
          />
        </div>

        {formState?.error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {formState.error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-black bg-black text-white px-5 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting…' : 'Share Problem'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-black border-none bg-transparent p-0"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
