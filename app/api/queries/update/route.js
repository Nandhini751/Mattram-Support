import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notify'

export async function POST(req) {
  const { id, status, assignee, note } = await req.json()
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_query', {
    p_id: id, p_status: status, p_assignee: assignee, p_note: note,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (status === 'Resolved') {
    const { data: q } = await supabase.from('queries').select('student_name, student_email').eq('id', id).single()
    if (q?.student_email) {
      await notify(createAdmin(), {
        query_id: id,
        kind: 'resolved',
        to: q.student_email,
        subject: 'Your query to Maatram has been resolved',
        text: `Hi ${q.student_name},\n\nYour query has been resolved.\n\nNote from the team: ${note}\n\nReply to this email if you need anything else.`,
      })
    }
  }
  return NextResponse.json({ ok: true })
}
