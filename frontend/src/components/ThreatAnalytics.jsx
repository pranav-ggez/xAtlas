import React from 'react';

export default function ThreatAnalytics() {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>📊</span>
        <h3>ATTACK ANALYTICS</h3>
      </div>
      <div style={styles.content}>
        <div style={styles.statRow}>
          <span>Top Vector</span>
          <span style={styles.val}>DDoS (45%)</span>
        </div>
        <div style={styles.statRow}>
          <span>Top Target</span>
          <span style={styles.val}>Financial Sector</span>
        </div>
        <div style={styles.statRow}>
          <span>Avg Severity</span>
          <span style={{...styles.val, color: '#ef4444'}}>CRITICAL</span>
        </div>
        {/* Fake Bar Chart */}
        <div style={styles.chart}>
          <div style={{...styles.bar, width: '80%'}}>DDoS</div>
          <div style={{...styles.bar, width: '60%', background: '#f97316'}}>Phishing</div>
          <div style={{...styles.bar, width: '40%', background: '#3b82f6'}}>Malware</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#0a0f0a', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', height: '100%' },
  header: { padding: '12px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px', background: '#111' },
  icon: { fontSize: '1.2rem' },
  h3: { margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' },
  content: { padding: '15px' },
  statRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem', color: '#aaa' },
  val: { color: '#fff', fontWeight: 'bold' },
  chart: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
  bar: { height: '25px', background: '#ef4444', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '10px', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }
};