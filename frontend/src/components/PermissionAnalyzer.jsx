import { useState } from 'react';

const PERMISSIONS = [
  { key: 'camera',        label: 'Camera',         icon: '📷', api: 'camera',        requestable: true },
  { key: 'microphone',    label: 'Microphone',      icon: '🎤', api: 'microphone',     requestable: true },
  { key: 'geolocation',   label: 'Location',        icon: '📍', api: 'geolocation',    requestable: true },
  { key: 'notifications', label: 'Notifications',   icon: '🔔', api: 'notifications',  requestable: false },
  { key: 'clipboard-read',label: 'Clipboard Read',  icon: '📋', api: 'clipboard-read', requestable: false },
  { key: 'clipboard-write',label:'Clipboard Write', icon: '✏️', api: 'clipboard-write',requestable: false },
];

function stateColor(state) {
  if (state === 'granted') return '#10b981';
  if (state === 'denied')  return '#ef4444';
  if (state === 'prompt')  return '#fbbf24';
  if (state === 'unsupported') return '#555';
  return '#888';
}

function stateIcon(state) {
  if (state === 'granted') return '✅';
  if (state === 'denied')  return '🚫';
  if (state === 'prompt')  return '❓';
  return '—';
}

export default function PermissionAnalyzer() {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading]         = useState(false);

  const checkAll = async () => {
    setLoading(true);
    const results = {};

    for (const perm of PERMISSIONS) {
      try {
        const status = await navigator.permissions.query({ name: perm.api });
        results[perm.key] = status.state; // 'granted' | 'denied' | 'prompt'
      } catch {
        results[perm.key] = 'unsupported';
      }
    }

    setPermissions(results);
    setLoading(false);
  };

  const grantedCount    = permissions ? Object.values(permissions).filter(s => s === 'granted').length : 0;
  const deniedCount     = permissions ? Object.values(permissions).filter(s => s === 'denied').length : 0;
  const promptCount     = permissions ? Object.values(permissions).filter(s => s === 'prompt').length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <div style={{ color: '#446644', fontSize: '0.72rem', lineHeight: '1.5' }}>
        Reads your browser's real permission states using the <code style={{ color: '#8b5cf6', fontSize: '0.7rem' }}>navigator.permissions</code> API. No requests are made — only current state is shown.
      </div>

      <button onClick={checkAll} disabled={loading} style={{
        background: loading ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.2)',
        border: '1px solid #8b5cf650', color: loading ? '#4a2a8a' : '#8b5cf6',
        padding: '10px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.78rem', fontWeight: 'bold', width: '100%', transition: 'all 0.15s'
      }}>
        {loading ? '⟳ Checking…' : '🔍 Check Browser Permissions'}
      </button>

      {permissions && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Summary */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: 'GRANTED', value: grantedCount, color: '#10b981' },
              { label: 'DENIED',  value: deniedCount,  color: '#ef4444' },
              { label: 'NOT SET', value: promptCount,  color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: `${s.color}0d`, border: `1px solid ${s.color}25`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ color: s.color, fontWeight: 'bold', fontSize: '1.3rem' }}>{s.value}</div>
                <div style={{ color: '#555', fontSize: '0.58rem', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-permission rows */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #111', borderRadius: '8px', overflow: 'hidden' }}>
            {PERMISSIONS.map((perm, i) => {
              const state = permissions[perm.key] || 'unsupported';
              const color = stateColor(state);
              return (
                <div key={perm.key} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px',
                  borderBottom: i < PERMISSIONS.length - 1 ? '1px solid #0d0d0d' : 'none',
                  background: state === 'granted' ? 'rgba(16,185,129,0.04)' : state === 'denied' ? 'rgba(239,68,68,0.04)' : 'transparent'
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{perm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#ccc', fontSize: '0.78rem', fontWeight: '500' }}>{perm.label}</div>
                    {state === 'prompt' && (
                      <div style={{ color: '#555', fontSize: '0.62rem', marginTop: '1px' }}>Not yet requested</div>
                    )}
                    {state === 'unsupported' && (
                      <div style={{ color: '#444', fontSize: '0.62rem', marginTop: '1px' }}>Not supported in this browser</div>
                    )}
                  </div>
                  <span style={{
                    background: `${color}15`, border: `1px solid ${color}40`,
                    color, padding: '3px 10px', borderRadius: '4px',
                    fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px',
                    flexShrink: 0
                  }}>
                    {stateIcon(state)} {state.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Risk note */}
          {grantedCount > 2 && (
            <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid #f9731625', borderRadius: '6px', padding: '8px 12px', color: '#f97316', fontSize: '0.72rem' }}>
              ⚠️ {grantedCount} permissions are currently granted. Review which sites have access via your browser's site settings.
            </div>
          )}

          <div style={{ color: '#282828', fontSize: '0.6rem', textAlign: 'center' }}>
            Read-only · Uses navigator.permissions API · No data leaves your browser
          </div>
        </div>
      )}
    </div>
  );
}