export const STATUSES = ['New', 'Assigned', 'In progress', 'Waiting for student', 'Resolved', 'Closed']
export const PRIORITIES = ['Low', 'Medium', 'High']
export const CHANNELS = ['WhatsApp', 'Phone', 'Email', 'Form', 'In person']
export const isOpen = (s) => !['Resolved', 'Closed'].includes(s)
export const isOverdue = (q) => isOpen(q.status) && q.due_at && new Date(q.due_at) < new Date()
export const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'

export const input =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-stone-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40'
export const button =
  'rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-brand-light active:translate-y-px disabled:opacity-50'
export const card = 'rounded-xl border border-stone-200 bg-white p-5 shadow-sm'