import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getProfile } from '@/lib/supabase/server'
import Badge from '@/components/Badge'
import { STATUSES, isOverdue, fmt, input, button, card } from '@/lib/helpers'

export default async function Queries({ searchParams }) {
  const sp = await searchParams
  const profile = await getProfile()
  if (!profile) redirect('/login')
  const supabase = await createClient()

  let q = supabase
    .from('queries')
    .select('*, category:categories(name), assignee:profiles!assigned_to(full_name)')
    .order('created_at', { ascending: false })
  if (sp.q) q = q.or(`student_name.ilike.%${sp.q}%,institution.ilike.%${sp.q}%`)
  if (sp.status) q = q.eq('status', sp.status)
  if (sp.category) q = q.eq('category_id', sp.category)
  if (sp.coordinator) q = q.eq('assigned_to', sp.coordinator)
  if (sp.from) q = q.gte('created_at', sp.from)
  if (sp.to) q = q.lte('created_at', sp.to + 'T23:59:59')

  const [{ data: rows }, { data: cats }, { data: coords }] = await Promise.all([
    q,
    supabase.from('categories').select('*').order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'coordinator'),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Student queries</h1>
        <p className="text-sm text-stone-600">{rows?.length || 0} shown. Search or filter to find a query.</p>
      </div>
      <form className={`${card} grid gap-2 md:grid-cols-4`}>
        <input className={input} name="q" placeholder="Search student or institution" defaultValue={sp.q} />
        <select className={input} name="status" defaultValue={sp.status || ''}>
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={input} name="category" defaultValue={sp.category || ''}>
          <option value="">Any category</option>
          {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={input} name="coordinator" defaultValue={sp.coordinator || ''}>
          <option value="">Any coordinator</option>
          {coords?.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <input className={input} type="date" name="from" defaultValue={sp.from} />
        <input className={input} type="date" name="to" defaultValue={sp.to} />
        <button className={button}>Apply filters</button>
        <Link href="/queries" className="self-center text-sm underline">Clear</Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-900 text-stone-100">
            <tr>
              {['Student', 'Category', 'Channel', 'Priority', 'Status', 'Coordinator', 'Due', 'Logged'].map((h) => (
                <th key={h} className="px-3 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-t border-stone-100 hover:bg-brand-soft">
                <td className="px-3 py-2">
                  <Link className="font-medium underline" href={`/queries/${r.id}`}>{r.student_name}</Link>
                  <div className="text-xs text-stone-500">{r.institution}</div>
                </td>
                <td className="px-3 py-2">{r.category?.name}</td>
                <td className="px-3 py-2">{r.channel}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${r.priority === 'High' ? 'bg-red-100 text-red-700' : r.priority === 'Low' ? 'bg-stone-100 text-stone-600' : 'bg-brand-soft text-stone-800'}`}>
                    {r.priority}
                  </span>
                </td>
                <td className="px-3 py-2"><Badge status={r.status} /></td>
                <td className="px-3 py-2">{r.assignee?.full_name || '-'}</td>
                <td className={`px-3 py-2 ${isOverdue(r) ? 'font-semibold text-red-600' : ''}`}>
                  {fmt(r.due_at)}{isOverdue(r) && ' (overdue)'}
                </td>
                <td className="px-3 py-2">{fmt(r.created_at)}</td>
              </tr>
            ))}
            {!rows?.length && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-stone-500">No queries match. Clear the filters or log a new query.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}