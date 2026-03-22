const KPICard = ({ title, value, subtitle, color = '#4f46e5' }) => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${color}`,
      flex: 1,
      minWidth: '200px',
    }}>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
        {title}
      </p>
      <p style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{subtitle}</p>
      )}
    </div>
  )
}

export default KPICard