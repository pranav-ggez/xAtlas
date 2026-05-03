import { useState } from 'react';

// URLhaus (abuse.ch) — free, no key, POST API, CORS-open
const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1/url/';

function cleanURL(input) {
  let url = input.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  try { return new URL(url); } catch { return null; }
}

function StatusBadge({ label, status, good, bad, neutral }) {
  const color = status === good ? '#10b981' : status === bad ? '#ef4444' : '#fbbf24';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #0d0d0d' }}>
      <span style={{ color: '#888', fontSize: '0.72rem' }}>{label}</span>
      <span style={{
        background: `${color}15`, border: `1px solid ${color}40`,
        color, padding: '2px 9px', borderRadius: '3px',
        fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.3px'
      }}>{status}</span>
    </div>
  );
}

export default function URLSafetyChecker() {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const check = async () => {
    const parsed = cleanURL(input);
    if (!parsed) { setError('Enter a valid URL.'); return; }
    setLoading(true); setError(null); setResult(null);

    const domain   = parsed.hostname;
    const isHTTPS  = parsed.protocol === 'https:';
    const fullURL  = parsed.toString();

    // Run checks in parallel
    const [urlhausResult, dnsResult] = await Promise.allSettled([
      // 1. URLhaus blacklist check
      fetch(URLHAUS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(fullURL)}`
      }).then(r => r.json()),

      // 2. DNS resolution check via Google DNS-over-HTTPS
      fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`)
        .then(r => r.json())
    ]);

    // Parse URLhaus
    let blacklisted = false;
    let urlhausData = null;
    if (urlhausResult.status === 'fulfilled') {
      const uh = urlhausResult.value;
      if (uh.query_status === 'is_spam' || uh.query_status === 'listed') {
        blacklisted = true;
        urlhausData = {
          status: uh.url_status,
          threat: uh.threat,
          tags: uh.tags || [],
          dateAdded: uh.date_added,
          reporter: uh.reporter,
        };
      }
    }

    // Parse DNS
    let resolves = false;
    let ips = [];
    if (dnsResult.status === 'fulfilled' && dnsResult.value.Status === 0) {
      const answers = dnsResult.value.Answer || [];
      ips = answers.filter(a => a.type === 1).map(a => a.data);
      resolves = ips.length > 0;
    }

    // Determine overall risk
    const riskLevel = blacklisted ? 'DANGEROUS'
      : !isHTTPS ? 'UNSAFE'
      : !resolves ? 'SUSPICIOUS'
      : 'LIKELY SAFE';

    const riskColor = {
      'DANGEROUS': '#ef4444',
      'UNSAFE': '#f97316',
      'SUSPICIOUS': '#fbbf24',
      'LIKELY SAFE': '#10b981'
    }[riskLevel];

    setResult({ domain, isHTTPS, fullURL, resolves, ips, blacklisted, urlhausData, riskLevel, riskColor });
    setLoading(false);
  };

  const r = result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="https://example.com or domain.com"
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#ef4444'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={check} disabled={loading || !input} style={{
          background: loading || !input ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.2)',
          border: '1px solid #ef444450', color: loading || !input ? '#6a1a1a' : '#ef4444',
          padding: '8px 14px', borderRadius: '6px',
          cursor: loading || !input ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : 'Scan'}
        </button>
      </div>

      <div style={{ color: '#2a3a2a', fontSize: '0.6rem' }}>
        Sources: URLhaus (abuse.ch blacklist) · Google DNS-over-HTTPS · Browser HTTPS detection
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', color: '#ef4444', fontSize: '0.72rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#555', fontSize: '0.75rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #ef444425', borderTopColor: '#ef4444', animation: 'urlspin 0.7s linear infinite' }} />
          Checking URL against threat databases…
          <style>{`@keyframes urlspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {r && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Risk banner */}
          <div style={{
            background: `${r.riskColor}08`, border: `1px solid ${r.riskColor}30`,
            borderRadius: '8px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{ fontSize: '1.6rem' }}>
              {r.riskLevel === 'DANGEROUS' ? '🚨' : r.riskLevel === 'UNSAFE' ? '⚠️' : r.riskLevel === 'SUSPICIOUS' ? '🔶' : '✅'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: r.riskColor, fontWeight: 'bold', fontSize: '0.88rem', letterSpacing: '0.5px' }}>{r.riskLevel}</div>
              <div style={{ color: '#666', fontSize: '0.68rem', marginTop: '2px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fullURL}</div>
            </div>
          </div>

          {/* Checks */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', padding: '4px 12px 8px' }}>
            <StatusBadge label="Protocol" status={r.isHTTPS ? 'HTTPS ✓' : 'HTTP — Unencrypted'} good="HTTPS ✓" bad="HTTP — Unencrypted" />
            <StatusBadge label="DNS Resolution" status={r.resolves ? `Resolves (${r.ips[0] || '?'})` : 'No DNS record'} good={r.resolves ? `Resolves (${r.ips[0] || '?'})` : ''} bad="No DNS record" />
            <StatusBadge label="URLhaus Blacklist" status={r.blacklisted ? 'LISTED — Malicious' : 'Not listed'} good="Not listed" bad="LISTED — Malicious" />
          </div>

          {/* URLhaus threat detail */}
          {r.blacklisted && r.urlhausData && (
            <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444428', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.6rem', color: '#ef4444', letterSpacing: '1px', marginBottom: '8px' }}>THREAT DETAIL (URLhaus)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'STATUS', value: r.urlhausData.status },
                  { label: 'THREAT TYPE', value: r.urlhausData.threat },
                  { label: 'REPORTED BY', value: r.urlhausData.reporter },
                  { label: 'DATE ADDED', value: r.urlhausData.dateAdded },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '0.58rem', color: '#446644', letterSpacing: '0.5px' }}>{f.label}</div>
                    <div style={{ color: '#ef9999', fontSize: '0.72rem', fontFamily: 'monospace' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {r.urlhausData.tags?.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {r.urlhausData.tags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444425', color: '#ef9999', padding: '1px 7px', borderRadius: '3px', fontSize: '0.62rem' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ color: '#282828', fontSize: '0.6rem', textAlign: 'center' }}>
            URLhaus · abuse.ch · Google DNS · For informational purposes only
          </div>
        </div>
      )}
    </div>
  );
}