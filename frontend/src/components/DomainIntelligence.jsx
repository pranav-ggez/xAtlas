import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://xatlas-api.onrender.com';

function cleanDomain(input) {
  return input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();
}

function scoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 50) return '#fbbf24';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

function scoreLabel(score) {
  if (score >= 80) return 'HEALTHY';
  if (score >= 50) return 'MODERATE RISK';
  if (score >= 25) return 'HIGH RISK';
  return 'CRITICAL';
}

// Fetch DNS via your existing backend endpoint
async function fetchDNS(domain) {
  const res = await fetch(`${API_BASE}/api/security/recon/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'dns_lookup', domain })
  });
  const data = await res.json();
  return data.success ? data.output : null;
}

// Check domain against ThreatFox IOC list via your existing backend endpoint
async function checkThreatFox(domain) {
  try {
    const res = await fetch(`${API_BASE}/api/security/threatfox/latest?limit=50`);
    if (!res.ok) return { found: false, iocs: [] };
    const data = await res.json();
    const iocs = (data.data || []).filter(item => {
      const ioc = (item.ioc || '').toLowerCase();
      return ioc.includes(domain.toLowerCase());
    });
    return { found: iocs.length > 0, iocs };
  } catch { return { found: false, iocs: [] }; }
}

// Check SSL certificate via public API (no backend needed)
async function checkSSL(domain) {
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://ssl-checker.io/api/v1/check/${domain}`)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch { return null; }
}

// Check domain against breach data via HIBP domain search (public endpoint, no key)
async function checkDomainBreaches(domain) {
  try {
    // HIBP has a public breaches endpoint filtered by domain
    const res = await fetch(`https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`, {
      headers: { 'User-Agent': 'xAtlas-OSINT' }
    });
    if (res.status === 404) return [];
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function InfoRow({ label, value, status, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
      <span style={{ color: '#888', fontSize: '0.75rem' }}>{label}</span>
      <span style={{ color: color || (status === 'good' ? '#10b981' : status === 'warn' ? '#fbbf24' : status === 'bad' ? '#ef4444' : '#ccc'), fontWeight: 'bold', fontSize: '0.75rem' }}>
        {value}
      </span>
    </div>
  );
}

export default function DomainIntelligence() {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError]     = useState(null);

  const analyze = async () => {
    const domain = cleanDomain(input);
    if (!domain || domain.length < 3) { setError('Enter a valid domain name.'); return; }
    setLoading(true); setError(null); setResult(null);

    try {
      // Run all checks in parallel where possible
      setProgress('Resolving DNS…');
      const [dnsResult, threatResult, domainBreaches] = await Promise.all([
        fetchDNS(domain),
        checkThreatFox(domain),
        checkDomainBreaches(domain),
      ]);

      setProgress('Checking SSL…');
      const sslResult = await checkSSL(domain);

      // Calculate health score (0-100)
      // Start at 100, deduct for each risk signal
      let score = 100;
      const findings = [];

      // DNS
      if (!dnsResult) {
        score -= 30;
        findings.push({ type: 'bad', label: 'DNS Resolution Failed', detail: 'Domain does not resolve to any IP address.' });
      } else {
        findings.push({ type: 'good', label: 'DNS Resolves', detail: dnsResult });
      }

      // ThreatFox
      if (threatResult.found) {
        score -= 40;
        findings.push({ type: 'bad', label: `Found in ThreatFox IOC Database`, detail: `${threatResult.iocs.length} indicator(s) of compromise matching this domain.` });
      } else {
        findings.push({ type: 'good', label: 'Not in ThreatFox IOC Database', detail: 'No known malicious indicators.' });
      }

      // HIBP domain breaches
      if (domainBreaches === null) {
        findings.push({ type: 'warn', label: 'HIBP Domain Check Unavailable', detail: 'Could not reach breach database.' });
      } else if (Array.isArray(domainBreaches) && domainBreaches.length > 0) {
        score -= Math.min(25, domainBreaches.length * 8);
        findings.push({ type: 'bad', label: `${domainBreaches.length} Known Breach${domainBreaches.length > 1 ? 'es' : ''} via HIBP`, detail: domainBreaches.map(b => b.Name || b.Title).join(', ') });
      } else {
        findings.push({ type: 'good', label: 'No Known Breaches (HIBP)', detail: 'Domain not associated with any known data breaches.' });
      }

      // SSL
      if (!sslResult) {
        score -= 5; // mild penalty for unknown SSL
        findings.push({ type: 'warn', label: 'SSL Status Unknown', detail: 'Could not verify SSL certificate.' });
      } else if (sslResult.valid === false) {
        score -= 20;
        findings.push({ type: 'bad', label: 'SSL Certificate Invalid', detail: sslResult.error || 'Certificate validation failed.' });
      } else if (sslResult.days_remaining && sslResult.days_remaining < 14) {
        score -= 10;
        findings.push({ type: 'warn', label: `SSL Expiring in ${sslResult.days_remaining} days`, detail: 'Certificate expiry imminent.' });
      } else {
        findings.push({ type: 'good', label: 'SSL Certificate Valid', detail: sslResult.days_remaining ? `${sslResult.days_remaining} days remaining` : 'Valid' });
      }

      score = Math.max(0, Math.min(100, score));

      setResult({
        domain,
        score,
        findings,
        dns: dnsResult,
        threatFox: threatResult,
        ssl: sslResult,
        breaches: Array.isArray(domainBreaches) ? domainBreaches : []
      });
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const res = result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
          🌐 Domain Intelligence Report
        </div>
        <div style={{ color: '#446644', fontSize: '0.72rem', lineHeight: '1.5' }}>
          Enter any domain to get a unified intelligence report — DNS resolution, ThreatFox IOC check, HIBP breach history, and SSL health — combined into a single Domain Health Score.
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="example.com"
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={analyze} disabled={loading || !input} style={{
          background: loading || !input ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.2)',
          border: '1px solid #3b82f650', color: loading || !input ? '#1a3a6a' : '#3b82f6',
          padding: '9px 16px', borderRadius: '6px', cursor: loading || !input ? 'not-allowed' : 'pointer',
          fontSize: '0.78rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : '🔍 Analyze'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444428', borderRadius: '6px', padding: '10px 12px', color: '#ef4444', fontSize: '0.78rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #3b82f625', borderTopColor: '#3b82f6', animation: 'spindo 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ color: '#666', fontSize: '0.78rem' }}>{progress || 'Running intelligence checks…'}</span>
          <style>{`@keyframes spindo{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {res && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Score card */}
          <div style={{
            background: `${scoreColor(res.score)}08`,
            border: `1px solid ${scoreColor(res.score)}30`,
            borderRadius: '10px', padding: '20px',
            display: 'flex', alignItems: 'center', gap: '20px'
          }}>
            {/* Score ring */}
            <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
              <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="#111" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none"
                  stroke={scoreColor(res.score)} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - res.score / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: scoreColor(res.score), fontWeight: 'bold', fontSize: '1rem' }}>{res.score}</span>
              </div>
            </div>
            <div>
              <div style={{ color: scoreColor(res.score), fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px' }}>
                {scoreLabel(res.score)}
              </div>
              <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '2px' }}>{res.domain}</div>
              <div style={{ color: '#555', fontSize: '0.65rem', marginTop: '4px' }}>
                Domain Health Score · {res.findings.length} signals analyzed
              </div>
            </div>
          </div>

          {/* Findings */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #111', fontSize: '0.65rem', color: '#446644', letterSpacing: '1px' }}>
              INTELLIGENCE FINDINGS
            </div>
            <div style={{ padding: '4px 14px 8px' }}>
              {res.findings.map((f, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < res.findings.length - 1 ? '1px solid #0d0d0d' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span>{f.type === 'good' ? '✅' : f.type === 'warn' ? '⚠️' : '🚨'}</span>
                    <span style={{
                      color: f.type === 'good' ? '#10b981' : f.type === 'warn' ? '#fbbf24' : '#ef4444',
                      fontWeight: 'bold', fontSize: '0.75rem'
                    }}>{f.label}</span>
                  </div>
                  {f.detail && <div style={{ color: '#666', fontSize: '0.68rem', lineHeight: '1.4', paddingLeft: '24px' }}>{f.detail}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Breach details if any */}
          {res.breaches.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid #ef444420', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.65rem', color: '#ef4444', letterSpacing: '1px', marginBottom: '8px' }}>ASSOCIATED BREACHES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {res.breaches.map((b, i) => (
                  <span key={i} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444430', color: '#ef9999', padding: '2px 10px', borderRadius: '4px', fontSize: '0.7rem' }}>
                    {b.Name || b.Title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ color: '#282828', fontSize: '0.6rem', textAlign: 'center' }}>
            Sources: Your backend (DNS) · ThreatFox (IOC) · HIBP (breaches) · SSL Checker · Score is indicative, not a guarantee
          </div>
        </div>
      )}
    </div>
  );
}