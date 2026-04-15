import { useState } from 'react';

export default function SearchPanel({ onSelectTool }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [excuse, setExcuse] = useState(null);

  const performSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return;

    setLoading(true);
    setSearched(true);
    setResults([]);
    setExcuse(null);

    try {
      const apiUrl = `/api/tools/search?query=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data || []);
        setExcuse(data.excuse || null);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <h3 style={{ 
        margin: '0 0 8px 0', 
        color: '#10b981', 
        fontSize: '0.8rem', 
        textTransform: 'uppercase',
        borderBottom: '1px solid #333',
        paddingBottom: '6px'
      }}>
        🔍 FIND ALTERNATIVE
      </h3>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Photoshop..."
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #333',
              color: '#fff',
              padding: '6px',
              borderRadius: '4px',
              outline: 'none',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: loading ? '#555' : '#10b981',
              color: '#000',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem'
            }}
          >
            {loading ? '...' : 'SCAN'}
          </button>
        </div>
      </form>

      {excuse && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #f59e0b',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '8px',
          color: '#fbbf24',
          fontSize: '0.75rem',
          lineHeight: '1.4'
        }}>
          <strong>⚠️ Advisory:</strong><br/>
          {excuse}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {results.map((tool) => (
            <div 
              key={tool.id} 
              onClick={() => onSelectTool(tool)}
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid #10b981',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{tool.name}</span>
                <span style={{ 
                  fontSize: '0.6rem', 
                  background: tool.signed_releases ? '#10b981' : '#f59e0b', 
                  color: '#000', 
                  padding: '2px 4px', 
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}>
                  {tool.signed_releases ? '✓' : '!'}
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#888' }}>
                Alt: {tool.proprietary_alternative}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div style={{ textAlign: 'center', color: '#555', padding: '8px', fontSize: '0.7rem' }}>
          Try: Photoshop • SolidWorks • MATLAB
        </div>
      )}
    </div>
  );
}