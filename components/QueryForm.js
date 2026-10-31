'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS, PRIORITIES, input, button, card } from '@/lib/helpers'

export default function QueryForm({ categories }) {
  const router = useRouter()
  const [f, setF] = useState({
    student_name: '', student_email: '', student_phone: '', institution: '',
    category_id: categories[0]?.id || '', channel: 'WhatsApp', priority: 'Medium', description: '',
  })
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('queries')
      .insert({ ...f, category_id: Number(f.category_id), logged_by: user.id })
      .select('id')
      .single()
    if (error) { setBusy(false); return setErr(error.message) }
    for (const file of files) {
      const path = `${data.id}/${Date.now()}-${file.name}`
      const up = await supabase.storage.from('attachments').upload(path, file)
      if (!up.error) await supabase.from('attachments').insert({ query_id: data.id, path, file_name: file.name })
    }
    router.push(`/queries/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className={`${card} mx-auto max-w-2xl space-y-3`}>
      <h1 className="text-lg font-semibold">Log a student query</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={input} placeholder="Student name" value={f.student_name} onChange={set('student_name')} required />
        <input className={input} placeholder="Institution" value={f.institution} onChange={set('institution')} required />
        <input className={input} type="email" placeholder="Student email (for updates)" value={f.student_email} onChange={set('student_email')} />
        <input className={input} placeholder="Student phone" value={f.student_phone} onChange={set('student_phone')} />
        <select className={input} value={f.category_id} onChange={set('category_id')}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={input} value={f.channel} onChange={set('channel')}>
          {CHANNELS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={input} value={f.priority} onChange={set('priority')}>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <input className={input} type="file" multiple onChange={(e) => setFiles([...e.target.files])} />
      </div>
      <textarea className={input} rows={4} placeholder="What does the student need?" value={f.description} onChange={set('description')} required />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className={button} disabled={busy}>{busy ? 'Saving...' : 'Log query'}</button>
    </form>
  )
}
