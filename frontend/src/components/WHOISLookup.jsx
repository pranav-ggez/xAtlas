import { useState } from 'react';

// Uses whoisjson.com — free, no API key, CORS-permissive
// Falls back to rdap.org (IANA standard) if primary fails
const WHOIS_API  = 'https://www.whoisjsonapi.com/v1/';
const RDAP_API   = 'https://rdap.org/domain/';

function cleanDomain(input) {
  return input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();
}

function Row({ label, value, mono, color }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #0d0d0d', alignItems: 'flex-start' }}>
      <span style={{ color: '#446644', fontSize: '0.65rem', letterSpacing: '0.5px', minWidth: '110px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
      <span style={{ color: color || '#ccc', fontSize: '0.72rem', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: '1.4', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

export default function WHOISLookup() {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const lookup = async () => {
    const domain = cleanDomain(input);
    if (!domain || domain.length < 3) { setError('Enter a valid domain.'); return; }
    setLoading(true); setError(null); setResult(null);

    try {
      // Primary: whoisjsonapi
      let data = null;
      try {
        const res = await fetch(`${WHOIS_API}${encodeURIComponent(domain)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.domain_name) data = { source: 'WHOIS', ...json };
        }
      } catch {}

      // Fallback: RDAP (IANA standard, always available)
      if (!data) {
        const res = await fetch(`${RDAP_API}${encodeURIComponent(domain)}`);
        if (!res.ok) throw new Error(`RDAP returned ${res.status}`);
        const json = await res.json();

        const getEntity = (roles) => json.entities?.find(e => e.roles?.some(r => roles.includes(r)));
        const registrant = getEntity(['registrant']);
        const registrar  = getEntity(['registrar']);

        const vcardName = (entity) => entity?.vcardArray?.[1]?.find(f => f[0] === 'fn')?.[3] || null;

        data = {
          source: 'RDAP',
          domain_name: json.ldhName || domain.toUpperCase(),
          registrar: vcardName(registrar) || registrar?.handle || null,
          registrant_name: vcardName(registrant),
          creation_date: json.events?.find(e => e.eventAction === 'registration')?.eventDate,
          expiration_date: json.events?.find(e => e.eventAction === 'expiration')?.eventDate,
          updated_date: json.events?.find(e => e.eventAction === 'last changed')?.eventDate,
          status: json.status?.join(', '),
          name_servers: json.nameservers?.map(n => n.ldhName).join(', '),
          dnssec: json.secureDNS?.delegationSigned ? 'Signed' : 'Unsigned',
        };
      }

      setResult(data);
    } catch (err) {
      setError(`Lookup failed: ${err.message}. Some TLDs block public WHOIS.`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const isExpiringSoon = (d) => {
    if (!d) return false;
    try { return (new Date(d) - Date.now()) < 30 * 24 * 60 * 60 * 1000; }
    catch { return false; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text" value={input}
          onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="example.com"
          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #1e2e1e', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = '#1e2e1e'}
        />
        <button onClick={lookup} disabled={loading || !input} style={{
          background: loading || !input ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)',
          border: '1px solid #10b98150', color: loading || !input ? '#2a6a4a' : '#10b981',
          padding: '8px 14px', borderRadius: '6px', cursor: loading || !input ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0
        }}>
          {loading ? '⟳' : 'Lookup'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', color: '#ef4444', fontSize: '0.72rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: '#555', fontSize: '0.75rem' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #10b98125', borderTopColor: '#10b981', animation: 'wspin 0.7s linear infinite' }} />
          Querying WHOIS database…
          <style>{`@keyframes wspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {result && !loading && (
        <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.06)', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace' }}>{result.domain_name}</span>
            <span style={{ color: '#2a4a2a', fontSize: '0.6rem' }}>via {result.source}</span>
          </div>
          <div style={{ padding: '4px 12px 8px' }}>
            <Row label="REGISTRAR"    value={result.registrar} />
            <Row label="REGISTRANT"   value={result.registrant_name} />
            <Row label="CREATED"      value={formatDate(result.creation_date)} />
            <Row label="EXPIRES"      value={formatDate(result.expiration_date)} color={isExpiringSoon(result.expiration_date) ? '#f97316' : null} />
            <Row label="UPDATED"      value={formatDate(result.updated_date)} />
            <Row label="STATUS"       value={result.status} mono />
            <Row label="NAME SERVERS" value={result.name_servers} mono />
            <Row label="DNSSEC"       value={result.dnssec} color={result.dnssec === 'Signed' ? '#10b981' : '#f97316'} />
          </div>
          {isExpiringSoon(result.expiration_date) && (
            <div style={{ margin: '0 12px 10px', background: 'rgba(249,115,22,0.08)', border: '1px solid #f9731625', borderRadius: '6px', padding: '6px 10px', color: '#f97316', fontSize: '0.68rem' }}>
              ⚠️ Domain expires within 30 days
            </div>
          )}
        </div>
      )}
    </div>
  );
}