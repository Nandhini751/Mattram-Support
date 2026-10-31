const colors = {
  New: 'bg-sky-100 text-sky-800',
  Assigned: 'bg-indigo-100 text-indigo-800',
  'In progress': 'bg-amber-100 text-amber-900',
  'Waiting for student': 'bg-purple-100 text-purple-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  Closed: 'bg-stone-200 text-stone-700',
}
export default function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || ''}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}