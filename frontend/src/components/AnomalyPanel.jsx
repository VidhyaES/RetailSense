import { useState, useEffect } from 'react'
import { getAnomalies } from '../api/client'

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Critical' },
  high:     { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', label: 'High'     },
  medium:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Medium'   },
}

const AnomalyPanel = () => {
  const [data,      setData]      = useState([])
  const [summary,   setSummary]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [severity,  setSeverity]  = useState('all')
  const [days,      setDays]      = useState(90)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    setLoading(true)
    getAnomalies(days, severity, 50)
      .then(res => {
        setData(res.data.anomalies)
        setSummary(res.data.summary)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [days, severity])

  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #f8fafc',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', background: '#fef2f2',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Anomaly Detection
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Isolation Forest · unusual sales patterns
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Severity filter */}
          <div style={{ display: 'flex', background: '#f8fafc', borderRadius: '8px', padding: '3px' }}>
            {['all', 'critical', 'high', 'medium'].map(s => (
              <button key={s} onClick={() => setSeverity(s)} style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                background: severity === s ? '#fff' : 'transparent',
                color: severity === s ? '#0f172a' : '#94a3b8',
                boxShadow: severity === s ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <select value={days} onChange={e => setDays(Number(e.target.value))} style={{
            padding: '7px 10px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '12px',
            color: '#374151', background: '#fff', cursor: 'pointer',
          }}>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div style={{
          display: 'flex', gap: '0', borderBottom: '1px solid #f8fafc',
        }}>
          {[
            { label: 'Total',    value: summary.total_anomalies, color: '#6366f1' },
            { label: 'Critical', value: summary.critical,        color: '#ef4444' },
            { label: 'High',     value: summary.high,            color: '#f97316' },
            { label: 'Medium',   value: summary.medium,          color: '#f59e0b' },
            { label: 'Spikes',   value: summary.spikes,          color: '#10b981' },
            { label: 'Drops',    value: summary.drops,           color: '#3b82f6' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, padding: '12px 16px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? '1px solid #f8fafc' : 'none',
              background: '#fafafa',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          Running Isolation Forest model...
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          No anomalies detected for the selected period.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Severity', 'Date', 'Product', 'Store', 'Daily Qty', 'vs Avg', 'Deviation', 'Score'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#64748b', fontWeight: 600, fontSize: '11px',
                    letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    borderBottom: '1px solid #f1f5f9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const cfg = SEVERITY_CONFIG[row.severity] || SEVERITY_CONFIG.medium
                const isExpanded = expanded === i
                return (
                  <>
                    <tr key={i}
                      onClick={() => setExpanded(isExpanded ? null : i)}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        cursor: 'pointer',
                        background: isExpanded ? '#fafbff' : i % 2 === 0 ? '#fff' : '#fafafa',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Severity badge */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: cfg.bg, color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: '6px', padding: '3px 10px',
                          fontSize: '11px', fontWeight: 600,
                        }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {row.date}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.product_name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.product_sku} · {row.category}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {row.store_name.replace('RetailSense ', '')}
                      </td>
                      {/* Qty with direction icon */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '16px',
                            color: row.direction === 'spike' ? '#10b981' : '#ef4444',
                          }}>
                            {row.direction === 'spike' ? '↑' : '↓'}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.daily_qty}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {row.rolling_mean}
                      </td>
                      {/* Deviation bar */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '60px', height: '5px',
                            background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', borderRadius: '3px',
                              background: row.direction === 'spike' ? '#10b981' : '#ef4444',
                              width: `${Math.min(row.deviation_pct, 100)}%`,
                            }} />
                          </div>
                          <span style={{ color: '#374151', fontSize: '12px' }}>
                            {row.deviation_pct}%
                          </span>
                        </div>
                      </td>
                      {/* Score badge */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: cfg.bg, color: cfg.color,
                          borderRadius: '6px', padding: '3px 8px',
                          fontWeight: 700, fontSize: '12px',
                        }}>
                          {row.anomaly_score.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${i}-exp`} style={{ background: '#f8faff' }}>
                        <td colSpan={8} style={{ padding: '12px 24px 16px' }}>
                          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            {[
                              { label: 'Daily Revenue',   value: `₹${row.daily_revenue.toLocaleString()}` },
                              { label: 'Direction',       value: row.direction === 'spike' ? '↑ Demand Spike' : '↓ Demand Drop' },
                              { label: '7-day Avg',       value: row.rolling_mean },
                              { label: 'Deviation',       value: `${row.deviation_pct}% from avg` },
                              { label: 'Anomaly Score',   value: row.anomaly_score.toFixed(3) },
                            ].map(d => (
                              <div key={d.label}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{d.label}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{d.value}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AnomalyPanel