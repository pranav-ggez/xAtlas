import { useState } from 'react'

export default function SecurityPanel() {
  const [domain, setDomain] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const runRecon = async () => {
    if (!domain) return
    setLoading(true)
    setResult('Running scan...')
    
    try {
      const res = await fetch('/api/security/recon/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'dns_lookup', domain })
      })
      const data = await res.json()
      setResult(data.success ? `✅ IP: ${data.output.trim()}` : `❌ Error: ${data.output}`)
    } catch (e) {
      setResult('❌ Connection Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(10, 10, 10, 0.9)',
      backdropFilter: 'blur(10px)',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #333',
      boxShadow: '0 0 15px rgba(0,0,0,0.5)'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        color: '#3b82f6', 
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        ⚡ Safe Recon Terminal
      </h3>
      
      <p style={{ 
        fontSize: '0.7rem', 
        color: '#888', 
        marginBottom: '10px',
        lineHeight: '1.3'
      }}>
        Execute pre-approved DNS lookup safely.
      </p>
      
      <input 
        value={domain} 
        onChange={(e) => setDomain(e.target.value)} 
        placeholder="google.com" 
        style={{
          width: '100%', 
          padding: '8px', 
          marginBottom: '8px', 
          background: '#222', 
          border: '1px solid #444', 
          color: '#fff',
          borderRadius: '4px', 
          boxSizing: 'border-box',
          fontSize: '0.85rem',
          fontFamily: 'monospace'
        }} 
      />
      
      <button 
        onClick={runRecon} 
        disabled={loading}
        style={{
          width: '100%', 
          padding: '8px', 
          background: loading ? '#555' : '#3b82f6', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '0.8rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.background = '#2563eb'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.background = '#3b82f6'
          }
        }}
      >
        {loading ? 'Scanning...' : 'Run DNS Lookup'}
      </button>
      
      {result && (
        <pre style={{
          marginTop: '10px', 
          fontSize: '0.75rem', 
          color: result.includes('✅') ? '#10b981' : '#ef4444',
          background: 'rgba(0,0,0,0.5)', 
          padding: '8px', 
          borderRadius: '4px', 
          whiteSpace: 'pre-wrap',
          margin: '10px 0 0 0',
          fontFamily: 'monospace'
        }}>
          {result}
        </pre>
      )}
    </div>
  )
}