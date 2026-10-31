import { redirect } from 'next/navigation'
import { createClient, getProfile } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

export default async function Admin() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/queries')
  const supabase = await createClient()
  const [{ data: users }, { data: categories }, { data: rules }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('assignment_rules').select('*, category:categories(name), coordinator:profiles!coordinator_id(full_name)'),
  ])
  return <AdminPanel users={users || []} categories={categories || []} rules={rules || []} />
}
