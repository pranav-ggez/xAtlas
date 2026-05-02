import { useState } from 'react';

// crt.sh — free, no API key, CORS-open
// Returns certificate transparency log entries for a domain
const CRTSH_API = 'https://crt.sh/?q=';

// SSL Labs public API — free, no key (slow, async grading)
// We use a lightweight alternative: ssl-checker via our own proxy isn't viable
// Instead we fetch cert info from crt.sh JSON and parse it client-side
// For live TLS handshake info we use the badssl.com-style approach via fetch metadata

function cleanDomain(input) {
  return input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();
}

function Row({ label, value, mono, color }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #0d0d0d', alignItems: 'flex-start' }}>
      <span style={{ color: '#5a4a7a', fontSize: '0.65rem', letterSpacing: '0.5px', minWidth: '120px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
      <span style={{ color: color || '#ccc', fontSize: '0.72rem', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: '1.4', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr) - Date.now()) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}

export default function SSLInspector() {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [certs, setCerts]     = useState([]);
  const [showAll, setShowAll] = useState(false);

  const lookup = async () => {
    const domain = cleanDomain(input);
    if (!domain || domain.length < 3) { setError('Enter a valid domain.'); return; }
    setLoading(true); setError(null); setResult(null); setCerts([]); setShowAll(false);

    try {
      // crt.sh JSON API — returns all cert transparency logs for domain
      const res = await fetch(`${CRTSH_API}${encodeURIComponent(domain)}&output=json`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
      const data = await res.json();

      if (!data || data.length === 0) {
        setResult({ domain, empty: true });
        return;
      }

      // Deduplicate by serial number, sort by not_after descending
      const seen = new Set();
      const unique = data
        .filter(c => { const key = c.serial_number || c.id; if (seen.has(key)) return false; seen.add(key); return true; })
        .sort((a, b) => new Date(b.not_after) - new Date(a.not_after));

      // Most recent (likely active) cert
      const latest = unique[0];
      const days   = daysUntil(latest.not_after);

      // Parse SANs from name_value (newline/space separated)
      const sans = [...new Set(
        (latest.name_value || '').split(/[\n\s,]+/).map(s => s.trim()).filter(Boolean)
      )];

      // Check if wildcard
      const hasWildcard = sans.some(s => s.startsWith('*'));

      // Issuer parsing
      const issuerRaw = latest.issuer_name || '';
      const issuerCN  = issuerRaw.match(/CN=([^,]+)/)?.[1]?.trim() || issuerRaw;
      const issuerOrg = issuerRaw.match(/O=([^,]+)/)?.[1]?.trim() || null;

      setResult({
        domain,
        latest,
        days,
        sans,
        hasWildcard,
        issuerCN,
        issuerOrg,
        totalCerts: unique.length,
      });
      setCerts(unique.slice(0, 20));
    } catch (err) {
      setError(`Lookup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const r = result;

  const expiryColor = (days) => {
    if (days === null) return '#888';
    if (days < 0)   return '#ef4444';
    if (days < 14)  return '#ef4444';
    if (days < 30)  return '#f97316';
    if (days < 60)  return '#fbbf24';
    return '#10b981';
  };

  const expiryLabel = (days) => {
    if (days === null) return 'Unknown';
    if (days < 0)     return `Expired ${Math.abs(days)} days ago`;
    if (days === 0)   return 'Expires today';
    return `${days} days remaining`;
  };

  const trustColor = r ? expiryColor(r.days) : '#888';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="github.com"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.5)',
            border: '1px solid #1e1a2e', borderRadius: '6px',
            padding: '8px 10px', color: '#fff', fontSize: '0.8rem',
            outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s'
          }}
          onFocus={e => e.target.style.borderColor = '#8b5cf6'}
          onBlur={e => e.target.style.borderColor = '#1e1a2e'}
        />
        <button onClick={lookup} disabled={loading || !input} style={{
          background: loading || !input ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.2)',
          border: '1px solid #8b5cf650',
          color: loading || !input ? '#3a2060' : '#8b5cf6',
          padding: '8px 14px', borderRadius: '6px',
          cursor: loading || !input ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : 'Inspect'}
        </button>
      </div>

      <div style={{ color: '#2a2a2a', fontSize: '0.6rem' }}>
        Source: crt.sh Certificate Transparency · Free, no key · Cert expiry, SANs, issuer
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', color: '#ef4444', fontSize: '0.72rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#555', fontSize: '0.75rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #8b5cf625', borderTopColor: '#8b5cf6', animation: 'sslspin 0.7s linear infinite' }} />
          Querying Certificate Transparency logs…
          <style>{`@keyframes sslspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {r && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {r.empty ? (
            <div style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #111' }}>
              No certificates found in CT logs for <span style={{ color: '#8b5cf6', fontFamily: 'monospace' }}>{r.domain}</span>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div style={{
                background: `${trustColor}08`, border: `1px solid ${trustColor}30`,
                borderRadius: '8px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{ fontSize: '1.4rem' }}>
                  {r.days < 0 ? '🔴' : r.days < 30 ? '⚠️' : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '0.82rem', fontFamily: 'monospace' }}>{r.domain}</div>
                  <div style={{ color: trustColor, fontSize: '0.68rem', marginTop: '2px', letterSpacing: '0.5px' }}>
                    {expiryLabel(r.days)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {r.hasWildcard && (
                    <span style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf2440', color: '#fbbf24', padding: '2px 8px', borderRadius: '3px', fontSize: '0.6rem', fontWeight: 'bold' }}>WILDCARD</span>
                  )}
                  <span style={{ background: `${trustColor}15`, border: `1px solid ${trustColor}40`, color: trustColor, padding: '2px 8px', borderRadius: '3px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                    {r.days < 0 ? 'EXPIRED' : r.days < 30 ? 'EXPIRING SOON' : 'VALID'}
                  </span>
                  <span style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid #8b5cf630', color: '#8b5cf6', padding: '2px 8px', borderRadius: '3px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                    {r.totalCerts} CERTS
                  </span>
                </div>
              </div>

              {/* Latest cert details */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.05)', borderBottom: '1px solid #111' }}>
                  <span style={{ color: '#5a4a7a', fontSize: '0.6rem', letterSpacing: '1px' }}>LATEST CERTIFICATE</span>
                </div>
                <div style={{ padding: '4px 12px 8px' }}>
                  <Row label="ISSUER"      value={r.issuerCN} />
                  <Row label="ISSUED BY"   value={r.issuerOrg} />
                  <Row label="VALID FROM"  value={formatDate(r.latest.not_before)} />
                  <Row label="EXPIRES"     value={formatDate(r.latest.not_after)} color={expiryColor(r.days)} />
                  <Row label="SERIAL"      value={r.latest.serial_number} mono />
                  <Row label="LOG ID"      value={r.latest.id?.toString()} mono />
                </div>
              </div>

              {/* SANs */}
              {r.sans.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#5a4a7a', letterSpacing: '1px', marginBottom: '8px' }}>
                    SUBJECT ALT NAMES ({r.sans.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {r.sans.slice(0, showAll ? undefined : 12).map(san => (
                      <span key={san} style={{
                        background: san.startsWith('*') ? 'rgba(251,191,36,0.08)' : 'rgba(139,92,246,0.08)',
                        border: `1px solid ${san.startsWith('*') ? '#fbbf2430' : '#8b5cf625'}`,
                        color: san.startsWith('*') ? '#fbbf24' : '#a78bfa',
                        padding: '2px 7px', borderRadius: '3px',
                        fontSize: '0.62rem', fontFamily: 'monospace'
                      }}>{san}</span>
                    ))}
                    {r.sans.length > 12 && !showAll && (
                      <button onClick={() => setShowAll(true)} style={{
                        background: 'rgba(139,92,246,0.1)', border: '1px solid #8b5cf630',
                        color: '#8b5cf6', padding: '2px 8px', borderRadius: '3px',
                        fontSize: '0.62rem', cursor: 'pointer'
                      }}>+{r.sans.length - 12} more</button>
                    )}
                  </div>
                </div>
              )}

              {/* Cert history */}
              {certs.length > 1 && (
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#5a4a7a', letterSpacing: '1px', marginBottom: '8px' }}>
                    CERTIFICATE HISTORY (last {certs.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '130px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#8b5cf6 #111' }}>
                    {certs.map((c, i) => {
                      const d = daysUntil(c.not_after);
                      const col = expiryColor(d);
                      return (
                        <div key={c.id || i} style={{
                          display: 'flex', gap: '8px', alignItems: 'center',
                          padding: '4px 0', borderBottom: '1px solid #0d0d0d'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: col, flexShrink: 0 }} />
                          <span style={{ color: '#555', fontSize: '0.6rem', fontFamily: 'monospace', minWidth: '90px' }}>
                            {formatDate(c.not_before)}
                          </span>
                          <span style={{ color: '#333', fontSize: '0.58rem' }}>→</span>
                          <span style={{ color: col, fontSize: '0.6rem', fontFamily: 'monospace' }}>
                            {formatDate(c.not_after)}
                          </span>
                          <span style={{ color: '#2a2a2a', fontSize: '0.58rem', marginLeft: 'auto', fontFamily: 'monospace' }}>
                            #{c.id}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ color: '#282828', fontSize: '0.58rem', textAlign: 'center' }}>
            crt.sh · Certificate Transparency Logs · For informational purposes only
          </div>
        </div>
      )}
    </div>
  );
}