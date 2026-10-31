'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUSES, input, button, card } from '@/lib/helpers'

export default function UpdateForm({ id, status, assignee, coordinators, isAdmin }) {
  const router = useRouter()
  const [s, setS] = useState(status)
  const [a, setA] = useState(assignee || '')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const res = await fetch('/api/queries/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: s, assignee: a || null, note }),
    })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) return setErr(json.error)
    setNote('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className={`${card} h-fit space-y-3`}>
      <h2 className="font-semibold">Update this query</h2>
      <select className={input} value={s} onChange={(e) => setS(e.target.value)}>
        {STATUSES.map((x) => <option key={x}>{x}</option>)}
      </select>
      {isAdmin && (
        <select className={input} value={a} onChange={(e) => setA(e.target.value)}>
          <option value="">Unassigned</option>
          {coordinators.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
      )}
      <textarea className={input} rows={3} placeholder="Note (required)" value={note} onChange={(e) => setNote(e.target.value)} required />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className={button} disabled={busy}>Save update</button>
      <p className="text-xs text-stone-500">Marking a query Resolved emails the student.</p>
    </form>
  )
}
