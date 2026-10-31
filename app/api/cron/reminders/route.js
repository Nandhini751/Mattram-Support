import { NextResponse } from 'next/server'
import { createAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notify'

const H = 36e5

export async function GET(req) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". For local testing use ?secret=<CRON_SECRET>.
  const secret = process.env.CRON_SECRET
  const url = new URL(req.url)
  const ok = req.headers.get('authorization') === `Bearer ${secret}` || url.searchParams.get('secret') === secret
  if (!secret || !ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createAdmin()
  const now = Date.now()
  const base = process.env.NEXT_PUBLIC_APP_URL

  const { data: open } = await db
    .from('queries')
    .select('*, coordinator:profiles!assigned_to(full_name, email)')
    .not('status', 'in', '(Resolved,Closed)')
  const { data: admins } = await db.from('profiles').select('email').eq('role', 'admin')

  // Has this reminder type already been sent for this query in the last N hours?
  const already = async (id, kind, hours) => {
    const { count } = await db
      .from('notifications_log')
      .select('*', { count: 'exact', head: true })
      .eq('query_id', id).eq('kind', kind)
      .gte('sent_at', new Date(now - hours * H).toISOString())
    return count > 0
  }

  const sent = []
  const send = async (q, kind, to, subject, text) => {
    if (await notify(db, { query_id: q.id, kind, to, subject, text: `${text}\n\n${base}/queries/${q.id}` })) {
      sent.push(`${kind}: ${q.student_name} -> ${to}`)
    }
  }

  for (const q of open || []) {
    const idle = (now - new Date(q.updated_at)) / H
    const coordEmail = q.coordinator?.email
    const waiting = q.status === 'Waiting for student'

    if (waiting) {
      if (idle >= 48 && q.student_email && !(await already(q.id, 'student_reminder', 48)))
        await send(q, 'student_reminder', q.student_email, 'We are waiting for your reply',
          `Hi ${q.student_name}, we need a reply from you to continue with your query.`)
    } else if (idle >= 24 && coordEmail && !(await already(q.id, 'coordinator_nudge', 24))) {
      await send(q, 'coordinator_nudge', coordEmail, `No update on ${q.student_name}'s query`,
        `This query has had no update for ${Math.floor(idle)} hours. Please post an update.`)
    }

    if (new Date(q.due_at) < now && coordEmail && !(await already(q.id, 'overdue', 24 * 7)))
      await send(q, 'overdue', coordEmail, `Overdue: ${q.student_name}'s query`,
        'This query is past its due date.')

    if (idle >= 72 && !(await already(q.id, 'escalation', 72)))
      for (const a of admins || [])
        await send(q, 'escalation', a.email, `Escalation: ${q.student_name}'s query`,
          `No update for ${Math.floor(idle)} hours. Coordinator: ${q.coordinator?.full_name || 'unassigned'}.`)
  }

  return NextResponse.json({ count: sent.length, sent })
}
