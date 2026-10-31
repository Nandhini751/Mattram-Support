// Sends an email (Resend) or prints it in the terminal if no key is set, then logs it.
export async function notify(db, { query_id, kind, to, subject, text }) {
  if (!to) return false
  const key = process.env.RESEND_API_KEY
  if (key) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'onboarding@resend.dev', to: [to], subject, text }),
    })
    if (!res.ok) console.error('Email failed:', await res.text())
  } else {
    console.log(`[DEV EMAIL] to ${to}\n${subject}\n${text}\n`)
  }
  await db.from('notifications_log').insert({ query_id, kind, recipient: to })
  return true
}
