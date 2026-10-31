import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getProfile } from '@/lib/supabase/server'
import Charts from '@/components/Charts'
import { isOpen, isOverdue, fmt, card } from '@/lib/helpers'

const count = (rows, keyFn) => {
  const m = {}
  rows.forEach((r) => { const k = keyFn(r); m[k] = (m[k] || 0) + 1 })
  return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

export default async function Dashboard() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/queries')
  const supabase = await createClient()
  const { data } = await supabase
    .from('queries')
    .select('*, category:categories(name), assignee:profiles!assigned_to(full_name)')
  const rows = data || []

  const open = rows.filter((r) => isOpen(r.status))
  const overdue = rows.filter(isOverdue)
  const done = rows.filter((r) => r.resolved_at)
  const avgHours = done.length
    ? done.reduce((s, r) => s + (new Date(r.resolved_at) - new Date(r.created_at)), 0) / done.length / 36e5
    : 0

  const perCoord = count(open, (r) => r.assignee?.full_name || 'Unassigned')
  const cats = count(rows, (r) => r.category?.name || 'Other')

  const stats = [
    ['Open queries', open.length],
    ['Overdue', overdue.length],
    ['Average time to resolve', `${avgHours.toFixed(1)} h`],
    ['Total logged', rows.length],
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-stone-600">Where help is needed right now.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className={card}>
            <div className="mb-3 h-1 w-8 rounded bg-brand" />
            <div className="text-3xl font-bold">{value}</div>
            <div className="mt-1 text-sm text-stone-600">{label}</div>
          </div>
        ))}
      </div>
      <Charts perCoord={perCoord} cats={cats} />
      <div className={card}>
        <h2 className="mb-2 font-semibold">Overdue queries</h2>
        {overdue.length === 0 && <p className="text-sm text-stone-500">Nothing overdue. Nice.</p>}
        <ul className="space-y-1 text-sm">
          {overdue.map((r) => (
            <li key={r.id}>
              <Link className="underline" href={`/queries/${r.id}`}>{r.student_name}</Link>
              {' · '}{r.assignee?.full_name || 'Unassigned'}{' · due '}{fmt(r.due_at)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}