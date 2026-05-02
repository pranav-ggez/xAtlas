import { useState } from 'react';

// Shodan InternetDB — free, no API key, CORS-open
// Returns open ports, CPEs, tags, hostnames, vulns for any IP
const INTERNETDB_API = 'https://internetdb.shodan.io/';

function Badge({ label, color }) {
  return (
    <span style={{
      background: `${color}15`,
      border: `1px solid ${color}40`,
      color, padding: '2px 8px',
      borderRadius: '3px', fontSize: '0.62rem',
      fontWeight: 'bold', letterSpacing: '0.3px'
    }}>{label}</span>
  );
}

function Row({ label, value, mono, color }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #0d0d0d', alignItems: 'flex-start' }}>
      <span style={{ color: '#4a5a7a', fontSize: '0.65rem', letterSpacing: '0.5px', minWidth: '110px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
      <span style={{ color: color || '#ccc', fontSize: '0.72rem', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: '1.4', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function PortPill({ port }) {
  const wellKnown = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
    3306: 'MySQL', 3389: 'RDP', 5432: 'Postgres', 6379: 'Redis',
    8080: 'HTTP-Alt', 8443: 'HTTPS-Alt', 27017: 'MongoDB'
  };
  const risky = [21, 23, 445, 3389, 6379, 27017];
  const color = risky.includes(port) ? '#ef4444' : port === 443 || port === 22 ? '#10b981' : '#3b82f6';
  const label = wellKnown[port];
  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}35`,
      borderRadius: '5px', padding: '5px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
      minWidth: '50px'
    }}>
      <span style={{ color, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75rem' }}>{port}</span>
      {label && <span style={{ color: `${color}99`, fontSize: '0.52rem', letterSpacing: '0.3px' }}>{label}</span>}
    </div>
  );
}

export default function ShodanLookup() {
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
      const res = await fetch(`${INTERNETDB_API}${encodeURIComponent(ip)}`);
      if (res.status === 404) {
        setResult({ ip, empty: true });
        return;
      }
      if (!res.ok) throw new Error(`Shodan InternetDB returned ${res.status}`);
      const data = await res.json();
      setResult({ ip, ...data });
    } catch (err) {
      setError(`Lookup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const r = result;
  const vulnColor  = r?.vulns?.length  > 0 ? '#ef4444' : '#10b981';
  const portColor  = r?.ports?.length  > 10 ? '#f97316' : '#3b82f6';
  const riskLevel  = !r ? '' : r.empty ? 'NO DATA' : r.vulns?.length > 3 ? 'HIGH RISK' : r.vulns?.length > 0 ? 'MEDIUM RISK' : 'LOW RISK';
  const riskColor  = !r ? '#888' : r.empty ? '#555' : r.vulns?.length > 3 ? '#ef4444' : r.vulns?.length > 0 ? '#f97316' : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="1.1.1.1 or 2606:4700::"
          style={{
            flex: 1, background: 'rgba(0,0,0,0.5)',
            border: '1px solid #1a2a3a', borderRadius: '6px',
            padding: '8px 10px', color: '#fff', fontSize: '0.8rem',
            outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s'
          }}
          onFocus={e => e.target.style.borderColor = '#f97316'}
          onBlur={e => e.target.style.borderColor = '#1a2a3a'}
        />
        <button onClick={lookup} disabled={loading || !input} style={{
          background: loading || !input ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.2)',
          border: '1px solid #f9731650',
          color: loading || !input ? '#5a3010' : '#f97316',
          padding: '8px 14px', borderRadius: '6px',
          cursor: loading || !input ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : 'Scan'}
        </button>
      </div>

      <div style={{ color: '#2a2a2a', fontSize: '0.6rem' }}>
        Source: Shodan InternetDB · Free, no key · Open ports, CVEs, hostnames
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', color: '#ef4444', fontSize: '0.72rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#555', fontSize: '0.75rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #f9731625', borderTopColor: '#f97316', animation: 'shodspin 0.7s linear infinite' }} />
          Querying Shodan InternetDB…
          <style>{`@keyframes shodspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {r && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Risk banner */}
          <div style={{
            background: `${riskColor}08`, border: `1px solid ${riskColor}30`,
            borderRadius: '8px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '1.4rem' }}>
              {r.empty ? '🔍' : r.vulns?.length > 3 ? '🚨' : r.vulns?.length > 0 ? '⚠️' : '✅'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f97316', fontWeight: 'bold', fontSize: '0.82rem', fontFamily: 'monospace' }}>{r.ip}</div>
              <div style={{ color: riskColor, fontSize: '0.68rem', marginTop: '2px', letterSpacing: '0.5px' }}>{riskLevel}</div>
            </div>
            {!r.empty && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {r.ports?.length > 0  && <Badge label={`${r.ports.length} PORTS`}    color={portColor} />}
                {r.vulns?.length > 0  && <Badge label={`${r.vulns.length} CVEs`}     color={vulnColor} />}
                {r.tags?.includes('self-signed') && <Badge label="SELF-SIGNED" color="#fbbf24" />}
                {r.tags?.includes('honeypot')   && <Badge label="HONEYPOT"    color="#8b5cf6" />}
              </div>
            )}
          </div>

          {r.empty ? (
            <div style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #111' }}>
              No data found in Shodan InternetDB for this IP.
            </div>
          ) : (
            <>
              {/* Open ports */}
              {r.ports?.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#4a5a7a', letterSpacing: '1px', marginBottom: '8px' }}>OPEN PORTS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {r.ports.map(port => <PortPill key={port} port={port} />)}
                  </div>
                </div>
              )}

              {/* Hostnames */}
              {r.hostnames?.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(249,115,22,0.04)', borderBottom: '1px solid #111' }}>
                    <span style={{ color: '#4a5a7a', fontSize: '0.6rem', letterSpacing: '1px' }}>HOSTNAMES</span>
                  </div>
                  <div style={{ padding: '4px 12px 8px' }}>
                    {r.hostnames.map(h => (
                      <Row key={h} label="" value={h} mono />
                    ))}
                  </div>
                </div>
              )}

              {/* CVEs */}
              {r.vulns?.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid #ef444420', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#ef4444', letterSpacing: '1px', marginBottom: '8px' }}>KNOWN VULNERABILITIES</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {r.vulns.map(cve => (
                      <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444435',
                          color: '#ef4444', padding: '3px 8px', borderRadius: '4px',
                          fontSize: '0.65rem', fontFamily: 'monospace',
                          textDecoration: 'none', transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      >{cve}</a>
                    ))}
                  </div>
                </div>
              )}

              {/* CPEs */}
              {r.cpes?.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#4a5a7a', letterSpacing: '1px', marginBottom: '8px' }}>SOFTWARE / CPE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {r.cpes.slice(0, 6).map(cpe => (
                      <span key={cpe} style={{ color: '#666', fontSize: '0.65rem', fontFamily: 'monospace' }}>{cpe}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {r.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {r.tags.map(tag => (
                    <Badge key={tag} label={tag.toUpperCase()} color="#8b5cf6" />
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ color: '#282828', fontSize: '0.58rem', textAlign: 'center' }}>
            internetdb.shodan.io · For informational purposes only
          </div>
        </div>
      )}
    </div>
  );
}