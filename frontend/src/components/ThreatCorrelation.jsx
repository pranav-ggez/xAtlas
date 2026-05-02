import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://xatlas-api.onrender.com';
const NVD_API  = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

// Known vendor/product keywords to search NVD with per breached service
// Expanded over time as more breaches are known
const SERVICE_CVE_MAP = {
  'adobe':       ['Adobe', 'Acrobat', 'Photoshop', 'ColdFusion'],
  'linkedin':    ['LinkedIn'],
  'dropbox':     ['Dropbox'],
  'lastpass':    ['LastPass'],
  'twitter':     ['Twitter', 'X Corp'],
  'facebook':    ['Facebook', 'Meta'],
  'google':      ['Google', 'Android', 'Chrome'],
  'microsoft':   ['Microsoft', 'Windows', 'Azure'],
  'yahoo':       ['Yahoo'],
  'ebay':        ['eBay'],
  'uber':        ['Uber'],
  'slack':       ['Slack'],
  'zoom':        ['Zoom'],
  'github':      ['GitHub'],
  'gitlab':      ['GitLab'],
  'wordpress':   ['WordPress'],
  'apache':      ['Apache'],
  'nginx':       ['nginx'],
  'nodejs':      ['Node.js', 'nodejs'],
  'mongodb':     ['MongoDB'],
  'mysql':       ['MySQL'],
  'oracle':      ['Oracle'],
  'samsung':     ['Samsung'],
  'apple':       ['Apple', 'iOS', 'macOS', 'Safari'],
  'sony':        ['Sony'],
  'steam':       ['Steam', 'Valve'],
  'twitch':      ['Twitch', 'Amazon'],
  'canva':       ['Canva'],
  'trello':      ['Trello', 'Atlassian'],
  'jira':        ['Jira', 'Atlassian'],
  'confluence':  ['Confluence', 'Atlassian'],
  'mailchimp':   ['Mailchimp'],
  'hubspot':     ['HubSpot'],
  'shopify':     ['Shopify'],
  'stripe':      ['Stripe'],
  'paypal':      ['PayPal'],
  'cashapp':     ['Cash App', 'Square'],
  'snapchat':    ['Snapchat'],
  'tiktok':      ['TikTok', 'ByteDance'],
  'reddit':      ['Reddit'],
  'discord':     ['Discord'],
  'twilio':      ['Twilio'],
  'okta':        ['Okta'],
  'cloudflare':  ['Cloudflare'],
  'fortinet':    ['Fortinet', 'FortiOS'],
  'cisco':       ['Cisco'],
  'vmware':      ['VMware'],
  'citrix':      ['Citrix'],
  'solarwinds':  ['SolarWinds'],
  'pulse':       ['Pulse Secure', 'Ivanti'],
};

function getKeywordsForBreach(breachName) {
  const lower = breachName.toLowerCase().replace(/\s/g, '');
  for (const [key, terms] of Object.entries(SERVICE_CVE_MAP)) {
    if (lower.includes(key)) return terms;
  }
  // Fallback: use the breach name itself
  return [breachName.split(' ')[0]];
}

function getCVSSColor(score) {
  if (!score) return '#888';
  if (score >= 9.0) return '#ef4444';
  if (score >= 7.0) return '#f97316';
  if (score >= 4.0) return '#fbbf24';
  return '#10b981';
}

function getCVSSLabel(score) {
  if (!score) return 'N/A';
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  return 'LOW';
}

function extractScore(metrics) {
  try {
    return (
      metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ??
      metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ??
      metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ??
      null
    );
  } catch { return null; }
}

async function fetchCVEsForKeyword(keyword) {
  const url = `${NVD_API}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=5&startIndex=0`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.vulnerabilities || []).map(item => {
    const vuln = item.cve;
    const score = extractScore(vuln.metrics);
    const desc = vuln.descriptions?.find(d => d.lang === 'en')?.value || '';
    return {
      id: vuln.id,
      score,
      label: getCVSSLabel(score),
      desc: desc.length > 120 ? desc.slice(0, 120) + '…' : desc,
      published: vuln.published ? new Date(vuln.published).toLocaleDateString() : '—',
      url: `https://nvd.nist.gov/vuln/detail/${vuln.id}`
    };
  }).filter(c => c.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

// ── Single breach correlation card ─────────────────────────────────────────
function BreachCorrelationCard({ breach, index }) {
  const [cves, setCves]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const bColor = breach.PwnCount > 1000000 ? '#ef4444' : breach.PwnCount > 100000 ? '#f97316' : '#fbbf24';
  const logoSrc = breach.LogoPath?.startsWith('http') ? breach.LogoPath : `https://haveibeenpwned.com${breach.LogoPath}`;

  const loadCVEs = useCallback(async () => {
    if (cves !== null) { setExpanded(e => !e); return; }
    setExpanded(true);
    setLoading(true);
    try {
      const keywords = getKeywordsForBreach(breach.Name);
      // Fetch for primary keyword only to stay within NVD rate limits
      const results = await fetchCVEsForKeyword(keywords[0]);
      setCves(results);
    } catch {
      setCves([]);
    } finally {
      setLoading(false);
    }
  }, [breach.Name, cves]);

  const criticalCVEs = cves?.filter(c => c.label === 'CRITICAL') || [];
  const hasCritical  = criticalCVEs.length > 0;

  return (
    <div style={{
      border: `1px solid ${hasCritical && cves ? '#ef444440' : '#1a1a1a'}`,
      borderLeft: `3px solid ${bColor}`,
      borderRadius: '8px',
      background: hasCritical && cves ? 'rgba(239,68,68,0.04)' : 'rgba(0,0,0,0.4)',
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Breach header */}
      <div
        onClick={loadCVEs}
        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        {breach.LogoPath && (
          <img src={logoSrc} alt={breach.Name}
            style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain', background: '#fff', padding: '1px', flexShrink: 0 }}
            onError={e => e.target.style.display = 'none'} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#ddd', fontWeight: 'bold', fontSize: '0.82rem' }}>{breach.Name}</div>
          <div style={{ color: '#555', fontSize: '0.62rem', marginTop: '2px' }}>
            {breach.PwnCount?.toLocaleString()} accounts · Breached {breach.BreachDate || 'unknown date'}
          </div>
        </div>

        {/* CVE badge — only shows after load */}
        {cves !== null && (
          <div style={{
            background: hasCritical ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${hasCritical ? '#ef444440' : '#10b98130'}`,
            color: hasCritical ? '#ef4444' : '#10b981',
            padding: '2px 8px', borderRadius: '4px',
            fontSize: '0.6rem', fontWeight: 'bold', flexShrink: 0
          }}>
            {cves.length > 0 ? `${cves.length} CVEs` : 'No CVEs'}
            {hasCritical && ` · ${criticalCVEs.length} CRITICAL`}
          </div>
        )}

        <span style={{ color: '#444', fontSize: '0.65rem', flexShrink: 0 }}>
          {loading ? '⟳' : expanded ? '▲' : '▼ Check CVEs'}
        </span>
      </div>

      {/* CVE results panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1a1a1a', background: 'rgba(0,0,0,0.3)' }}>
          {loading && (
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #ef444425', borderTopColor: '#ef4444', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: '#555', fontSize: '0.75rem' }}>Querying NVD for active CVEs…</span>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loading && cves?.length === 0 && (
            <div style={{ padding: '12px 16px', color: '#446644', fontSize: '0.75rem' }}>
              ✅ No CVEs found for this service in the NVD database.
            </div>
          )}

          {!loading && cves?.length > 0 && (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {hasCritical && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', marginBottom: '4px', color: '#ef9999', fontSize: '0.72rem' }}>
                  🚨 <strong style={{ color: '#ef4444' }}>Active critical vulnerabilities exist</strong> in {breach.Name}. If your account was breached, attackers may still have access to vulnerable infrastructure. Change your password immediately.
                </div>
              )}
              {cves.map(cve => (
                <a key={cve.id} href={cve.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', textDecoration: 'none',
                  background: 'rgba(0,0,0,0.3)', border: `1px solid ${getCVSSColor(cve.score)}20`,
                  borderLeft: `3px solid ${getCVSSColor(cve.score)}`,
                  borderRadius: '6px', padding: '9px 12px', transition: 'all 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.78rem', fontWeight: 'bold' }}>{cve.id}</span>
                    <span style={{
                      background: `${getCVSSColor(cve.score)}18`, border: `1px solid ${getCVSSColor(cve.score)}40`,
                      color: getCVSSColor(cve.score), padding: '1px 7px', borderRadius: '3px',
                      fontSize: '0.58rem', fontWeight: 'bold', letterSpacing: '0.5px'
                    }}>{cve.label} {cve.score}</span>
                    <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.6rem' }}>{cve.published}</span>
                  </div>
                  <div style={{ color: '#999', fontSize: '0.72rem', lineHeight: '1.4' }}>{cve.desc}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ThreatCorrelation() {
  const [email, setEmail]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const runCorrelation = async () => {
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError(null); setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(
        `${API_BASE}/api/security/email-breach?email=${encodeURIComponent(email)}`,
        { signal: controller.signal }
      );

      if (res.status === 404) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          setResult({ breaches: [], email });
        } else {
          setError('Backend unreachable. Check VITE_API_URL in Vercel env vars.');
        }
        return;
      }

      if (res.status === 503) { setError('HIBP_API_KEY not set on backend.'); return; }
      if (res.status === 429) { setError('Rate limited. Wait 1–2 minutes.'); return; }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `API error ${res.status}`);

      setResult({ breaches: data.breaches || [], email });
    } catch (err) {
      if (err.name === 'AbortError') setError('Timed out. Backend may be cold-starting. Try again in 30s.');
      else setError(`Failed: ${err.message}`);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const breachCount = result?.breaches?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
          🔗 Threat Correlation Engine
        </div>
        <div style={{ color: '#446644', fontSize: '0.72rem', lineHeight: '1.5' }}>
          Enter an email to find which services you were breached in, then automatically cross-reference each breached service against the NVD CVE database to show active vulnerabilities. No other platform does this in one step.
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && runCorrelation()}
          placeholder="your@email.com"
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#8b5cf6'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={runCorrelation} disabled={loading || !email} style={{
          background: loading || !email ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.2)',
          border: '1px solid #8b5cf650', color: loading || !email ? '#4a3a6a' : '#8b5cf6',
          padding: '9px 16px', borderRadius: '6px', cursor: loading || !email ? 'not-allowed' : 'pointer',
          fontSize: '0.78rem', fontWeight: 'bold', flexShrink: 0, transition: 'all 0.15s'
        }}>
          {loading ? '⟳' : '⚡ Correlate'}
        </button>
      </div>

      <div style={{ color: '#2a2a2a', fontSize: '0.6rem' }}>
        🔒 Email checked via private backend · CVE data from NVD · Nothing stored
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444428', borderRadius: '6px', padding: '10px 12px', color: '#ef4444', fontSize: '0.78rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #8b5cf625', borderTopColor: '#8b5cf6', animation: 'spin2 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ color: '#666', fontSize: '0.78rem' }}>Fetching breach history…</span>
          <style>{`@keyframes spin2{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.6rem' }}>{breachCount === 0 ? '✅' : '🚨'}</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.88rem' }}>
                {breachCount === 0 ? 'No breaches found for this email.' : `${breachCount} breach${breachCount > 1 ? 'es' : ''} found — click each to load CVE correlations`}
              </div>
              <div style={{ color: '#446644', fontSize: '0.65rem', marginTop: '2px' }}>{result.email}</div>
            </div>
          </div>

          {breachCount === 0 && (
            <div style={{ color: '#446644', fontSize: '0.72rem', textAlign: 'center', padding: '8px' }}>
              Great — no known exposures for this email. Keep using unique passwords and 2FA.
            </div>
          )}

          {breachCount > 0 && (
            <>
              <div style={{ color: '#446644', fontSize: '0.7rem', padding: '0 2px' }}>
                Click any breach below to cross-reference it against active CVEs in the NVD database.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.breaches.map((breach, i) => (
                  <BreachCorrelationCard key={breach.Name || i} breach={breach} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}