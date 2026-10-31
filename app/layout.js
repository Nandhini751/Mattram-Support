import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Nav from '@/components/Nav'
import { getProfile } from '@/lib/supabase/server'

const font = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata = { title: 'Maatram Support' }

export default async function RootLayout({ children }) {
  const profile = await getProfile()
  return (
    <html lang="en">
      <body className={`${font.className} min-h-screen bg-stone-100 text-stone-900 antialiased`}>
        {profile && <Nav profile={profile} />}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
