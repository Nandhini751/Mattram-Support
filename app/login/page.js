'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { input, button, card } from '@/lib/helpers'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ email: '', password: '', full_name: '', role: 'rep' })
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    const supabase = createClient()
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
        : await supabase.auth.signUp({
          email: f.email,
          password: f.password,
          options: { data: { full_name: f.full_name, role: f.role } },
        })
    if (error) return setMsg(error.message)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-10 grid overflow-auto md:grid-cols-2">
      <div className="flex flex-col justify-between bg-stone-900 p-8 text-white md:p-12">
        <span className="w-fit rounded-lg bg-white p-2">
          <img src="/logo.png" alt="Maatram Foundation" className="h-10 w-auto" />
        </span>
        <div className="py-10">
          <div className="mb-5 h-1.5 w-16 rounded bg-brand" />
          <h1 className="max-w-md text-3xl font-bold leading-tight md:text-4xl">
            Every student query, followed up until it is solved.
          </h1>
          <p className="mt-4 max-w-md text-stone-300">
            Log it once, assign it to a coordinator, and let the reminders keep it moving.
          </p>
        </div>
        <p className="text-sm text-stone-400">Maatram Foundation student support</p>
      </div>

      <div className="flex items-center justify-center bg-stone-100 p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Sign in' : 'Create a demo account'}</h2>
          <p className="mb-5 mt-1 text-sm text-stone-600">
            {mode === 'login' ? 'Use the email and password your admin gave you.' : 'For testing only.'}
          </p>
          <form onSubmit={submit} className={`${card} space-y-3`}>
            {mode === 'signup' && (
              <>
                <input className={input} placeholder="Full name" value={f.full_name} onChange={set('full_name')} required />
                <select className={input} value={f.role} onChange={set('role')}>
                  <option value="rep">Student representative</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}
            <input className={input} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
            <input className={input} type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <button className={`${button} w-full`}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <button className="mt-4 text-sm text-stone-600 underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Need a demo account? Sign up' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}