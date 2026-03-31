'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'

export default function DocumentsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <img
        src="/logo2.png"
        alt="Knox Doors Co"
        className="w-20 h-20 mb-6"
      />

      <h1 className="text-2xl font-semibold mb-2 text-center">
        Documents (Skipped)
      </h1>

      <button
        onClick={() => router.push('/rep-dashboard')}
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Continue
      </button>
    </div>
  )
}