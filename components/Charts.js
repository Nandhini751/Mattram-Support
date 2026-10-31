'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function Chart({ title, data, color }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Charts({ perCoord, cats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Chart title="Open queries per coordinator" data={perCoord} color="#1c1917" />
      <Chart title="Most common categories" data={cats} color="#fdb913" />
    </div>
  )
}
