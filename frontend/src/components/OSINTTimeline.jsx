import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://xatlas-api.onrender.com';
const NVD_API  = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

function getSeverityColor(count) {
  if (count === 0) return '#10b981';
  if (count <= 3)  return '#fbbf24';
  if (count <= 8)  return '#f97316';
  return '#ef4444';
}

function formatYear(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).getFullYear();
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// Fetch major CVEs from NVD for a specific year
async function fetchCVEsForYear(year) {
  const start = `${year}-01-01T00:00:00.000`;
  const end   = `${year}-12-31T23:59:59.000`;
  const url   = `${NVD_API}?pubStartDate=${start}&pubEndDate=${end}&cvssV3SeverityFilter=CRITICAL&resultsPerPage=5`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.vulnerabilities || []).map(item => {
      const vuln = item.cve;
      const desc = vuln.descriptions?.find(d => d.lang === 'en')?.value || '';
      const score = vuln.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore
        ?? vuln.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ?? null;
      return {
        id: vuln.id,
        score,
        desc: desc.length > 100 ? desc.slice(0, 100) + '…' : desc,
        url: `https://nvd.nist.gov/vuln/detail/${vuln.id}`
      };
    }).filter(c => c.score !== null);
  } catch { return []; }
}

// Group breaches by year
function groupByYear(breaches) {
  const map = {};
  breaches.forEach(b => {
    const year = b.BreachDate ? new Date(b.BreachDate).getFullYear() : 'Unknown';
    if (!map[year]) map[year] = [];
    map[year].push(b);
  });
  return map;
}

// Timeline entry for a single year
function TimelineYear({ year, breaches, cves, isLoading }) {
  const [expanded, setExpanded] = useState(false);
  const criticalCVEs = (cves || []).filter(c => c.score >= 9.0);
  const hasCritical  = criticalCVEs.length > 0;
  const breachColor  = getSeverityColor(breaches.length);

  return (
    <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
      {/* Year marker + vertical line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '48px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: hasCritical ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.5)',
          border: `2px solid ${hasCritical ? '#ef4444' : breachColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hasCritical ? '#ef4444' : breachColor,
          fontWeight: 'bold', fontSize: '0.65rem', flexShrink: 0,
          boxShadow: hasCritical ? '0 0 12px rgba(239,68,68,0.3)' : 'none'
        }}>
          {year}
        </div>
        <div style={{ width: '2px', flex: 1, background: '#1a1a1a', minHeight: '20px' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: '20px' }}>
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            background: hasCritical ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.35)',
            border: `1px solid ${hasCritical ? '#ef444430' : '#1a1a1a'}`,
            borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ color: breachColor, fontWeight: 'bold', fontSize: '0.82rem' }}>
              {breaches.length} breach{breaches.length > 1 ? 'es' : ''}
            </span>
            <span style={{ color: '#555', fontSize: '0.7rem' }}>—</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
              {breaches.slice(0, 3).map(b => (
                <span key={b.Name} style={{
                  background: `${breachColor}12`, border: `1px solid ${breachColor}30`,
                  color: breachColor, padding: '1px 8px', borderRadius: '3px', fontSize: '0.65rem'
                }}>{b.Name}</span>
              ))}
              {breaches.length > 3 && <span style={{ color: '#555', fontSize: '0.65rem', padding: '1px 4px' }}>+{breaches.length - 3} more</span>}
            </div>
            {hasCritical && (
              <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef444440', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold', flexShrink: 0 }}>
                ⚡ {criticalCVEs.length} CRITICAL CVE{criticalCVEs.length > 1 ? 's' : ''} THAT YEAR
              </span>
            )}
            <span style={{ color: '#333', fontSize: '0.65rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Breach details */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.6rem', color: '#446644', letterSpacing: '1px', marginBottom: '8px' }}>BREACHES IN {year}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {breaches.map(b => {
                  const logoSrc = b.LogoPath?.startsWith('http') ? b.LogoPath : `https://haveibeenpwned.com${b.LogoPath}`;
                  return (
                    <div key={b.Name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #0d0d0d' }}>
                      {b.LogoPath && <img src={logoSrc} alt={b.Name} style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'contain', background: '#fff', padding: '1px', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
                      <span style={{ color: '#ccc', fontSize: '0.78rem', flex: 1 }}>{b.Name}</span>
                      <span style={{ color: '#555', fontSize: '0.62rem' }}>{formatDate(b.BreachDate)}</span>
                      <span style={{ color: getSeverityColor(b.PwnCount > 1000000 ? 10 : 2), fontSize: '0.62rem' }}>
                        {b.PwnCount?.toLocaleString()} accts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CVEs from same year */}
            {isLoading && (
              <div style={{ padding: '10px', color: '#555', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #ef444425', borderTopColor: '#ef4444', animation: 'tlspin 0.7s linear infinite' }} />
                Loading critical CVEs from {year}…
                <style>{`@keyframes tlspin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {!isLoading && cves && cves.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid #ef444418', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.6rem', color: '#ef4444', letterSpacing: '1px', marginBottom: '8px' }}>
                  CRITICAL CVEs ACTIVE IN {year} — CONTEXT FOR YOUR BREACHES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {cves.map(cve => (
                    <a key={cve.id} href={cve.url} target="_blank" rel="noopener noreferrer" style={{
                      textDecoration: 'none', padding: '6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid #0d0d0d'
                    }}>
                      <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>{cve.id}</span>
                      <span style={{ color: '#888', fontSize: '0.7rem', lineHeight: '1.3' }}>{cve.desc}</span>
                      <span style={{ color: '#ef4444', fontSize: '0.65rem', fontWeight: 'bold', flexShrink: 0 }}>{cve.score}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {!isLoading && cves && cves.length === 0 && (
              <div style={{ color: '#446644', fontSize: '0.72rem', padding: '8px 12px' }}>No critical CVEs recorded for {year} in NVD.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OSINTTimeline() {
  const [email, setEmail]       = useState('');
  const [breaches, setBreaches] = useState(null);
  const [cveMap, setCveMap]     = useState({});
  const [loadingYears, setLoadingYears] = useState({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const buildTimeline = async () => {
    if (!isValidEmail(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError(null); setBreaches(null); setCveMap({}); setLoadingYears({});

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(
        `${API_BASE}/api/security/email-breach?email=${encodeURIComponent(email)}`,
        { signal: controller.signal }
      );

      if (res.status === 404) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) { setBreaches([]); }
        else setError('Backend unreachable. Check VITE_API_URL in Vercel env vars.');
        return;
      }
      if (res.status === 503) { setError('HIBP_API_KEY not set on backend.'); return; }
      if (res.status === 429) { setError('Rate limited. Wait 1–2 minutes.'); return; }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `API error ${res.status}`);

      const fetchedBreaches = data.breaches || [];
      setBreaches(fetchedBreaches);

      // Get unique years, then load CVEs for each year in background
      const years = [...new Set(fetchedBreaches.map(b => b.BreachDate ? new Date(b.BreachDate).getFullYear() : null).filter(Boolean))];

      // Mark all years as loading
      const loadingState = {};
      years.forEach(y => loadingState[y] = true);
      setLoadingYears(loadingState);

      // Fetch CVEs per year sequentially to avoid NVD rate limits
      for (const year of years.sort()) {
        try {
          const cves = await fetchCVEsForYear(year);
          setCveMap(prev => ({ ...prev, [year]: cves }));
          setLoadingYears(prev => ({ ...prev, [year]: false }));
          // Small delay between NVD requests
          await new Promise(r => setTimeout(r, 600));
        } catch {
          setCveMap(prev => ({ ...prev, [year]: [] }));
          setLoadingYears(prev => ({ ...prev, [year]: false }));
        }
      }

    } catch (err) {
      if (err.name === 'AbortError') setError('Timed out. Backend may be cold-starting. Try again in 30s.');
      else setError(`Failed: ${err.message}`);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const byYear = breaches ? groupByYear(breaches) : {};
  const sortedYears = Object.keys(byYear).filter(y => y !== 'Unknown').sort((a, b) => Number(b) - Number(a));
  const unknownYear = byYear['Unknown'] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
          📅 OSINT Breach Timeline
        </div>
        <div style={{ color: '#446644', fontSize: '0.72rem', lineHeight: '1.5' }}>
          Builds a chronological timeline of every data breach your email appeared in, correlated with the critical CVEs that were active in the same year. See not just where you were exposed — but what was happening in the threat landscape at that time.
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(null); setBreaches(null); }}
          onKeyDown={e => e.key === 'Enter' && buildTimeline()}
          placeholder="your@email.com"
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#06b6d4'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={buildTimeline} disabled={loading || !email} style={{
          background: loading || !email ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.2)',
          border: '1px solid #06b6d450', color: loading || !email ? '#1a4a5a' : '#06b6d4',
          padding: '9px 16px', borderRadius: '6px', cursor: loading || !email ? 'not-allowed' : 'pointer',
          fontSize: '0.78rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : '📅 Build Timeline'}
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
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #06b6d425', borderTopColor: '#06b6d4', animation: 'tspinx 0.7s linear infinite', flexShrink: 0 }} />
          <span style={{ color: '#666', fontSize: '0.78rem' }}>Fetching breach history and building timeline…</span>
          <style>{`@keyframes tspinx{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {breaches !== null && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {breaches.length === 0 ? (
            <div style={{ color: '#446644', fontSize: '0.78rem', textAlign: 'center', padding: '20px' }}>
              ✅ No breaches found. Nothing to plot on the timeline.
            </div>
          ) : (
            <>
              {/* Summary */}
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', marginBottom: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: getSeverityColor(breaches.length), fontWeight: 'bold', fontSize: '1.4rem' }}>{breaches.length}</div>
                  <div style={{ color: '#555', fontSize: '0.6rem' }}>TOTAL BREACHES</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '1.4rem' }}>{sortedYears.length}</div>
                  <div style={{ color: '#555', fontSize: '0.6rem' }}>YEARS AFFECTED</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.4rem' }}>
                    {sortedYears[sortedYears.length - 1] || '—'}
                  </div>
                  <div style={{ color: '#555', fontSize: '0.6rem' }}>FIRST BREACH</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.4rem' }}>
                    {sortedYears[0] || '—'}
                  </div>
                  <div style={{ color: '#555', fontSize: '0.6rem' }}>MOST RECENT</div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ paddingLeft: '4px' }}>
                {sortedYears.map(year => (
                  <TimelineYear
                    key={year}
                    year={year}
                    breaches={byYear[year]}
                    cves={cveMap[year] || null}
                    isLoading={loadingYears[year] || false}
                  />
                ))}
                {unknownYear.length > 0 && (
                  <TimelineYear year="Unknown" breaches={unknownYear} cves={[]} isLoading={false} />
                )}
              </div>

              <div style={{ color: '#282828', fontSize: '0.6rem', textAlign: 'center', paddingTop: '8px' }}>
                Breach data: Have I Been Pwned · CVE data: NVD · Timeline sorted newest first
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}