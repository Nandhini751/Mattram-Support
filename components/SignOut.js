'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOut() {
  const router = useRouter()
  return (
    <button
      className="rounded-md border border-stone-600 px-3 py-1.5 text-sm text-stone-200 transition hover:bg-white/10"
      onClick={async () => {
        await createClient().auth.signOut()
        router.push('/login')
        router.refresh()
      }}
    >
      Sign out
    </button>
  )
}
