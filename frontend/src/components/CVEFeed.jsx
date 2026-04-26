import { useState, useEffect, useCallback } from 'react';

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes — NVD rate limits at 5 req/30s unauthenticated

function getCVSSColor(score) {
  const s = parseFloat(score);
  if (s >= 9.0) return '#ef4444';   // Critical
  if (s >= 7.0) return '#f97316';   // High
  if (s >= 4.0) return '#fbbf24';   // Medium
  return '#10b981';                  // Low
}

function getCVSSLabel(score) {
  const s = parseFloat(score);
  if (s >= 9.0) return 'CRITICAL';
  if (s >= 7.0) return 'HIGH';
  if (s >= 4.0) return 'MEDIUM';
  return 'LOW';
}

function getAttackVector(metrics) {
  try {
    const cvssData =
      metrics?.cvssMetricV31?.[0]?.cvssData ||
      metrics?.cvssMetricV30?.[0]?.cvssData ||
      metrics?.cvssMetricV2?.[0]?.cvssData;
    return cvssData?.attackVector || cvssData?.accessVector || null;
  } catch {
    return null;
  }
}

function extractScore(metrics) {
  try {
    return (
      metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ??
      metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore ??
      metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore ??
      null
    );
  } catch {
    return null;
  }
}

function parseCVE(item) {
  const vuln = item.cve;
  const desc = vuln.descriptions?.find(d => d.lang === 'en')?.value || 'No description available.';
  const score = extractScore(vuln.metrics);
  const vector = getAttackVector(vuln.metrics);
  const published = vuln.published ? new Date(vuln.published) : null;
  const modified = vuln.lastModified ? new Date(vuln.lastModified) : null;
  const refs = vuln.references?.slice(0, 3).map(r => r.url) || [];
  const cwes = vuln.weaknesses?.flatMap(w =>
    w.description?.map(d => d.value)
  ).filter(Boolean) || [];

  return {
    id: vuln.id,
    desc: desc.length > 200 ? desc.slice(0, 200) + '…' : desc,
    fullDesc: desc,
    score,
    vector,
    published,
    modified,
    refs,
    cwes,
    status: vuln.vulnStatus || 'Unknown'
  };
}

function timeAgo(date) {
  if (!date) return 'Unknown';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function CVEFeed() {
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCVEs = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch last 30 days of CVEs, sorted by published date descending
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pubStartDate = thirtyDaysAgo.toISOString().replace(/\.\d{3}Z$/, '.000');
      const pubEndDate = new Date().toISOString().replace(/\.\d{3}Z$/, '.000');

      const url = `${NVD_API}?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}&resultsPerPage=40&startIndex=0`;

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error(`NVD API error: ${res.status}`);

      const data = await res.json();
      const parsed = (data.vulnerabilities || [])
        .map(parseCVE)
        .filter(c => c.score !== null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      setCves(parsed);
      setLastUpdated(new Date());
    } catch (err) {
      // NVD sometimes rate-limits — show helpful message
      if (err.message.includes('403') || err.message.includes('429')) {
        setError('NVD API rate limit reached. Data will refresh automatically in 5 minutes.');
      } else {
        setError(`Failed to fetch CVE data: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchCVEs();
    const interval = setInterval(() => fetchCVEs(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCVEs]);

  // Filtered + searched CVEs
  const displayed = cves.filter(cve => {
    const matchesSeverity = filter === 'ALL' || getCVSSLabel(cve.score) === filter;
    const matchesSearch = !searchQuery ||
      cve.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cve.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cve.cwes.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const criticalCount = cves.filter(c => getCVSSLabel(c.score) === 'CRITICAL').length;
  const highCount = cves.filter(c => getCVSSLabel(c.score) === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'TOTAL CVEs', value: cves.length, color: '#10b981' },
          { label: 'CRITICAL', value: criticalCount, color: '#ef4444' },
          { label: 'HIGH', value: highCount, color: '#f97316' },
          { label: 'LAST UPDATED', value: lastUpdated ? timeAgo(lastUpdated) : '—', color: '#3b82f6', small: true }
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${stat.color}30`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: stat.small ? '0.9rem' : '1.6rem', fontWeight: 'bold', color: stat.color }}>
              {loading ? '…' : stat.value}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginTop: '2px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Search */}
        <input
          type="text"
          placeholder="Search CVE-ID, keyword, CWE..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#333'}
        />

        {/* Severity filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {SEVERITY_FILTERS.map(f => {
            const color = f === 'CRITICAL' ? '#ef4444' : f === 'HIGH' ? '#f97316' : f === 'MEDIUM' ? '#fbbf24' : f === 'LOW' ? '#10b981' : '#888';
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? `${color}25` : 'transparent',
                  border: `1px solid ${filter === f ? color : '#333'}`,
                  color: filter === f ? color : '#555',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  transition: 'all 0.15s'
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchCVEs(true)}
          disabled={refreshing}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            color: refreshing ? '#555' : '#10b981',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem',
            transition: 'all 0.15s'
          }}
        >
          {refreshing ? '⟳ Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef444440',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#ef4444',
          fontSize: '0.8rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #1a1a1a',
              borderRadius: '8px',
              padding: '16px',
              animation: 'pulse 1.5s ease-in-out infinite',
              height: '80px'
            }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
        </div>
      )}

      {/* CVE list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontSize: '0.85rem' }}>
              No CVEs match your filter.
            </div>
          )}

          {displayed.map(cve => {
            const color = getCVSSColor(cve.score);
            const label = getCVSSLabel(cve.score);
            const isExpanded = expandedId === cve.id;

            return (
              <div
                key={cve.id}
                onClick={() => setExpandedId(isExpanded ? null : cve.id)}
                style={{
                  background: isExpanded ? `${color}08` : 'rgba(0,0,0,0.5)',
                  border: `1px solid ${isExpanded ? color + '50' : '#1f1f1f'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: `3px solid ${color}`
                }}
                onMouseEnter={e => {
                  if (!isExpanded) e.currentTarget.style.borderColor = color + '40'
                }}
                onMouseLeave={e => {
                  if (!isExpanded) e.currentTarget.style.borderColor = '#1f1f1f'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#60a5fa',
                    fontSize: '0.85rem',
                    letterSpacing: '0.5px'
                  }}>
                    {cve.id}
                  </span>

                  <span style={{
                    background: `${color}20`,
                    border: `1px solid ${color}60`,
                    color,
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}>
                    {label} {cve.score}
                  </span>

                  {cve.vector && (
                    <span style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid #333',
                      color: '#888',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '0.6rem',
                      letterSpacing: '0.5px'
                    }}>
                      {cve.vector}
                    </span>
                  )}

                  {cve.cwes.slice(0, 1).map(cwe => (
                    <span key={cwe} style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid #8b5cf630',
                      color: '#8b5cf6',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '0.6rem'
                    }}>
                      {cwe}
                    </span>
                  ))}

                  <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.65rem' }}>
                    {timeAgo(cve.published)}
                  </span>

                  <span style={{ color: '#444', fontSize: '0.7rem' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#aaa',
                  lineHeight: '1.5',
                  fontFamily: 'system-ui'
                }}>
                  {isExpanded ? cve.fullDesc : cve.desc}
                </p>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #222' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '3px' }}>PUBLISHED</div>
                        <div style={{ fontSize: '0.75rem', color: '#ccc' }}>
                          {cve.published?.toLocaleDateString() || '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '3px' }}>LAST MODIFIED</div>
                        <div style={{ fontSize: '0.75rem', color: '#ccc' }}>
                          {cve.modified?.toLocaleDateString() || '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '3px' }}>STATUS</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{cve.status}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '3px' }}>ATTACK VECTOR</div>
                        <div style={{ fontSize: '0.75rem', color: '#ccc' }}>{cve.vector || '—'}</div>
                      </div>
                    </div>

                    {cve.refs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', marginBottom: '6px' }}>REFERENCES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {cve.refs.map((ref, i) => (
                            <a
                              key={i}
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                color: '#3b82f6',
                                fontSize: '0.7rem',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.target.style.textDecoration = 'none'}
                            >
                              ↗ {ref}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'inline-block',
                        marginTop: '12px',
                        background: `${color}15`,
                        border: `1px solid ${color}40`,
                        color,
                        padding: '6px 14px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = `${color}30`}
                      onMouseLeave={e => e.currentTarget.style.background = `${color}15`}
                    >
                      View Full NVD Entry ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div style={{ textAlign: 'center', color: '#444', fontSize: '0.65rem', paddingBottom: '8px' }}>
          Showing {displayed.length} of {cves.length} CVEs · Source: NVD National Vulnerability Database · Auto-refreshes every 5 min
        </div>
      )}
    </div>
  );
}