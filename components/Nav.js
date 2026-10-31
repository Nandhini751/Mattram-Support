import Link from 'next/link'
import SignOut from './SignOut'

const ROLE = { rep: 'Student rep', coordinator: 'Coordinator', admin: 'Admin' }

export default function Nav({ profile }) {
  const link = 'rounded-md px-3 py-1.5 text-sm font-medium text-stone-300 transition hover:bg-white/10 hover:text-white'
  return (
    <header className="border-b-4 border-brand bg-stone-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 flex items-center gap-3">
          <span className="rounded-md bg-white p-1">
            <img src="/logo.png" alt="Maatram" className="h-7 w-auto" />
          </span>
          <span className="font-semibold text-white">Student Support</span>
        </Link>
        <Link className={link} href="/queries">Queries</Link>
        {profile.role !== 'coordinator' && <Link className={link} href="/queries/new">Log a query</Link>}
        {profile.role === 'admin' && <Link className={link} href="/dashboard">Dashboard</Link>}
        {profile.role === 'admin' && <Link className={link} href="/admin">Admin</Link>}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-stone-300">{profile.full_name || profile.email}</span>
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-stone-900">{ROLE[profile.role]}</span>
          <SignOut />
        </div>
      </div>
    </header>
  )
}