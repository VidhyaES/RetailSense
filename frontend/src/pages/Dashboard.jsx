import { useState, useEffect } from 'react'
import { getStatus, getCategorySummary, getTopProducts } from '../api/client'
import KPICard       from '../components/KPICard'
import SalesTrend    from '../components/SalesTrend'
import CategoryChart from '../components/CategoryChart'
import StoreTable    from '../components/StoreTable'
import ForecastChart from '../components/ForecastChart'
import AnomalyPanel  from '../components/AnomalyPanel'

const NavIcon = ({ d, d2 }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>{d2 && <path d={d2}/>}
  </svg>
)

const NAV_ITEMS = [
  { label: 'Overview',   icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', id: 'overview' },
  { label: 'Analytics',  icon: 'M18 20V10M12 20V4M6 20v-6',                     id: 'analytics' },
  { label: 'Forecast',   icon: 'M22 12h-4l-3 9L9 3l-3 9H2',                     id: 'forecast' },
  { label: 'Stores',     icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', id2: 'M9 22V12h6v10', id: 'stores' },
]

const Dashboard = ({ onLogout }) => {
  const [status,     setStatus]     = useState(null)
  const [topCat,     setTopCat]     = useState(null)
  const [topProduct, setTopProduct] = useState(null)
  const [activeNav,  setActiveNav]  = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    getStatus().then(res => setStatus(res.data))
    getCategorySummary(90).then(res => setTopCat(res.data.categories?.[0]))
    getTopProducts(30, 1).then(res => setTopProduct(res.data.products?.[0]))
  }, [])

  const revenue  = status?.transactions?.revenue ?? 0
  const txnCount = status?.transactions?.count   ?? 0
  const dateFrom = status?.transactions?.date_from
  const dateTo   = status?.transactions?.date_to

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#f8fafc',
    }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? '240px' : '72px',
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? '28px 24px 24px' : '28px 16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px', background: '#6366f1',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                RetailSense
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px', letterSpacing: '0.05em' }}>
                ANALYTICS PLATFORM
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {sidebarOpen && (
            <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '0.1em',
              fontWeight: 600, padding: '0 8px', marginBottom: '8px' }}>
              MAIN MENU
            </div>
          )}
          {[
            { label: 'Overview',  id: 'overview',  d: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
            { label: 'Analytics', id: 'analytics', d: 'M18 20V10M12 20V4M6 20v-6' },
            { label: 'Forecast',  id: 'forecast',  d: 'M22 12h-4l-3 9L9 3l-3 9H2' },
            { label: 'Stores',    id: 'stores',    d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '12px', padding: sidebarOpen ? '10px 12px' : '10px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              marginBottom: '4px', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: activeNav === item.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeNav === item.id ? '#818cf8' : '#475569',
              transition: 'all 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.d}/>
              </svg>
              {sidebarOpen && (
                <span style={{ fontSize: '14px', fontWeight: activeNav === item.id ? 600 : 400 }}>
                  {item.label}
                </span>
              )}
              {sidebarOpen && activeNav === item.id && (
                <div style={{
                  marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: '#6366f1',
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: '10px', padding: '10px 12px', borderRadius: '10px',
            border: 'none', background: 'transparent', color: '#475569',
            cursor: 'pointer', fontSize: '13px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={sidebarOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}/>
            </svg>
            {sidebarOpen && <span>Collapse</span>}
          </button>

          {/* User */}
          {sidebarOpen && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', marginTop: '8px',
              background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#6366f1', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>V</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Admin</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>RetailSense</div>
              </div>
              <button onClick={onLogout} title="Logout" style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #f1f5f9',
          padding: '0 32px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {activeNav === 'overview'  && 'Dashboard Overview'}
              {activeNav === 'analytics' && 'Sales Analytics'}
              {activeNav === 'forecast'  && 'Demand Forecast'}
              {activeNav === 'stores'    && 'Store Performance'}
            </h1>
            {dateFrom && (
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Data range: {dateFrom} → {dateTo}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '999px', padding: '5px 12px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>Live</span>
            </div>

            {/* Date range */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '7px 14px', fontSize: '13px', color: '#475569',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Last 365 days
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '28px 32px', flex: 1 }}>

          {/* ── Overview ── */}
          {activeNav === 'overview' && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px', marginBottom: '28px',
              }}>
                {[
                  {
                    title: 'Total Revenue',
                    value: `₹${(revenue / 100000).toFixed(1)}L`,
                    sub: 'All time', color: '#6366f1', bg: '#eef2ff',
                    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
                  },
                  {
                    title: 'Transactions',
                    value: txnCount.toLocaleString(),
                    sub: 'All time', color: '#10b981', bg: '#ecfdf5',
                    icon: 'M9 17H5a2 2 0 00-2 2M13 17h6M9 7H5a2 2 0 00-2 2M13 7h6',
                  },
                  {
                    title: 'Products',
                    value: status?.database?.products ?? '—',
                    sub: `${status?.database?.categories ?? '—'} categories`,
                    color: '#f59e0b', bg: '#fffbeb',
                    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10',
                  },
                  {
                    title: 'Top Category',
                    value: topCat?.category ?? '—',
                    sub: topCat ? `${topCat.revenue_pct}% of revenue` : '',
                    color: '#ef4444', bg: '#fef2f2',
                    icon: 'M18 20V10M12 20V4M6 20v-6',
                  },
                  {
                    title: 'Best Seller',
                    value: topProduct?.name?.split(' ').slice(0, 2).join(' ') ?? '—',
                    sub: topProduct ? `₹${topProduct.revenue?.toLocaleString()}` : '',
                    color: '#8b5cf6', bg: '#f5f3ff',
                    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
                  },
                ].map(card => (
                  <div key={card.title} style={{
                    background: '#fff', borderRadius: '14px', padding: '20px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{card.title}</span>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '9px',
                        background: card.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: card.color,
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d={card.icon}/>
                        </svg>
                      </div>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{card.sub}</div>
                  </div>
                ))}
              </div>
              <SalesTrend />
            </>
          )}

          {/* ── Analytics ── */}
          {activeNav === 'analytics' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <CategoryChart />
                <StoreTable />
              </div>
              <AnomalyPanel />
            </>
          )}

          {/* ── Forecast ── */}
          {activeNav === 'forecast' && (
            <ForecastChart />
          )}

          {/* ── Stores ── */}
          {activeNav === 'stores' && (
            <StoreTable />
          )}

          {/* Footer */}
          <div style={{
            marginTop: '40px', paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              RetailSense v1.0 · Django + PostgreSQL + React
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Built by Vidhya ES
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard