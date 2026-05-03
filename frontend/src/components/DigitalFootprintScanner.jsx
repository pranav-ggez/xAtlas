import { useState } from 'react';

// ipwho.is — free, no key, CORS-open
const IPWHO = 'https://ipwho.is/';

function Row({ label, value, mono, color, warn }) {
  if (value === null || value === undefined) return null;
  const c = warn ? '#f97316' : color || '#ccc';
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #0d0d0d', alignItems: 'flex-start' }}>
      <span style={{ color: '#446644', fontSize: '0.65rem', minWidth: '130px', flexShrink: 0, paddingTop: '1px', letterSpacing: '0.3px' }}>{label}</span>
      <span style={{ color: c, fontSize: '0.72rem', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: '1.4', wordBreak: 'break-all' }}>{String(value)}</span>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 12px', background: `${color}08`, borderBottom: '1px solid #111', fontSize: '0.6rem', color, letterSpacing: '1px', fontWeight: 'bold' }}>
        {title}
      </div>
      <div style={{ padding: '4px 12px 8px' }}>{children}</div>
    </div>
  );
}

export default function DigitalFootprintScanner() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true); setResult(null);

    // 1. Public IP + geo via ipwho.is
    let ipData = null;
    try {
      const res = await fetch(IPWHO);
      if (res.ok) ipData = await res.json();
    } catch {}

    // 2. Browser fingerprint — all from real browser APIs
    const nav = navigator;
    const screen = window.screen;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    // Storage usage
    let storageEstimate = null;
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        storageEstimate = {
          used: est.usage ? `${(est.usage / 1024 / 1024).toFixed(2)} MB` : '—',
          quota: est.quota ? `${(est.quota / 1024 / 1024 / 1024).toFixed(2)} GB` : '—',
        };
      }
    } catch {}

    // Cookie count (document.cookie returns all accessible cookies as a string)
    const cookieCount = document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0;

    // localStorage item count
    let lsCount = 0;
    try { lsCount = localStorage.length; } catch {}

    // sessionStorage item count
    let ssCount = 0;
    try { ssCount = sessionStorage.length; } catch {}

    // Canvas fingerprint — unique per browser/GPU combination
    let canvasHash = '—';
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('xAtlas fingerprint 🔒', 2, 2);
      const data = canvas.toDataURL();
      // Simple hash of the canvas data
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i);
        hash |= 0;
      }
      canvasHash = `0x${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`;
    } catch {}

    // WebGL renderer info
    let webglInfo = '—';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbgInfo) {
          const renderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL);
          webglInfo = renderer || '—';
        }
      }
    } catch {}

    // Timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = new Date().getTimezoneOffset();

    // Languages
    const languages = nav.languages?.join(', ') || nav.language || '—';

    // Do Not Track
    const dnt = nav.doNotTrack === '1' ? 'Enabled' : nav.doNotTrack === '0' ? 'Disabled' : 'Not set';

    // Secure context
    const isSecure = window.isSecureContext;

    // Dark mode
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;

    setResult({
      ip: ipData,
      browser: {
        userAgent: nav.userAgent,
        platform: nav.platform,
        vendor: nav.vendor || '—',
        language: languages,
        cookiesEnabled: nav.cookieEnabled,
        dnt,
        online: nav.onLine,
        timezone,
        timezoneOffset: `UTC${timezoneOffset <= 0 ? '+' : ''}${-timezoneOffset / 60}`,
        prefersDark,
        isSecure,
      },
      screen: {
        resolution: `${screen.width}×${screen.height}`,
        colorDepth: `${screen.colorDepth}-bit`,
        pixelRatio: `${window.devicePixelRatio}x`,
        touchPoints: nav.maxTouchPoints || 0,
      },
      fingerprint: {
        canvasHash,
        webglRenderer: webglInfo,
        hardwareConcurrency: nav.hardwareConcurrency || '—',
        deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB` : '—',
      },
      network: conn ? {
        type: conn.effectiveType || conn.type || '—',
        downlink: conn.downlink ? `${conn.downlink} Mbps` : '—',
        rtt: conn.rtt ? `${conn.rtt} ms` : '—',
        saveData: conn.saveData ? 'Enabled' : 'Disabled',
      } : null,
      storage: { cookieCount, lsCount, ssCount, ...storageEstimate },
    });

    setLoading(false);
  };

  const r = result;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ color: '#446644', fontSize: '0.72rem', lineHeight: '1.5' }}>
        Scans your real browser environment — public IP, fingerprint identifiers, storage usage, and network info. Nothing is sent to any server except for the IP lookup.
      </div>

      <button onClick={scan} disabled={loading} style={{
        background: loading ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)',
        border: '1px solid #10b98150', color: loading ? '#2a6a4a' : '#10b981',
        padding: '10px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.78rem', fontWeight: 'bold', width: '100%', transition: 'all 0.15s'
      }}>
        {loading ? '⟳ Scanning your environment…' : '🔍 Scan My Digital Footprint'}
      </button>

      {r && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Public IP */}
          {r.ip && (
            <Section title="🌐 PUBLIC IP & NETWORK LOCATION" color="#10b981">
              <Row label="IP Address" value={r.ip.ip} mono color="#10b981" />
              <Row label="Country" value={r.ip.country ? `${r.ip.flag?.emoji || ''} ${r.ip.country}` : null} />
              <Row label="City / Region" value={[r.ip.city, r.ip.region].filter(Boolean).join(', ') || null} />
              <Row label="ISP / Org" value={r.ip.connection?.isp || r.ip.connection?.org} />
              <Row label="ASN" value={r.ip.connection?.asn ? `AS${r.ip.connection.asn}` : null} mono />
              <Row label="Timezone" value={r.ip.timezone?.id} />
              <Row label="Connection Type" value={r.ip.connection?.type?.toUpperCase()} />
              {r.ip.security?.is_vpn && <Row label="VPN Detected" value="⚠️ Yes" warn />}
              {r.ip.security?.is_proxy && <Row label="Proxy Detected" value="⚠️ Yes" warn />}
              {r.ip.security?.is_tor && <Row label="Tor Detected" value="⚠️ Yes" warn />}
            </Section>
          )}

          {/* Browser */}
          <Section title="🌍 BROWSER ENVIRONMENT" color="#3b82f6">
            <Row label="Platform" value={r.browser.platform} />
            <Row label="Language(s)" value={r.browser.language} />
            <Row label="Timezone" value={`${r.browser.timezone} (${r.browser.timezoneOffset})`} />
            <Row label="Dark Mode" value={r.browser.prefersDark ? 'Enabled' : 'Disabled'} />
            <Row label="Do Not Track" value={r.browser.dnt} warn={r.browser.dnt === 'Not set'} />
            <Row label="Cookies" value={r.browser.cookiesEnabled ? 'Enabled' : 'Disabled'} warn={!r.browser.cookiesEnabled} />
            <Row label="Secure Context" value={r.browser.isSecure ? 'Yes (HTTPS)' : '⚠️ No'} warn={!r.browser.isSecure} />
            <Row label="Online" value={r.browser.online ? 'Yes' : 'No'} />
          </Section>

          {/* Screen */}
          <Section title="🖥️ SCREEN & DEVICE" color="#8b5cf6">
            <Row label="Resolution" value={r.screen.resolution} mono />
            <Row label="Color Depth" value={r.screen.colorDepth} />
            <Row label="Pixel Ratio" value={r.screen.pixelRatio} />
            <Row label="Touch Points" value={r.screen.touchPoints} />
          </Section>

          {/* Fingerprint */}
          <Section title="🔏 FINGERPRINT SIGNALS" color="#f97316">
            <Row label="Canvas Hash" value={r.fingerprint.canvasHash} mono color="#f97316" />
            <Row label="WebGL Renderer" value={r.fingerprint.webglRenderer} mono />
            <Row label="CPU Cores" value={r.fingerprint.hardwareConcurrency} />
            <Row label="Device Memory" value={r.fingerprint.deviceMemory} />
          </Section>

          {/* Storage */}
          <Section title="💾 STORAGE USAGE" color="#fbbf24">
            <Row label="Cookies" value={`${r.storage.cookieCount} item(s)`} warn={r.storage.cookieCount > 10} />
            <Row label="localStorage" value={`${r.storage.lsCount} item(s)`} />
            <Row label="sessionStorage" value={`${r.storage.ssCount} item(s)`} />
            {r.storage.used && <Row label="Storage Used" value={r.storage.used} />}
            {r.storage.quota && <Row label="Storage Quota" value={r.storage.quota} />}
          </Section>

          {/* Network */}
          {r.network && (
            <Section title="📶 NETWORK CONNECTION" color="#06b6d4">
              <Row label="Effective Type" value={r.network.type?.toUpperCase()} />
              <Row label="Downlink" value={r.network.downlink} />
              <Row label="RTT" value={r.network.rtt} />
              <Row label="Data Saver" value={r.network.saveData} />
            </Section>
          )}

          <div style={{ color: '#282828', fontSize: '0.6rem', textAlign: 'center' }}>
            IP: ipwho.is · All other data read from browser APIs · Nothing stored
          </div>
        </div>
      )}
    </div>
  );
}