import { useState, useEffect, useCallback } from 'react';

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const REFRESH_INTERVAL = 5 * 60 * 1000;

function getCVSSColor(score) {
  const s = parseFloat(score);
  if (s >= 9.0) return '#ef4444';
  if (s >= 7.0) return '#f97316';
  if (s >= 4.0) return '#fbbf24';
  return '#10b981';
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
  } catch { return null; }
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

function parseCVE(item) {
  const vuln = item.cve;
  const desc = vuln.descriptions?.find(d => d.lang === 'en')?.value || 'No description available.';
  const score = extractScore(vuln.metrics);
  const vector = getAttackVector(vuln.metrics);
  const published = vuln.published ? new Date(vuln.published) : null;
  const modified = vuln.lastModified ? new Date(vuln.lastModified) : null;
  const refs = vuln.references?.slice(0, 3).map(r => r.url) || [];
  const cwes = vuln.weaknesses?.flatMap(w => w.description?.map(d => d.value)).filter(Boolean) || [];
  return {
    id: vuln.id,
    desc: desc.length > 180 ? desc.slice(0, 180) + '…' : desc,
    fullDesc: desc,
    score, vector, published, modified, refs, cwes,
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

// Circular score ring SVG
function ScoreRing({ score, color }) {
  const r = 22, circ = 2 * Math.PI * r;
  const pct = Math.min(parseFloat(score) / 10, 1);
  const dash = pct * circ;
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#1a1a1a" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// Vector icon
function VectorIcon({ vector }) {
  if (!vector) return null;
  const v = vector.toUpperCase();
  const icon = v.includes('NETWORK') ? '🌐' : v.includes('LOCAL') ? '💻' : v.includes('PHYSICAL') ? '🖐️' : '🔗';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a2a',
      borderRadius: '4px', padding: '2px 7px',
      fontSize: '0.6rem', color: '#777', letterSpacing: '0.5px'
    }}>
      {icon} {vector}
    </span>
  );
}

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
    if (isManual) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pubStartDate = thirtyDaysAgo.toISOString().replace(/\.\d{3}Z$/, '.000');
      const pubEndDate = new Date().toISOString().replace(/\.\d{3}Z$/, '.000');
      const url = `${NVD_API}?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}&resultsPerPage=40&startIndex=0`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`NVD API error: ${res.status}`);
      const data = await res.json();
      const parsed = (data.vulnerabilities || [])
        .map(parseCVE).filter(c => c.score !== null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setCves(parsed);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.message.includes('403') || err.message.includes('429')) {
        setError('NVD API rate limit reached. Data will refresh automatically in 5 minutes.');
      } else {
        setError(`Failed to fetch CVE data: ${err.message}`);
      }
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchCVEs();
    const interval = setInterval(() => fetchCVEs(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCVEs]);

  const displayed = cves.filter(cve => {
    const matchesSeverity = filter === 'ALL' || getCVSSLabel(cve.score) === filter;
    const matchesSearch = !searchQuery ||
      cve.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cve.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cve.cwes.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const criticalCount = cves.filter(c => getCVSSLabel(c.score) === 'CRITICAL').length;
  const highCount     = cves.filter(c => getCVSSLabel(c.score) === 'HIGH').length;
  const mediumCount   = cves.filter(c => getCVSSLabel(c.score) === 'MEDIUM').length;
  const lowCount      = cves.filter(c => getCVSSLabel(c.score) === 'LOW').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes shimmer {
          0%   { background-position: -600px 0 }
          100% { background-position:  600px 0 }
        }
        .cve-card { transition: border-color 0.2s, background 0.2s, transform 0.15s; }
        .cve-card:hover { transform: translateX(3px); }
        .filter-btn { transition: all 0.15s; }
        .filter-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {[
          { label: 'TOTAL',    value: cves.length,   color: '#60a5fa', icon: '📋' },
          { label: 'CRITICAL', value: criticalCount,  color: '#ef4444', icon: '🔴' },
          { label: 'HIGH',     value: highCount,      color: '#f97316', icon: '🟠' },
          { label: 'MEDIUM',   value: mediumCount,    color: '#fbbf24', icon: '🟡' },
          { label: 'UPDATED',  value: lastUpdated ? timeAgo(lastUpdated) : '—', color: '#10b981', icon: '⟳', small: true }
        ].map(stat => (
          <div key={stat.label} style={{
            background: `linear-gradient(135deg, ${stat.color}10 0%, transparent 100%)`,
            border: `1px solid ${stat.color}25`,
            borderTop: `2px solid ${stat.color}`,
            borderRadius: '8px',
            padding: '12px 10px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 6, right: 8,
              fontSize: '1rem', opacity: 0.15
            }}>{stat.icon}</div>
            <div style={{
              fontSize: stat.small ? '0.85rem' : '1.7rem',
              fontWeight: 'bold', color: stat.color,
              fontFamily: 'monospace', lineHeight: 1
            }}>
              {loading ? '…' : stat.value}
            </div>
            <div style={{
              fontSize: '0.55rem', color: '#444',
              letterSpacing: '1.5px', marginTop: '4px', fontWeight: 'bold'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── CONTROLS ── */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.4)', border: '1px solid #1a1a1a',
        borderRadius: '8px', padding: '10px 14px'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: '#444', fontSize: '0.8rem', pointerEvents: 'none'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search CVE-ID, keyword, CWE..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid #2a2a2a', borderRadius: '6px',
              padding: '7px 12px 7px 30px', color: '#fff',
              fontSize: '0.78rem', fontFamily: 'monospace',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = '#2a2a2a'}
          />
        </div>

        {/* Severity pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {SEVERITY_FILTERS.map(f => {
            const colorMap = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#fbbf24', LOW: '#10b981', ALL: '#60a5fa' };
            const color = colorMap[f] || '#888';
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} className="filter-btn" style={{
                background: active ? color : 'transparent',
                border: `1px solid ${active ? color : '#2a2a2a'}`,
                color: active ? '#000' : '#555',
                padding: '5px 11px', borderRadius: '20px',
                cursor: 'pointer', fontSize: '0.62rem',
                fontWeight: 'bold', letterSpacing: '0.8px'
              }}>
                {f}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <button onClick={() => fetchCVEs(true)} disabled={refreshing} style={{
          background: refreshing ? 'transparent' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${refreshing ? '#2a2a2a' : '#10b981'}`,
          color: refreshing ? '#444' : '#10b981',
          padding: '6px 14px', borderRadius: '6px',
          cursor: refreshing ? 'not-allowed' : 'pointer',
          fontSize: '0.72rem', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}>
          <span style={{
            display: 'inline-block',
            animation: refreshing ? 'spin 1s linear infinite' : 'none'
          }}>⟳</span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444430',
          borderLeft: '3px solid #ef4444', borderRadius: '6px',
          padding: '12px 16px', color: '#ef4444', fontSize: '0.78rem',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── SKELETON LOADING ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: '80px', borderRadius: '8px',
              background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
              backgroundSize: '600px 100%',
              animation: `shimmer 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.07}s`,
              border: '1px solid #1a1a1a'
            }} />
          ))}
        </div>
      )}

      {/* ── CVE LIST ── */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displayed.length === 0 && (
            <div style={{
              textAlign: 'center', color: '#333', padding: '60px 20px',
              border: '1px dashed #1f1f1f', borderRadius: '8px', fontSize: '0.85rem'
            }}>
              No CVEs match your current filter.
            </div>
          )}

          {displayed.map((cve, idx) => {
            const color  = getCVSSColor(cve.score);
            const label  = getCVSSLabel(cve.score);
            const isExp  = expandedId === cve.id;

            return (
              <div
                key={cve.id}
                className="cve-card"
                onClick={() => setExpandedId(isExp ? null : cve.id)}
                style={{
                  background: isExp
                    ? `linear-gradient(135deg, ${color}08 0%, rgba(0,0,0,0.6) 100%)`
                    : 'rgba(8,8,8,0.8)',
                  border: `1px solid ${isExp ? color + '35' : '#181818'}`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: '8px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Subtle rank number watermark */}
                <span style={{
                  position: 'absolute', right: 12, top: 8,
                  fontSize: '0.55rem', color: '#222',
                  fontFamily: 'monospace', userSelect: 'none'
                }}>#{idx + 1}</span>

                {/* ── CARD HEADER ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

                  {/* Score ring */}
                  <ScoreRing score={cve.score} color={color} />

                  {/* Main content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row: ID + badges + time */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: '8px', marginBottom: '6px', flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 'bold',
                        color: '#60a5fa', fontSize: '0.88rem', letterSpacing: '0.5px'
                      }}>
                        {cve.id}
                      </span>

                      {/* Severity badge */}
                      <span style={{
                        background: `${color}20`, border: `1px solid ${color}50`,
                        color, padding: '2px 9px', borderRadius: '3px',
                        fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px',
                        boxShadow: `0 0 6px ${color}20`
                      }}>
                        {label}
                      </span>

                      <VectorIcon vector={cve.vector} />

                      {cve.cwes.slice(0, 2).map(cwe => (
                        <span key={cwe} style={{
                          background: 'rgba(139,92,246,0.08)',
                          border: '1px solid #8b5cf625',
                          color: '#8b5cf6', padding: '2px 7px',
                          borderRadius: '3px', fontSize: '0.58rem',
                          letterSpacing: '0.3px'
                        }}>{cwe}</span>
                      ))}

                      {/* Status pill */}
                      <span style={{
                        marginLeft: 'auto',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid #1f1f1f',
                        color: '#444', padding: '2px 7px',
                        borderRadius: '3px', fontSize: '0.58rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {cve.status}
                      </span>

                      <span style={{ color: '#444', fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
                        {timeAgo(cve.published)}
                      </span>

                      <span style={{
                        color: isExp ? color : '#333',
                        fontSize: '0.65rem', transition: 'color 0.2s',
                        transform: isExp ? 'rotate(180deg)' : 'none',
                        display: 'inline-block', transition: 'transform 0.2s, color 0.2s'
                      }}>▼</span>
                    </div>

                    {/* Description */}
                    <p style={{
                      margin: 0, fontSize: '0.77rem', color: '#888',
                      lineHeight: '1.55', fontFamily: 'system-ui',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: isExp ? 'unset' : 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {isExp ? cve.fullDesc : cve.desc}
                    </p>
                  </div>
                </div>

                {/* ── EXPANDED DETAILS ── */}
                {isExp && (
                  <div style={{
                    marginTop: '16px', paddingTop: '16px',
                    borderTop: `1px solid ${color}20`
                  }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px', marginBottom: '14px'
                    }}>
                      {[
                        { label: 'PUBLISHED',     value: cve.published?.toLocaleDateString() || '—' },
                        { label: 'LAST MODIFIED',  value: cve.modified?.toLocaleDateString()  || '—' },
                        { label: 'STATUS',         value: cve.status,  highlight: '#10b981' },
                        { label: 'ATTACK VECTOR',  value: cve.vector   || '—' }
                      ].map(field => (
                        <div key={field.label} style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid #1f1f1f',
                          borderRadius: '6px', padding: '8px 10px'
                        }}>
                          <div style={{
                            fontSize: '0.55rem', color: '#444',
                            letterSpacing: '1px', marginBottom: '4px', fontWeight: 'bold'
                          }}>{field.label}</div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: field.highlight || '#bbb',
                            fontFamily: 'monospace'
                          }}>{field.value}</div>
                        </div>
                      ))}
                    </div>

                    {cve.refs.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{
                          fontSize: '0.55rem', color: '#444',
                          letterSpacing: '1px', marginBottom: '8px', fontWeight: 'bold'
                        }}>REFERENCES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {cve.refs.map((ref, i) => (
                            <a key={i} href={ref} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                color: '#3b82f6', fontSize: '0.7rem',
                                textDecoration: 'none', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: '5px'
                              }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                              <span style={{ color: '#555', flexShrink: 0 }}>↗</span>
                              {ref}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: `${color}12`, border: `1px solid ${color}40`,
                        color, padding: '7px 16px', borderRadius: '5px',
                        textDecoration: 'none', fontSize: '0.72rem', fontWeight: 'bold',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = `${color}25`}
                      onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
                    >
                      View on NVD ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div style={{
          textAlign: 'center', color: '#2a2a2a', fontSize: '0.62rem',
          paddingBottom: '8px', letterSpacing: '0.5px'
        }}>
          Showing {displayed.length} of {cves.length} CVEs · NVD National Vulnerability Database · Auto-refreshes every 5 min
        </div>
      )}
    </div>
  );
}