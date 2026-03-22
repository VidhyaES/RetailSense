import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getSalesTrend } from '../api/client'

const SalesTrend = () => {
  const [data, setData]               = useState([])
  const [granularity, setGranularity] = useState('daily')
  const [days, setDays]               = useState(90)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    setLoading(true)
    getSalesTrend(granularity, days)
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [granularity, days])

  const formatRevenue = (v) => `₹${(v / 1000).toFixed(0)}k`
  const formatLabel   = (v) => v?.length > 8 ? v.slice(5) : v

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Sales Trend</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['daily', 'weekly', 'monthly'].map(g => (
            <button key={g} onClick={() => setGranularity(g)} style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500,
              background: granularity === g ? '#4f46e5' : '#f3f4f6',
              color: granularity === g ? '#fff' : '#374151',
            }}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
          ))}
          <select value={days} onChange={e => setDays(Number(e.target.value))} style={{
            padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb',
            fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer',
          }}>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>365 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          Loading...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="period" tickFormatter={formatLabel} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis yAxisId="left" tickFormatter={formatRevenue} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(value, name) => [
                name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                name === 'revenue' ? 'Revenue' : 'Transactions'
              ]}
              labelStyle={{ fontSize: 12 }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left"  type="monotone" dataKey="revenue"      stroke="#4f46e5" strokeWidth={2} dot={false} name="revenue" />
            <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} dot={false} name="transactions" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default SalesTrend