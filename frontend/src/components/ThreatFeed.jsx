export default function ThreatFeed({ attacks }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {attacks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#555', 
          padding: '15px', 
          fontSize: '0.8rem',
          fontStyle: 'italic'
        }}>
          Monitoring...
        </div>
      ) : (
        attacks.map((attack) => (
          <div 
            key={attack.id} 
            style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              borderLeft: `3px solid ${
                attack.severity === 'Critical' ? '#ef4444' : 
                attack.severity === 'High' ? '#f97316' : '#fbbf24'
              }`, 
              padding: '6px 8px',
              borderRadius: '0 4px 4px 0',
              marginBottom: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
              e.target.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.05)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2px' 
            }}>
              <span style={{ 
                color: attack.severity === 'Critical' ? '#ef4444' : 
                       attack.severity === 'High' ? '#f97316' : '#fbbf24', 
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}>
                {attack.attack_type}
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                color: '#666',
                fontFamily: 'monospace'
              }}>
                {attack.timestamp}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
              {attack.source_country} → {attack.target_country}
            </div>
            <div style={{ 
              fontSize: '0.65rem', 
              color: attack.severity === 'Critical' ? '#ef4444' : '#888',
              fontWeight: attack.severity === 'Critical' ? 'bold' : 'normal',
              textTransform: 'uppercase'
            }}>
              {attack.severity}
            </div>
          </div>
        ))
      )}
    </div>
  );
}