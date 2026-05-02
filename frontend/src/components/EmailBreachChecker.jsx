import { useState } from 'react';

// FIXED: Always point to Render backend explicitly.
// Empty string caused Vercel 404s to be misread as "no breaches found".
const API_BASE = import.meta.env.VITE_API_URL || 'https://xatlas-api.onrender.com';

function getSeverityColor(count) {
  if (count === 0) return '#10b981';
  if (count <= 3)  return '#fbbf24';
  if (count <= 8)  return '#f97316';
  return '#ef4444';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const d = new Date(dateStr);
    const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (years < 1) return 'Less than a year ago';
    return `${years} year${years > 1 ? 's' : ''} ago`;
  } catch { return dateStr; }
}

export default function EmailBreachChecker() {
  const [email, setEmail]       = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const checkEmail = async () => {
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true); setError(null); setResult(null); setExpanded(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(
        `${API_BASE}/api/security/email-breach?email=${encodeURIComponent(email)}`,
        { signal: controller.signal }
      );

      // 404 from HIBP = no breaches (legitimate clean result)
      // BUT only trust this if the response came from our backend (has our content-type)
      if (res.status === 404) {
        const ct = res.headers.get('content-type') || '';
        // If it's JSON, it came from our FastAPI backend — legit clean result
        // If it's HTML, it came from Vercel/CDN — that's a routing error
        if (ct.includes('application/json')) {
          setResult({ breaches: [], email });
        } else {
          setError('Backend unreachable — check that VITE_API_URL is set in your Vercel env vars.');
        }
        return;
      }

      if (res.status === 429) { setError('Rate limit hit. Wait 1–2 minutes.'); return; }
      if (res.status === 503) { setError('HIBP API key not configured on backend. Add HIBP_API_KEY to Render env vars.'); return; }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.message || `API error ${res.status}`);

      setResult({ breaches: data.breaches || [], email });
    } catch (err) {
      if (err.name === 'AbortError') setError('Request timed out. The backend may be cold-starting (Render free tier). Try again in 30s.');
      else setError(`Check failed: ${err.message}`);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const breachCount  = result?.breaches?.length ?? 0;
  const statusColor  = result ? getSeverityColor(breachCount) : '#555';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && checkEmail()}
          placeholder="Enter email address..."
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#f97316'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={checkEmail} disabled={loading || !email} style={{
          background: loading || !email ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.2)',
          border: '1px solid #f9731650', color: loading || !email ? '#664422' : '#f97316',
          padding: '9px 16px', borderRadius: '6px', cursor: loading || !email ? 'not-allowed' : 'pointer',
          fontSize: '0.78rem', fontWeight: 'bold', transition: 'all 0.15s', flexShrink: 0
        }}>
          {loading ? '⟳' : '🔍 Check'}
        </button>
      </div>

      <div style={{ color: '#334433', fontSize: '0.62rem', lineHeight: '1.4' }}>
        🔒 Checked via your private backend against Have I Been Pwned. Never stored or logged.
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444428', borderRadius: '6px', padding: '10px 12px', color: '#ef4444', fontSize: '0.78rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #f9731625', borderTopColor: '#f97316', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ color: '#666', fontSize: '0.78rem' }}>Querying breach database…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: `${statusColor}0e`, border: `1px solid ${statusColor}35`, borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem' }}>{breachCount === 0 ? '✅' : breachCount <= 3 ? '⚠️' : '🚨'}</span>
            <div>
              <div style={{ color: statusColor, fontWeight: 'bold', fontSize: '0.9rem' }}>
                {breachCount === 0 ? 'No breaches found' : `Found in ${breachCount} breach${breachCount > 1 ? 'es' : ''}`}
              </div>
              <div style={{ color: '#556655', fontSize: '0.68rem', marginTop: '2px' }}>{result.email}</div>
            </div>
            {breachCount > 0 && (
              <div style={{ marginLeft: 'auto', textAlign: 'center', background: `${statusColor}18`, border: `1px solid ${statusColor}40`, borderRadius: '6px', padding: '8px 14px' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: statusColor }}>{breachCount}</div>
                <div style={{ fontSize: '0.58rem', color: '#666' }}>BREACHES</div>
              </div>
            )}
          </div>

          {breachCount > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid #ef444420', borderRadius: '6px', padding: '10px 12px', color: '#cc8888', fontSize: '0.72rem', lineHeight: '1.5' }}>
              🔑 <strong style={{ color: '#ef9999' }}>Recommended:</strong> Change passwords for affected services below. Enable 2FA. Use unique passwords per service.
            </div>
          )}

          {breachCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {result.breaches.map((breach, i) => {
                const isExp = expanded === i;
                const bColor = getSeverityColor(breach.PwnCount > 1000000 ? 10 : breach.PwnCount > 100000 ? 5 : 2);
                const logoSrc = breach.LogoPath?.startsWith('http') ? breach.LogoPath : `https://haveibeenpwned.com${breach.LogoPath}`;
                const cleanDesc = breach.Description ? breach.Description.replace(/<[^>]*>/g, '').slice(0, 300) : '';
                return (
                  <div key={breach.Name || i} onClick={() => setExpanded(isExp ? null : i)} style={{
                    background: isExp ? `${bColor}08` : 'rgba(0,0,0,0.35)',
                    border: `1px solid ${isExp ? bColor + '40' : '#141414'}`,
                    borderLeft: `3px solid ${bColor}`, borderRadius: '6px',
                    padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {breach.LogoPath && <img src={logoSrc} alt={breach.Name} style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'contain', background: '#fff', padding: '1px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
                      <span style={{ color: '#ddd', fontWeight: 'bold', fontSize: '0.82rem', flex: 1 }}>{breach.Name}</span>
                      <span style={{ color: '#555', fontSize: '0.62rem' }}>{timeAgo(breach.BreachDate)}</span>
                      <span style={{ color: '#333', fontSize: '0.65rem' }}>{isExp ? '▲' : '▼'}</span>
                    </div>
                    {breach.DataClasses && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {breach.DataClasses.slice(0, isExp ? 999 : 4).map(dc => (
                          <span key={dc} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444425', color: '#ef9999', padding: '1px 7px', borderRadius: '3px', fontSize: '0.6rem' }}>{dc}</span>
                        ))}
                        {!isExp && breach.DataClasses.length > 4 && <span style={{ color: '#555', fontSize: '0.6rem', padding: '2px 4px' }}>+{breach.DataClasses.length - 4} more</span>}
                      </div>
                    )}
                    {isExp && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1a1a1a' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          {[
                            { label: 'BREACH DATE', value: breach.BreachDate || '—' },
                            { label: 'ACCOUNTS AFFECTED', value: breach.PwnCount?.toLocaleString() || '—', color: bColor },
                            { label: 'VERIFIED', value: breach.IsVerified ? '✅ Yes' : '⚠️ Unverified' },
                            { label: 'SENSITIVE', value: breach.IsSensitive ? '🔴 Yes' : 'No' }
                          ].map(f => (
                            <div key={f.label}>
                              <div style={{ fontSize: '0.58rem', color: '#446644', letterSpacing: '1px' }}>{f.label}</div>
                              <div style={{ color: f.color || '#ccc', fontSize: '0.75rem', fontWeight: f.color ? 'bold' : 'normal' }}>{f.value}</div>
                            </div>
                          ))}
                        </div>
                        {cleanDesc && <div style={{ color: '#888', fontSize: '0.72rem', lineHeight: '1.5', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '8px' }}>{cleanDesc}…</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {breachCount === 0 && (
            <div style={{ color: '#446644', fontSize: '0.72rem', textAlign: 'center', padding: '8px' }}>
              This email hasn't appeared in any known data breaches. Stay safe — use unique passwords and enable 2FA everywhere.
            </div>
          )}
        </div>
      )}
    </div>
  );
}