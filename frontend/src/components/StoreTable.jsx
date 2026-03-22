import { useState, useEffect } from 'react'
import { getStorePerformance } from '../api/client'

const StoreTable = () => {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStorePerformance(90)
      .then(res => setData(res.data.stores))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const maxRevenue = Math.max(...data.map(s => s.revenue), 1)

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
        Store Performance <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>(last 90 days)</span>
      </h2>

      {loading ? (
        <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
              {['Store', 'City', 'Revenue', 'Transactions', 'Avg Order'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((store, i) => (
              <tr key={store.code} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: '#111827' }}>
                  <div>{store.name.replace('RetailSense ', '')}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>{store.code}</div>
                </td>
                <td style={{ padding: '12px', color: '#374151' }}>{store.city}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                    ₹{store.revenue.toLocaleString()}
                  </div>
                  <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '2px' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px', background: '#4f46e5',
                      width: `${(store.revenue / maxRevenue * 100).toFixed(0)}%`
                    }} />
                  </div>
                </td>
                <td style={{ padding: '12px', color: '#374151' }}>{store.transactions.toLocaleString()}</td>
                <td style={{ padding: '12px', color: '#374151' }}>₹{store.avg_order_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default StoreTable