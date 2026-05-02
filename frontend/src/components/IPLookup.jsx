import { useState } from 'react';

// ipwho.is — free, no key, CORS-open, 10k req/day
// Covers: IP geo, ASN, ISP, timezone, is_eu flag
const IPWHO_API = 'https://ipwho.is/';

// ip-api.com — free for non-commercial, no key, covers proxy/VPN detection
const IPAPI_API = 'http://ip-api.com/json/';

// For abuse score we use AbuseIPDB public check page scrape is not viable,
// so we use stopforumspam.org which has a free JSON API
const SFSPAM_API = 'https://api.stopforumspam.org/api?ip=';

function Badge({ label, color, bg }) {
  return (
    <span style={{
      background: bg || `${color}15`,
      border: `1px solid ${color}40`,
      color, padding: '2px 8px',
      borderRadius: '3px', fontSize: '0.62rem', fontWeight: 'bold', letterSpacing: '0.3px'
    }}>{label}</span>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {items.filter(i => i.value).map(item => (
        <div key={item.label} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #111', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '0.58rem', color: '#446644', letterSpacing: '0.5px', marginBottom: '2px' }}>{item.label}</div>
          <div style={{ color: item.color || '#ccc', fontSize: '0.75rem', fontWeight: item.bold ? 'bold' : 'normal', fontFamily: item.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IPLookup() {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const isValidIP = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip);

  const lookup = async () => {
    const ip = input.trim();
    if (!ip) { setError('Enter an IP address.'); return; }
    if (!isValidIP(ip)) { setError('Enter a valid IPv4 or IPv6 address.'); return; }
    setLoading(true); setError(null); setResult(null);

    try {
      // Primary geo lookup — ipwho.is
      const geoRes = await fetch(`${IPWHO_API}${encodeURIComponent(ip)}`);
      if (!geoRes.ok) throw new Error(`Geo lookup failed: ${geoRes.status}`);
      const geo = await geoRes.json();

      if (!geo.success) throw new Error(geo.message || 'Lookup failed');

      // Spam/abuse check — stopforumspam (free, no key)
      let abuseData = null;
      try {
        const abuseRes = await fetch(`${SFSPAM_API}${encodeURIComponent(ip)}&json`);
        if (abuseRes.ok) {
          const abuse = await abuseRes.json();
          abuseData = {
            listed: abuse.ip?.appears > 0,
            frequency: abuse.ip?.frequency || 0,
            lastseen: abuse.ip?.lastseen || null
          };
        }
      } catch {}

      setResult({ geo, abuse: abuseData, ip });
    } catch (err) {
      setError(`Lookup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const r = result;

  const riskColor = () => {
    if (!r) return '#888';
    if (r.abuse?.listed) return '#ef4444';
    if (r.geo?.connection?.type === 'hosting' || r.geo?.connection?.type === 'tor') return '#f97316';
    return '#10b981';
  };

  const riskLabel = () => {
    if (!r) return '';
    if (r.abuse?.listed) return `FLAGGED · ${r.abuse.frequency} reports`;
    if (r.geo?.connection?.type === 'tor') return 'TOR EXIT NODE';
    if (r.geo?.connection?.type === 'hosting') return 'HOSTING / VPS';
    if (r.geo?.connection?.type === 'proxy') return 'PROXY';
    return 'CLEAN';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="8.8.8.8 or 2001:4860::"
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#06b6d4'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={lookup} disabled={loading || !input} style={{
          background: loading || !input ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.2)',
          border: '1px solid #06b6d450', color: loading || !input ? '#1a4a5a' : '#06b6d4',
          padding: '8px 14px', borderRadius: '6px', cursor: loading || !input ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : 'Lookup'}
        </button>
      </div>

      <div style={{ color: '#2a3a2a', fontSize: '0.6rem' }}>
        Sources: ipwho.is (geo/ASN) · StopForumSpam (abuse reports) · No API key required
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', color: '#ef4444', fontSize: '0.72rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#555', fontSize: '0.75rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #06b6d425', borderTopColor: '#06b6d4', animation: 'ipspin 0.7s linear infinite' }} />
          Querying geo and reputation databases…
          <style>{`@keyframes ipspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {r && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Risk banner */}
          <div style={{
            background: `${riskColor()}08`,
            border: `1px solid ${riskColor()}30`,
            borderRadius: '8px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '1.4rem' }}>
              {r.abuse?.listed ? '🚨' : r.geo?.connection?.type === 'hosting' ? '⚠️' : '✅'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: riskColor(), fontWeight: 'bold', fontSize: '0.82rem', fontFamily: 'monospace' }}>{r.ip}</div>
              <div style={{ color: riskColor(), fontSize: '0.68rem', marginTop: '2px', letterSpacing: '0.5px' }}>{riskLabel()}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {r.geo?.connection?.type && <Badge label={r.geo.connection.type.toUpperCase()} color="#06b6d4" />}
              {r.geo?.is_eu && <Badge label="EU" color="#3b82f6" />}
              {r.geo?.security?.is_proxy && <Badge label="PROXY" color="#f97316" />}
              {r.geo?.security?.is_tor && <Badge label="TOR" color="#ef4444" />}
              {r.geo?.security?.is_vpn && <Badge label="VPN" color="#f97316" />}
              {r.geo?.security?.is_datacenter && <Badge label="DATACENTER" color="#fbbf24" />}
            </div>
          </div>

          {/* Geo info */}
          <InfoGrid items={[
            { label: 'COUNTRY', value: r.geo.country ? `${r.geo.flag?.emoji || ''} ${r.geo.country}` : null },
            { label: 'CITY / REGION', value: [r.geo.city, r.geo.region].filter(Boolean).join(', ') || null },
            { label: 'LATITUDE', value: r.geo.latitude?.toString(), mono: true },
            { label: 'LONGITUDE', value: r.geo.longitude?.toString(), mono: true },
            { label: 'TIMEZONE', value: r.geo.timezone?.id },
            { label: 'CURRENCY', value: r.geo.currency?.code },
          ]} />

          {/* Network info */}
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '0.6rem', color: '#446644', letterSpacing: '1px', marginBottom: '8px' }}>NETWORK</div>
            <InfoGrid items={[
              { label: 'ISP / ORG', value: r.geo.connection?.isp || r.geo.connection?.org },
              { label: 'ASN', value: r.geo.connection?.asn ? `AS${r.geo.connection.asn}` : null, mono: true },
              { label: 'CONNECTION TYPE', value: r.geo.connection?.type?.toUpperCase() },
              { label: 'DOMAIN', value: r.geo.connection?.domain, mono: true },
            ]} />
          </div>

          {/* Abuse report */}
          {r.abuse && (
            <div style={{
              background: r.abuse.listed ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
              border: `1px solid ${r.abuse.listed ? '#ef444425' : '#10b98125'}`,
              borderRadius: '8px', padding: '10px 12px'
            }}>
              <div style={{ fontSize: '0.6rem', color: r.abuse.listed ? '#ef4444' : '#10b981', letterSpacing: '1px', marginBottom: '6px' }}>
                ABUSE REPUTATION (StopForumSpam)
              </div>
              {r.abuse.listed ? (
                <div style={{ color: '#ef9999', fontSize: '0.72rem' }}>
                  🚨 This IP has <strong style={{ color: '#ef4444' }}>{r.abuse.frequency} abuse reports</strong>.
                  {r.abuse.lastseen && ` Last seen: ${new Date(r.abuse.lastseen).toLocaleDateString()}`}
                </div>
              ) : (
                <div style={{ color: '#446644', fontSize: '0.72rem' }}>
                  ✅ No abuse reports found in StopForumSpam database.
                </div>
              )}
            </div>
          )}

          <div style={{ color: '#282828', fontSize: '0.58rem', textAlign: 'center' }}>
            ipwho.is · stopforumspam.org · For informational purposes only
          </div>
        </div>
      )}
    </div>
  );
}