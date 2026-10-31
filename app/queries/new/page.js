import { redirect } from 'next/navigation'
import { createClient, getProfile } from '@/lib/supabase/server'
import QueryForm from '@/components/QueryForm'

export default async function NewQuery() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role === 'coordinator') redirect('/queries')
  const supabase = await createClient()
  const { data: cats } = await supabase.from('categories').select('*').order('name')
  return <QueryForm categories={cats || []} />
}
