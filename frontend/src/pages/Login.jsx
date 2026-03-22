import { useState } from 'react'
import { login } from '../api/client'

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(username, password)
      localStorage.setItem('access_token',  res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      onLogin()
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#0a0a0f',
    }}>

      {/* ── Left Panel — Hero ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        background: '#0a0a0f',
      }}>

        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&q=80"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.18, zIndex: 0,
          }}
        />

        {/* Dark overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(20,20,40,0.85) 100%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', background: '#6366f1',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99,102,241,0.5)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              RetailSense
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '999px', padding: '6px 14px', marginBottom: '24px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8' }} />
            <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 500, letterSpacing: '0.04em' }}>
              AI-POWERED RETAIL ANALYTICS
            </span>
          </div>

          <h1 style={{
            fontSize: '52px', fontWeight: 800, color: '#fff',
            lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px',
          }}>
            Predict demand.<br />
            <span style={{ color: '#818cf8' }}>Maximise revenue.</span>
          </h1>

          <p style={{ fontSize: '17px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '480px', margin: 0 }}>
            Enterprise retail intelligence platform powered by Random Forest
            and SARIMA ensemble models. Real-time analytics across every store and product.
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '40px', flexWrap: 'wrap' }}>
            {[
              { num: '₹597.8L', label: 'Revenue tracked' },
              { num: '25,803',  label: 'Transactions' },
              { num: '87%',     label: 'Model accuracy' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '16px 20px',
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trusted by logos row */}
          <div style={{ marginTop: '48px' }}>
            <p style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.1em', marginBottom: '16px' }}>
              TRUSTED STACK
            </p>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              {['Django', 'PostgreSQL', 'React', 'scikit-learn', 'SARIMA'].map(tech => (
                <span key={tech} style={{
                  fontSize: '13px', fontWeight: 600, color: '#334155',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '6px', padding: '5px 12px',
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom left */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: '12px', color: '#475569' }}>All systems operational</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div style={{
        width: '480px',
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 56px',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
      }}>

        {/* Top right brand */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#f1f0fe', borderRadius: '8px', padding: '6px 12px', marginBottom: '32px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>Secure Login</span>
          </div>

          <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Enter your credentials to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{ ...inputStyle, paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ ...inputStyle, paddingLeft: '42px' }}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            borderRadius: '12px', border: 'none',
            background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
            boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                Sign in to dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '32px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
          <span style={{ fontSize: '11px', color: '#cbd5e1', letterSpacing: '0.08em', fontWeight: 500 }}>
            PROTECTED BY JWT
          </span>
          <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
        </div>

        {/* Feature cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
              title: 'Real-time Analytics',
              desc: 'Live sales trend, EDA dashboards',
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              title: '30-day Demand Forecast',
              desc: 'RF + SARIMA ensemble models',
            },
            {
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
              title: 'ETL Pipeline',
              desc: 'Django + PostgreSQL backend',
            },
          ].map(f => (
            <div key={f.title} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: '#f8fafc', borderRadius: '10px', padding: '14px 16px',
              border: '1px solid #f1f5f9',
            }}>
              <div style={{
                width: '34px', height: '34px', background: '#ede9fe',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ fontSize: '12px', color: '#cbd5e1', textAlign: 'center', marginTop: '40px' }}>
          RetailSense v1.0 · Built with Django & React
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: '12px', fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: '8px', letterSpacing: '0.04em',
}

const inputStyle = {
  width: '100%', padding: '13px 14px',
  borderRadius: '10px', border: '1.5px solid #e2e8f0',
  fontSize: '14px', color: '#0f172a', background: '#f8fafc',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, background 0.15s',
}

export default Login