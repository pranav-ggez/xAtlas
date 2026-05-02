import { useState } from 'react';

// Pure frontend — no API calls, no key needed
// Parses raw email headers to extract: hops, IPs, SPF/DKIM/DMARC, spoofing indicators

function parseHeaders(raw) {
  // Unfold multi-line headers (RFC 2822: continuation lines start with whitespace)
  const unfolded = raw.replace(/\r?\n[\t ]+/g, ' ');

  const lines = unfolded.split(/\r?\n/);
  const headers = {};
  const received = [];

  for (const line of lines) {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    if (key === 'received') {
      received.push(val);
    } else {
      if (!headers[key]) headers[key] = [];
      headers[key].push(val);
    }
  }

  return { headers, received };
}

function extractIPs(str) {
  const ipRegex = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
  return [...new Set((str.match(ipRegex) || []).filter(ip => {
    const parts = ip.split('.').map(Number);
    // Filter private/loopback
    if (parts[0] === 127) return false;
    if (parts[0] === 10) return false;
    if (parts[0] === 192 && parts[1] === 168) return false;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    return true;
  }))];
}

function parseAuthentication(authHeader) {
  if (!authHeader) return null;
  const result = {};
  const checks = ['spf', 'dkim', 'dmarc', 'arc'];
  for (const check of checks) {
    const m = authHeader.match(new RegExp(`${check}=([\\w-]+)`, 'i'));
    if (m) result[check] = m[1].toLowerCase();
  }
  return result;
}

function parseDelay(receivedStr) {
  // "X-Google-DKIM-Signature" style — extract timestamp from ";" in Received header
  const m = receivedStr.match(/;\s*(.+)$/);
  if (!m) return null;
  try { return new Date(m[1].trim()); } catch { return null; }
}

function statusColor(val) {
  if (!val) return '#888';
  if (['pass', 'passed'].includes(val)) return '#10b981';
  if (['fail', 'failed', 'none', 'softfail'].includes(val)) return '#ef4444';
  if (['neutral', 'permerror', 'temperror'].includes(val)) return '#f97316';
  return '#fbbf24';
}

function Row({ label, value, mono, color, wrap }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #0d0d0d', alignItems: 'flex-start' }}>
      <span style={{ color: '#7a5a2a', fontSize: '0.65rem', letterSpacing: '0.5px', minWidth: '110px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
      <span style={{ color: color || '#ccc', fontSize: '0.72rem', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: '1.4', wordBreak: wrap ? 'break-all' : 'normal' }}>{value}</span>
    </div>
  );
}

function AuthBadge({ label, value }) {
  const color = statusColor(value);
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}30`,
      borderRadius: '6px', padding: '8px 10px', textAlign: 'center', flex: 1
    }}>
      <div style={{ fontSize: '0.58rem', color: '#555', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
      <div style={{
        fontSize: '0.72rem', fontWeight: 'bold', color,
        textTransform: 'uppercase', letterSpacing: '0.5px'
      }}>{value || 'N/A'}</div>
    </div>
  );
}

const EXAMPLE = `Delivered-To: user@example.com
Received: from mail.sender.com (mail.sender.com [203.0.113.42])
        by mx.example.com with ESMTPS id abc123
        for <user@example.com>;
        Mon, 3 Apr 2026 14:22:11 +0000
Received: from [192.168.1.5] (unknown [203.0.113.42])
        by mail.sender.com with ESMTP id xyz789
        for <user@example.com>;
        Mon, 3 Apr 2026 14:22:08 +0000
Authentication-Results: mx.example.com;
        dkim=pass header.i=@sender.com;
        spf=pass smtp.mailfrom=sender.com;
        dmarc=pass action=none header.from=sender.com
From: Alice <alice@sender.com>
To: user@example.com
Subject: Hello
Date: Mon, 3 Apr 2026 14:22:07 +0000
Message-ID: <abc123@sender.com>`;

export default function EmailHeaderAnalyzer() {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const analyze = () => {
    const raw = input.trim();
    if (!raw || raw.length < 20) { setError('Paste raw email headers to analyze.'); return; }
    setError(null); setResult(null);

    try {
      const { headers, received } = parseHeaders(raw);

      // Auth results
      const authRaw = headers['authentication-results']?.[0] || '';
      const auth = parseAuthentication(authRaw);

      // All public IPs across all Received headers
      const allIPs = [...new Set(received.flatMap(r => extractIPs(r)))];

      // Hop timing — parse timestamps from Received headers
      const hops = received.map((r, i) => {
        const ts = parseDelay(r);
        const ips = extractIPs(r);
        const fromMatch = r.match(/from\s+([^\s(]+)/i);
        const byMatch   = r.match(/by\s+([^\s(]+)/i);
        return {
          index: received.length - i,
          raw: r,
          from: fromMatch?.[1] || null,
          by: byMatch?.[1] || null,
          ips,
          timestamp: ts
        };
      }).reverse(); // chronological order

      // Delay between hops
      for (let i = 1; i < hops.length; i++) {
        if (hops[i].timestamp && hops[i-1].timestamp) {
          hops[i].delaySec = Math.round((hops[i].timestamp - hops[i-1].timestamp) / 1000);
        }
      }

      // Spoofing indicators
      const warnings = [];
      const fromHeader  = headers['from']?.[0] || '';
      const replyTo     = headers['reply-to']?.[0] || '';
      const returnPath  = headers['return-path']?.[0] || '';

      // From vs Reply-To mismatch
      const fromDomain     = fromHeader.match(/@([^>)]+)/)?.[1]?.toLowerCase();
      const replyToDomain  = replyTo.match(/@([^>)]+)/)?.[1]?.toLowerCase();
      const returnDomain   = returnPath.match(/@([^>)]+)/)?.[1]?.toLowerCase();

      if (replyToDomain && fromDomain && replyToDomain !== fromDomain)
        warnings.push(`Reply-To domain (${replyToDomain}) differs from From domain (${fromDomain})`);
      if (returnDomain && fromDomain && returnDomain !== fromDomain)
        warnings.push(`Return-Path domain (${returnDomain}) differs from From domain (${fromDomain})`);
      if (auth?.spf === 'fail' || auth?.spf === 'softfail')
        warnings.push(`SPF ${auth.spf.toUpperCase()} — sender IP not authorized for this domain`);
      if (auth?.dkim === 'fail')
        warnings.push('DKIM signature verification failed — message may be tampered');
      if (auth?.dmarc === 'fail')
        warnings.push('DMARC policy failed — high spoofing risk');
      if (!auth?.spf && !auth?.dkim)
        warnings.push('No SPF or DKIM authentication results found');

      setResult({
        from:       fromHeader,
        to:         headers['to']?.[0],
        subject:    headers['subject']?.[0],
        date:       headers['date']?.[0],
        messageId:  headers['message-id']?.[0],
        replyTo,
        returnPath,
        auth,
        authRaw,
        hops,
        allIPs,
        warnings,
        totalHeaders: Object.keys(headers).length
      });
    } catch (err) {
      setError(`Parse error: ${err.message}`);
    }
  };

  const r = result;
  const riskColor = !r ? '#888'
    : r.warnings.length > 2 ? '#ef4444'
    : r.warnings.length > 0 ? '#f97316'
    : '#10b981';
  const riskLabel = !r ? ''
    : r.warnings.length > 2 ? 'HIGH RISK — Likely Malicious'
    : r.warnings.length > 0 ? 'SUSPICIOUS — Review Carefully'
    : 'CLEAN — Authentication Passed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Textarea */}
      <textarea
        value={input}
        onChange={e => { setInput(e.target.value); setError(null); setResult(null); }}
        placeholder="Paste raw email headers here…"
        rows={5}
        style={{
          width: '100%', background: 'rgba(0,0,0,0.5)',
          border: '1px solid #2a1e0e', borderRadius: '6px',
          padding: '8px 10px', color: '#ccc', fontSize: '0.72rem',
          outline: 'none', fontFamily: 'monospace', lineHeight: '1.5',
          resize: 'vertical', boxSizing: 'border-box',
          transition: 'border-color 0.15s'
        }}
        onFocus={e => e.target.style.borderColor = '#f59e0b'}
        onBlur={e => e.target.style.borderColor = '#2a1e0e'}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={analyze} disabled={!input} style={{
          flex: 1,
          background: !input ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.2)',
          border: '1px solid #f59e0b50',
          color: !input ? '#5a3a00' : '#f59e0b',
          padding: '8px 14px', borderRadius: '6px',
          cursor: !input ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem', fontWeight: 'bold'
        }}>
          🔍 Analyze Headers
        </button>
        <button onClick={() => { setInput(EXAMPLE); setResult(null); setError(null); }} style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid #222',
          color: '#444', padding: '8px 12px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '0.7rem'
        }}>
          Load Example
        </button>
      </div>

      <div style={{ color: '#2a2a2a', fontSize: '0.6rem' }}>
        Pure client-side · No data sent anywhere · Detects spoofing, SPF/DKIM/DMARC, hop analysis
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425', borderRadius: '6px', padding: '8px 12px', color: '#ef4444', fontSize: '0.72rem' }}>
          ⚠️ {error}
        </div>
      )}

      {r && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Risk banner */}
          <div style={{
            background: `${riskColor}08`, border: `1px solid ${riskColor}30`,
            borderRadius: '8px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '1.4rem' }}>
              {r.warnings.length > 2 ? '🚨' : r.warnings.length > 0 ? '⚠️' : '✅'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: riskColor, fontWeight: 'bold', fontSize: '0.8rem' }}>{riskLabel}</div>
              <div style={{ color: '#555', fontSize: '0.65rem', marginTop: '2px' }}>
                {r.hops.length} mail hop{r.hops.length !== 1 ? 's' : ''} · {r.allIPs.length} public IP{r.allIPs.length !== 1 ? 's' : ''} · {r.totalHeaders} headers
              </div>
            </div>
          </div>

          {/* Auth results */}
          {r.auth && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <AuthBadge label="SPF"   value={r.auth.spf} />
              <AuthBadge label="DKIM"  value={r.auth.dkim} />
              <AuthBadge label="DMARC" value={r.auth.dmarc} />
              {r.auth.arc && <AuthBadge label="ARC" value={r.auth.arc} />}
            </div>
          )}

          {/* Warnings */}
          {r.warnings.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid #ef444420', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.6rem', color: '#ef4444', letterSpacing: '1px', marginBottom: '8px' }}>SPOOFING INDICATORS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {r.warnings.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#ef4444', flexShrink: 0, fontSize: '0.7rem' }}>⚠</span>
                    <span style={{ color: '#cc8888', fontSize: '0.7rem', lineHeight: '1.4' }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Envelope info */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid #111' }}>
              <span style={{ color: '#7a5a2a', fontSize: '0.6rem', letterSpacing: '1px' }}>ENVELOPE</span>
            </div>
            <div style={{ padding: '4px 12px 8px' }}>
              <Row label="FROM"        value={r.from} wrap />
              <Row label="TO"          value={r.to} wrap />
              <Row label="SUBJECT"     value={r.subject} />
              <Row label="DATE"        value={r.date} />
              <Row label="MESSAGE-ID"  value={r.messageId} mono wrap />
              <Row label="REPLY-TO"    value={r.replyTo}    color={r.replyTo && r.replyTo !== r.from ? '#f97316' : null} wrap />
              <Row label="RETURN-PATH" value={r.returnPath} mono wrap />
            </div>
          </div>

          {/* Hop chain */}
          {r.hops.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.6rem', color: '#7a5a2a', letterSpacing: '1px', marginBottom: '8px' }}>
                MAIL HOP CHAIN ({r.hops.length} hops)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {r.hops.map((hop, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,0,0,0.3)', border: '1px solid #111',
                    borderRadius: '6px', padding: '8px 10px',
                    borderLeft: `2px solid ${hop.ips.length ? '#f59e0b' : '#333'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#f59e0b', fontSize: '0.6rem', fontWeight: 'bold' }}>HOP {hop.index}</span>
                      {hop.delaySec !== undefined && (
                        <span style={{
                          color: hop.delaySec > 300 ? '#f97316' : '#555',
                          fontSize: '0.58rem', fontFamily: 'monospace'
                        }}>+{hop.delaySec}s</span>
                      )}
                      {hop.ips.map(ip => (
                        <span key={ip} style={{
                          background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b30',
                          color: '#f59e0b', padding: '1px 6px',
                          borderRadius: '3px', fontSize: '0.6rem', fontFamily: 'monospace'
                        }}>{ip}</span>
                      ))}
                      {hop.timestamp && (
                        <span style={{ marginLeft: 'auto', color: '#333', fontSize: '0.58rem', fontFamily: 'monospace' }}>
                          {hop.timestamp.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {hop.from && <span style={{ color: '#555', fontSize: '0.62rem', fontFamily: 'monospace' }}>{hop.from}</span>}
                      {hop.from && hop.by && <span style={{ color: '#333', fontSize: '0.6rem' }}>→</span>}
                      {hop.by && <span style={{ color: '#666', fontSize: '0.62rem', fontFamily: 'monospace' }}>{hop.by}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public IPs found */}
          {r.allIPs.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.6rem', color: '#7a5a2a', letterSpacing: '1px', marginBottom: '8px' }}>
                PUBLIC IPs FOUND
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {r.allIPs.map(ip => (
                  <span key={ip} style={{
                    background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b25',
                    color: '#d97706', padding: '3px 8px',
                    borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace'
                  }}>{ip}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ color: '#282828', fontSize: '0.58rem', textAlign: 'center' }}>
            Parsed client-side · No data leaves your browser · For investigative purposes only
          </div>
        </div>
      )}
    </div>
  );
}