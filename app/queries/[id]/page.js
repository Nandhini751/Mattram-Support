import { notFound, redirect } from 'next/navigation'
import { createClient, getProfile } from '@/lib/supabase/server'
import Badge from '@/components/Badge'
import UpdateForm from '@/components/UpdateForm'
import { fmt, isOverdue, card } from '@/lib/helpers'

export default async function QueryDetail({ params }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  const supabase = await createClient()

  const { data: q } = await supabase
    .from('queries')
    .select('*, category:categories(name), assignee:profiles!assigned_to(full_name), logger:profiles!logged_by(full_name)')
    .eq('id', id)
    .single()
  if (!q) notFound()

  const [{ data: history }, { data: files }, { data: coords }] = await Promise.all([
    supabase.from('query_history').select('*, who:profiles!changed_by(full_name), old_a:profiles!old_assignee(full_name), new_a:profiles!new_assignee(full_name)').eq('query_id', id).order('created_at'),
    supabase.from('attachments').select('*').eq('query_id', id),
    supabase.from('profiles').select('id, full_name').eq('role', 'coordinator'),
  ])

  const links = []
  for (const f of files || []) {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(f.path, 3600)
    if (data) links.push({ name: f.file_name, url: data.signedUrl })
  }

  const isAdmin = profile.role === 'admin'
  const canUpdate = isAdmin || (profile.role === 'coordinator' && q.assigned_to === profile.id)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <div className={card}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{q.student_name}</h1>
            <Badge status={q.status} />
            {isOverdue(q) && <span className="text-sm font-semibold text-red-600">Overdue</span>}
          </div>
          <p className="text-sm text-stone-600">{q.institution} · {q.category?.name} · via {q.channel} · {q.priority} priority</p>
          <p className="mt-3 whitespace-pre-wrap">{q.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-1 text-sm text-stone-600">
            <dt>Student contact</dt><dd>{q.student_email || q.student_phone || '-'}</dd>
            <dt>Coordinator</dt><dd>{q.assignee?.full_name || '-'}</dd>
            <dt>Logged by</dt><dd>{q.logger?.full_name || '-'}</dd>
            <dt>Due</dt><dd>{fmt(q.due_at)}</dd>
          </dl>
          {links.length > 0 && (
            <div className="mt-3 text-sm">
              Attachments: {links.map((l) => <a key={l.url} className="mr-3 underline" href={l.url} target="_blank">{l.name}</a>)}
            </div>
          )}
        </div>

        <div className={card}>
          <h2 className="mb-3 font-semibold">History</h2>
          <ol className="space-y-3 border-l-2 border-brand pl-4">
            {history?.map((h) => (
              <li key={h.id} className="text-sm">
                <div className="text-xs text-stone-500">{fmt(h.created_at)} · {h.who?.full_name || 'System'}</div>
                <div>
                  {h.old_status !== h.new_status && <>Status: {h.old_status || 'none'} → <b>{h.new_status}</b>. </>}
                  {h.old_assignee !== h.new_assignee && <>Coordinator: {h.old_a?.full_name || 'none'} → <b>{h.new_a?.full_name || 'none'}</b>. </>}
                </div>
                {h.note && <div className="text-stone-600">“{h.note}”</div>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {canUpdate ? (
        <UpdateForm id={q.id} status={q.status} assignee={q.assigned_to} coordinators={coords || []} isAdmin={isAdmin} />
      ) : (
        <div className={`${card} h-fit text-sm text-stone-600`}>Only the assigned coordinator or an admin can update this query.</div>
      )}
    </div>
  )
}
