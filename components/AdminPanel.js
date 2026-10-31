'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { input, button, card } from '@/lib/helpers'

export default function AdminPanel({ users, categories, rules }) {
  const router = useRouter()
  const supabase = createClient()
  const [cat, setCat] = useState('')
  const [rule, setRule] = useState({ category_id: '', institution: '', coordinator_id: '' })
  const coords = users.filter((u) => u.role === 'coordinator')
  const done = () => router.refresh()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className={`${card} md:col-span-2`}>
        <h2 className="mb-2 font-semibold">Users and roles</h2>
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 border-t border-stone-100 py-2 text-sm">
            <span className="flex-1">{u.full_name} <span className="text-stone-500">{u.email}</span></span>
            <select
              className={`${input} !w-44`}
              value={u.role}
              onChange={async (e) => { await supabase.from('profiles').update({ role: e.target.value }).eq('id', u.id); done() }}
            >
              <option value="rep">Student representative</option>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>

      <div className={card}>
        <h2 className="mb-2 font-semibold">Categories</h2>
        <p className="mb-2 text-sm text-stone-600">{categories.map((c) => c.name).join(', ')}</p>
        <div className="flex gap-2">
          <input className={input} placeholder="New category" value={cat} onChange={(e) => setCat(e.target.value)} />
          <button className={button} onClick={async () => { if (cat) { await supabase.from('categories').insert({ name: cat }); setCat(''); done() } }}>Add category</button>
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-2 font-semibold">Assignment rules</h2>
        <ul className="mb-2 text-sm text-stone-600">
          {rules.map((r) => (
            <li key={r.id}>{r.category?.name || 'Any category'}{r.institution && ` at ${r.institution}`} → {r.coordinator?.full_name}</li>
          ))}
          {!rules.length && <li>No rules yet. Queries go to the coordinator with the fewest open queries.</li>}
        </ul>
        <div className="space-y-2">
          <select className={input} value={rule.category_id} onChange={(e) => setRule({ ...rule, category_id: e.target.value })}>
            <option value="">Any category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className={input} placeholder="Institution (optional)" value={rule.institution} onChange={(e) => setRule({ ...rule, institution: e.target.value })} />
          <select className={input} value={rule.coordinator_id} onChange={(e) => setRule({ ...rule, coordinator_id: e.target.value })}>
            <option value="">Choose coordinator</option>
            {coords.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <button
            className={button}
            onClick={async () => {
              if (!rule.coordinator_id) return
              await supabase.from('assignment_rules').insert({
                category_id: rule.category_id ? Number(rule.category_id) : null,
                institution: rule.institution || null,
                coordinator_id: rule.coordinator_id,
              })
              setRule({ category_id: '', institution: '', coordinator_id: '' })
              done()
            }}
          >
            Add rule
          </button>
        </div>
      </div>
    </div>
  )
}
