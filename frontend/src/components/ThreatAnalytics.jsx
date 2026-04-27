import { useMemo } from 'react';

const ATTACK_COLORS = {
  'DDoS':             '#ef4444',
  'SQL Injection':    '#f97316',
  'Brute Force':      '#fbbf24',
  'Malware C2':       '#8b5cf6',
  'Zero-Day Exploit': '#ec4899',
  'Ransomware':       '#10b981',
  'Phishing':         '#3b82f6',
  'APT Activity':     '#06b6d4',
};

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#fbbf24',
};

function getSeverityScore(severity) {
  return { Critical: 3, High: 2, Medium: 1 }[severity] || 0;
}

// Simple sparkline SVG — renders a mini line chart from an array of values
function Sparkline({ data, color = '#10b981', width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
      <polyline
        points={`0,${height} ${pts} ${width},${height}`}
        fill={color}
        opacity="0.08"
        strokeWidth="0"
      />
    </svg>
  );
}

// Animated horizontal bar
function Bar({ label, count, total, color, rank }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rank <= 3 && (
            <span style={{ fontSize: '0.65rem', color: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#b45309' }}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: '#ccc' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#666' }}>{pct.toFixed(1)}%</span>
          <span style={{ fontSize: '0.75rem', color, fontWeight: 'bold', minWidth: '24px', textAlign: 'right' }}>{count}</span>
        </div>
      </div>
      <div style={{ height: '6px', background: '#111', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1a1a1a' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          borderRadius: '3px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 6px ${color}60`
        }} />
      </div>
    </div>
  );
}

// Stat card
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      border: `1px solid ${color}22`,
      borderRadius: '8px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#555' }}>{sub}</div>}
    </div>
  );
}

export default function ThreatAnalytics({ attacks = [] }) {

  const analytics = useMemo(() => {
    if (attacks.length === 0) return null;

    // Attack type breakdown
    const typeCounts = {};
    attacks.forEach(a => {
      typeCounts[a.attack_type] = (typeCounts[a.attack_type] || 0) + 1;
    });
    const typesSorted = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1]);

    // Severity breakdown
    const sevCounts = { Critical: 0, High: 0, Medium: 0 };
    attacks.forEach(a => { if (sevCounts[a.severity] !== undefined) sevCounts[a.severity]++; });

    // Top attackers
    const attackerCounts = {};
    attacks.forEach(a => {
      attackerCounts[a.source_country] = (attackerCounts[a.source_country] || 0) + 1;
    });
    const topAttackers = Object.entries(attackerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top targets
    const targetCounts = {};
    attacks.forEach(a => {
      targetCounts[a.target_country] = (targetCounts[a.target_country] || 0) + 1;
    });
    const topTargets = Object.entries(targetCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Threat score (weighted severity)
    const threatScore = attacks.reduce((sum, a) => sum + getSeverityScore(a.severity), 0);
    const maxPossible = attacks.length * 3;
    const threatIndex = maxPossible > 0 ? Math.round((threatScore / maxPossible) * 100) : 0;

    // Attack rate — how many attacks in last 10 entries vs first 10
    const recentRate = attacks.slice(0, 10).length;

    // Sparkline — group last 50 attacks into 10 buckets of 5
    const buckets = Array.from({ length: 10 }, (_, i) => {
      const slice = attacks.slice(i * 5, i * 5 + 5);
      return slice.reduce((sum, a) => sum + getSeverityScore(a.severity), 0);
    }).reverse();

    // Most active pair (source → target)
    const pairCounts = {};
    attacks.forEach(a => {
      const key = `${a.source_country} → ${a.target_country}`;
      pairCounts[key] = (pairCounts[key] || 0) + 1;
    });
    const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0];

    // Avg severity label
    const avgScore = attacks.length > 0 ? threatScore / attacks.length : 0;
    const avgSeverity = avgScore >= 2.5 ? 'Critical' : avgScore >= 1.8 ? 'High' : 'Medium';

    return {
      typesSorted, sevCounts, topAttackers, topTargets,
      threatIndex, recentRate, buckets, topPair, avgSeverity,
      criticalPct: attacks.length > 0 ? ((sevCounts.Critical / attacks.length) * 100).toFixed(1) : '0'
    };
  }, [attacks]);

  if (attacks.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '300px', color: '#333', fontSize: '0.85rem', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{ fontSize: '2rem', opacity: 0.3 }}>📊</div>
        <div>Waiting for attack data…</div>
        <div style={{ fontSize: '0.7rem', color: '#2a2a2a' }}>Analytics will populate as the simulation runs</div>
      </div>
    );
  }

  const { typesSorted, sevCounts, topAttackers, topTargets, threatIndex, buckets, topPair, avgSeverity, criticalPct } = analytics;

  const threatColor = threatIndex >= 70 ? '#ef4444' : threatIndex >= 40 ? '#f97316' : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── TOP STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <StatCard
          label="THREAT INDEX"
          value={`${threatIndex}/100`}
          sub={threatIndex >= 70 ? 'Elevated activity' : threatIndex >= 40 ? 'Moderate activity' : 'Normal range'}
          color={threatColor}
          icon="🎯"
        />
        <StatCard
          label="TOTAL EVENTS"
          value={attacks.length}
          sub={`${criticalPct}% critical`}
          color="#3b82f6"
          icon="⚡"
        />
        <StatCard
          label="AVG SEVERITY"
          value={avgSeverity}
          sub="Weighted mean"
          color={SEVERITY_COLORS[avgSeverity]}
          icon="📈"
        />
        <StatCard
          label="TOP VECTOR"
          value={typesSorted[0]?.[0] || '—'}
          sub={`${typesSorted[0]?.[1] || 0} incidents`}
          color={ATTACK_COLORS[typesSorted[0]?.[0]] || '#10b981'}
          icon="🔫"
        />
        {topPair && (
          <StatCard
            label="HOTTEST ROUTE"
            value={topPair[0]}
            sub={`${topPair[1]} attacks`}
            color="#8b5cf6"
            icon="🛣️"
          />
        )}
      </div>

      {/* ── SPARKLINE ── */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', border: '1px solid #111',
        borderRadius: '10px', padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px' }}>THREAT INTENSITY TREND</div>
            <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px' }}>Weighted severity over last 50 events (10 buckets)</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {Object.entries(sevCounts).map(([sev, count]) => (
              <div key={sev} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: SEVERITY_COLORS[sev] }}>{count}</div>
                <div style={{ fontSize: '0.58rem', color: '#555' }}>{sev}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ paddingTop: '4px' }}>
          <Sparkline data={buckets} color={threatColor} width="100%" height={48} />
        </div>
        {/* X axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '0.58rem', color: '#333' }}>Oldest</span>
          <span style={{ fontSize: '0.58rem', color: '#333' }}>Latest</span>
        </div>
      </div>

      {/* ── ATTACK VECTORS + SEVERITY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Attack type breakdown */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid #111',
          borderRadius: '10px', padding: '16px 20px'
        }}>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '1px', marginBottom: '14px' }}>
            ATTACK VECTOR BREAKDOWN
          </div>
          {typesSorted.slice(0, 6).map(([type, count], i) => (
            <Bar
              key={type}
              label={type}
              count={count}
              total={attacks.length}
              color={ATTACK_COLORS[type] || '#888'}
              rank={i + 1}
            />
          ))}
        </div>

        {/* Severity breakdown */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid #111',
          borderRadius: '10px', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '1px', marginBottom: '2px' }}>
            SEVERITY DISTRIBUTION
          </div>

          {/* Donut-style severity visual */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
            {Object.entries(sevCounts).map(([sev, count]) => {
              const pct = attacks.length > 0 ? (count / attacks.length) * 100 : 0;
              return (
                <div key={sev} style={{
                  flex: 1, background: `${SEVERITY_COLORS[sev]}12`,
                  border: `1px solid ${SEVERITY_COLORS[sev]}30`,
                  borderRadius: '8px', padding: '12px 8px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: SEVERITY_COLORS[sev] }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: SEVERITY_COLORS[sev], opacity: 0.8 }}>{sev}</div>
                  <div style={{ fontSize: '0.6rem', color: '#555', marginTop: '2px' }}>{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>

          {/* Stacked bar */}
          <div>
            <div style={{ fontSize: '0.6rem', color: '#444', marginBottom: '6px', letterSpacing: '0.5px' }}>STACKED PROPORTION</div>
            <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', gap: '1px' }}>
              {Object.entries(sevCounts).map(([sev, count]) => {
                const pct = attacks.length > 0 ? (count / attacks.length) * 100 : 0;
                return pct > 0 ? (
                  <div key={sev} style={{
                    width: `${pct}%`,
                    background: SEVERITY_COLORS[sev],
                    transition: 'width 0.6s ease'
                  }} title={`${sev}: ${pct.toFixed(1)}%`} />
                ) : null;
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                  <span style={{ fontSize: '0.62rem', color: '#666' }}>{sev}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP ATTACKERS + TOP TARGETS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid #111',
          borderRadius: '10px', padding: '16px 20px'
        }}>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '1px', marginBottom: '14px' }}>
            🔫 TOP ATTACK ORIGINS
          </div>
          {topAttackers.map(([country, count], i) => (
            <Bar key={country} label={country} count={count} total={attacks.length} color="#ef4444" rank={i + 1} />
          ))}
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid #111',
          borderRadius: '10px', padding: '16px 20px'
        }}>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '1px', marginBottom: '14px' }}>
            🎯 TOP ATTACK TARGETS
          </div>
          {topTargets.map(([country, count], i) => (
            <Bar key={country} label={country} count={count} total={attacks.length} color="#3b82f6" rank={i + 1} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div style={{ color: '#252525', fontSize: '0.62rem', textAlign: 'center', paddingBottom: '4px' }}>
        Analytics computed in real-time from simulated threat feed · Updates every 3s
      </div>
    </div>
  );
}