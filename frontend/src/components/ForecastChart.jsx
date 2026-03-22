import { useState, useEffect } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getProducts, getStores, runForecast, getForecast } from '../api/client'

const ForecastChart = () => {
  const [products, setProducts]   = useState([])
  const [stores, setStores]       = useState([])
  const [productId, setProductId] = useState('')
  const [storeId, setStoreId]     = useState('')
  const [modelType, setModelType] = useState('ensemble')
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [running, setRunning]     = useState(false)
  const [metrics, setMetrics]     = useState(null)
  const [error, setError]         = useState('')

  useEffect(() => {
    getProducts().then(res => {
      setProducts(res.data.results || res.data)
      setProductId(String((res.data.results || res.data)[0]?.id || ''))
    })
    getStores().then(res => {
      setStores(res.data.results || res.data)
      setStoreId(String((res.data.results || res.data)[0]?.id || ''))
    })
  }, [])

  const loadForecast = () => {
    if (!productId || !storeId) return
    setLoading(true)
    setError('')
    getForecast(productId, storeId, modelType)
      .then(res => {
        const rows = res.data.forecasts.map(f => ({
          date:      f.forecast_date,
          predicted: parseFloat(f.predicted_qty),
          lower:     parseFloat(f.lower_bound),
          upper:     parseFloat(f.upper_bound),
        }))
        setData(rows)
        setMetrics({ mae: res.data.forecasts[0]?.mae, rmse: res.data.forecasts[0]?.rmse })
      })
      .catch(() => setError('No forecast found. Click "Run Forecast" first.'))
      .finally(() => setLoading(false))
  }

  const handleRun = () => {
    if (!productId || !storeId) return
    setRunning(true)
    setError('')
    runForecast(Number(productId), Number(storeId), 30)
      .then(() => loadForecast())
      .catch(e => setError(e.response?.data?.error || 'Forecast failed.'))
      .finally(() => setRunning(false))
  }

  useEffect(() => {
    if (productId && storeId) loadForecast()
  }, [productId, storeId, modelType])

  const selectedProduct = products.find(p => String(p.id) === productId)
  const selectedStore   = stores.find(s => String(s.id) === storeId)

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          Demand Forecast
          <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400, marginLeft: '8px' }}>30 days ahead</span>
        </h2>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={productId} onChange={e => setProductId(e.target.value)} style={selectStyle}>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={storeId} onChange={e => setStoreId(e.target.value)} style={selectStyle}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name.replace('RetailSense ', '')}</option>)}
          </select>
          <select value={modelType} onChange={e => setModelType(e.target.value)} style={selectStyle}>
            <option value="ensemble">Ensemble</option>
            <option value="random_forest">Random Forest</option>
            <option value="sarima">SARIMA</option>
          </select>
          <button onClick={handleRun} disabled={running} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: running ? '#c7d2fe' : '#4f46e5', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
          }}>
            {running ? 'Running...' : 'Run Forecast'}
          </button>
        </div>
      </div>

      {metrics && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Model',    value: modelType.replace('_', ' ').toUpperCase() },
            { label: 'MAE',      value: metrics.mae  ?? '—' },
            { label: 'RMSE',     value: metrics.rmse ?? '—' },
            { label: 'Product',  value: selectedProduct?.name ?? '—' },
            { label: 'Store',    value: selectedStore?.city   ?? '—' },
          ].map(m => (
            <div key={m.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 14px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{m.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
          padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {loading || running ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px' }}>{running ? 'Training models... (30–60 sec)' : 'Loading forecast...'}</div>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={v => v?.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v, name) => [
                parseFloat(v).toFixed(1),
                name === 'predicted' ? 'Predicted' : name === 'upper' ? 'Upper bound' : 'Lower bound'
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area dataKey="upper"     fill="#e0e7ff" stroke="none" name="upper" />
            <Area dataKey="lower"     fill="#fff"    stroke="none" name="lower" />
            <Line dataKey="predicted" stroke="#4f46e5" strokeWidth={2.5} dot={false} name="predicted" />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#9ca3af', fontSize: '14px' }}>
          Select a product and store, then click Run Forecast
        </div>
      )}
    </div>
  )
}

const selectStyle = {
  padding: '7px 10px', borderRadius: '8px', border: '1px solid #e5e7eb',
  fontSize: '13px', color: '#374151', background: '#fff', cursor: 'pointer',
}

export default ForecastChart