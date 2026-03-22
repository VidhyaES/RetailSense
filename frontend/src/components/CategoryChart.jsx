import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getCategorySummary } from '../api/client'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const CategoryChart = () => {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategorySummary(90)
      .then(res => setData(res.data.categories))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
        Revenue by Category <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>(last 90 days)</span>
      </h2>

      {loading ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          Loading...
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {data.map((cat, i) => (
              <div key={cat.category} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#f9fafb', borderRadius: '6px', padding: '6px 10px',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: '12px', color: '#374151' }}>{cat.category}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{cat.revenue_pct}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CategoryChart