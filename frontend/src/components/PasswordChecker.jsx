import { useState } from 'react';

export default function PasswordChecker() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { leaked: boolean, count: number }
  const [error, setError] = useState(null);

  const checkBreach = async () => {
    if (!password || password.length < 4) {
      setError('Enter a password to check.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('https://xatlas-api.onrender.com/api/security/check-leak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success) {
        setResult({ leaked: data.leaked, count: data.count || 0 });
      } else {
        setError(data.message || 'Check failed. Try again.');
      }
    } catch (e) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Button */}
      <button
        style={{
          cursor: 'default',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          color: '#ef4444',
          fontWeight: 'bold',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        <span style={{ fontSize: '1rem' }}>🔓</span>
        BREACH CHECKER
      </button>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password to check..."
        onKeyDown={(e) => e.key === 'Enter' && checkBreach()}
        style={{
          width: '100%',
          padding: '10px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid #333',
          color: '#fff',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          boxSizing: 'border-box',
          marginBottom: '10px'
        }}
      />

      <button
        onClick={checkBreach}
        disabled={loading || !password}
        style={{
          width: '100%',
          padding: '10px',
          background: loading ? '#555' : '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !password ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          transition: 'all 0.2s'
        }}
      >
        {loading ? '🔍 SCANNING BREACH DB...' : 'CHECK FOR LEAKS'}
      </button>

      {/* Result Display */}
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          color: '#ef4444',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.85rem',
          border: '1px solid',
          background: result.leaked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          borderColor: result.leaked ? '#ef4444' : '#10b981',
          color: result.leaked ? '#ef4444' : '#10b981',
          animation: 'fadeIn 0.3s ease'
        }}>
          {result.leaked ? (
            <>
              ⚠️ COMPROMISED<br/>
              <span style={{ fontSize: '0.75rem', fontWeight: 'normal', display: 'block', marginTop: '4px' }}>
                Found in {result.count.toLocaleString()} public breaches. Change immediately.
              </span>
            </>
          ) : (
            <>
              ✅ SAFE<br/>
              <span style={{ fontSize: '0.75rem', fontWeight: 'normal', display: 'block', marginTop: '4px' }}>
                No public breaches found for this password.
              </span>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}