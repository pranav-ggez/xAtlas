import { useState, useEffect, useCallback, useRef } from 'react';

// RSS feeds proxied through allorigins.win (free, no key needed, CORS-safe)
const RSS_FEEDS = [
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', color: '#ef4444' },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', color: '#f97316' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', color: '#fbbf24' },
  { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', color: '#3b82f6' },
  { name: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', color: '#10b981' },
];

// Live YouTube streams — these are public 24/7 live news channels
const LIVE_STREAMS = [
  {
    id: 'stream-wion',
    label: 'WION',
    flag: '🇮🇳',
    tag: 'INDIA',
    tagColor: '#f97316',
    videoId: 'SnFSaD7FKuI', // WION Live — Indian global news, reliable 24/7
    desc: 'World Is One News'
  },
  {
    id: 'stream-ndtv',
    label: 'NDTV 24x7',
    flag: '🇮🇳',
    tag: 'INDIA',
    tagColor: '#f97316',
    videoId: 'Fzz-GbJMhUE', // NDTV 24x7 Live
    desc: 'India\'s #1 English News'
  },
  {
    id: 'stream-dw',
    label: 'DW News',
    flag: '🌍',
    tag: 'GLOBAL',
    tagColor: '#10b981',
    videoId: 'iAqHCFMnGbQ', // DW News Live — Deutsche Welle, very stable
    desc: 'Deutsche Welle Global'
  },
  {
    id: 'stream-aljazeera',
    label: 'Al Jazeera',
    flag: '🌐',
    tag: 'GLOBAL',
    tagColor: '#10b981',
    videoId: 'B8pMXMzO2DA', // Al Jazeera English Live
    desc: 'Al Jazeera English'
  },
  {
    id: 'stream-france24',
    label: 'France 24',
    flag: '🇫🇷',
    tag: 'EUROPE',
    tagColor: '#3b82f6',
    videoId: 'h3MuIUNCCLI', // France 24 English Live
    desc: 'France 24 English'
  },
];

function getSeverityFromTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('critical') || t.includes('zero-day') || t.includes('ransomware') || t.includes('breach') || t.includes('exploit')) return 'CRITICAL';
  if (t.includes('vulnerability') || t.includes('malware') || t.includes('attack') || t.includes('hack')) return 'HIGH';
  if (t.includes('warning') || t.includes('risk') || t.includes('threat') || t.includes('flaw')) return 'MEDIUM';
  return 'INFO';
}

function getSeverityColor(s) {
  if (s === 'CRITICAL') return '#ef4444';
  if (s === 'HIGH') return '#f97316';
  if (s === 'MEDIUM') return '#fbbf24';
  return '#10b981';
}

function timeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

async function fetchRSS(feed) {
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`;
  const res = await fetch(proxy);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const parser = new DOMParser();
  const xml = parser.parseFromString(data.contents, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item')).slice(0, 8);
  return items.map(item => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
    const link = item.querySelector('link')?.textContent?.trim() || '#';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const severity = getSeverityFromTitle(title);
    return { source: feed.name, sourceColor: feed.color, title, link, pubDate, severity };
  });
}

// ── YouTube embed component ──
function StreamPlayer({ stream, isActive, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        border: `1px solid ${isActive ? stream.tagColor : '#1f1f1f'}`,
        borderRadius: '6px',
        overflow: 'hidden',
        background: isActive ? `${stream.tagColor}10` : 'rgba(0,0,0,0.4)',
        transition: 'all 0.2s',
        flexShrink: 0
      }}
    >
      <div style={{
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '1rem' }}>{stream.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stream.label}
          </div>
          <div style={{ color: '#555', fontSize: '0.6rem' }}>{stream.desc}</div>
        </div>
        <span style={{
          background: `${stream.tagColor}20`,
          border: `1px solid ${stream.tagColor}50`,
          color: stream.tagColor,
          padding: '1px 6px',
          borderRadius: '3px',
          fontSize: '0.55rem',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          flexShrink: 0
        }}>
          {stream.tag}
        </span>
        {isActive && (
          <span style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 6px #ef4444',
            animation: 'blink 1s ease-in-out infinite',
            flexShrink: 0
          }} />
        )}
      </div>
    </div>
  );
}

export default function LiveNewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('news'); // 'news' | 'streams'
  const [activeStream, setActiveStream] = useState(LIVE_STREAMS[0]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');

  const fetchAllFeeds = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const results = [];
    const errs = [];

    await Promise.allSettled(
      RSS_FEEDS.map(async feed => {
        try {
          const items = await fetchRSS(feed);
          results.push(...items);
        } catch (e) {
          errs.push(`${feed.name}: ${e.message}`);
        }
      })
    );

    // Sort by pubDate descending
    results.sort((a, b) => {
      try { return new Date(b.pubDate) - new Date(a.pubDate); }
      catch { return 0; }
    });

    setArticles(results);
    setErrors(errs);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllFeeds();
    const interval = setInterval(fetchAllFeeds, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [fetchAllFeeds]);

  const sources = ['ALL', ...RSS_FEEDS.map(f => f.name)];
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];

  const displayed = articles.filter(a => {
    const matchSev = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const matchSrc = filterSource === 'ALL' || a.source === filterSource;
    return matchSev && matchSrc;
  });

  const critCount = articles.filter(a => a.severity === 'CRITICAL').length;
  const highCount = articles.filter(a => a.severity === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'ARTICLES', value: articles.length, color: '#3b82f6' },
          { label: 'CRITICAL', value: critCount, color: '#ef4444' },
          { label: 'HIGH', value: highCount, color: '#f97316' },
          { label: 'SOURCES', value: RSS_FEEDS.length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${s.color}30`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: s.color }}>
              {loading ? '…' : s.value}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#555', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { key: 'news', label: '📰 News Feed' },
          { key: 'streams', label: '📺 Live Streams' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? 'rgba(59,130,246,0.2)' : 'transparent',
              border: `1px solid ${activeTab === tab.key ? '#3b82f6' : '#333'}`,
              color: activeTab === tab.key ? '#3b82f6' : '#666',
              padding: '8px 18px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
        {lastUpdated && (
          <span style={{ marginLeft: 'auto', color: '#444', fontSize: '0.65rem', alignSelf: 'center' }}>
            Updated {timeAgo(lastUpdated)}
          </span>
        )}
      </div>

      {/* ── LIVE STREAMS TAB ── */}
      {activeTab === 'streams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Stream selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LIVE_STREAMS.map(stream => (
              <StreamPlayer
                key={stream.id}
                stream={stream}
                isActive={activeStream.id === stream.id}
                onSelect={() => setActiveStream(stream)}
              />
            ))}
          </div>

          {/* YouTube embed */}
          <div style={{
            borderRadius: '10px',
            overflow: 'hidden',
            border: `1px solid ${activeStream.tagColor}40`,
            background: '#000',
            boxShadow: `0 0 24px ${activeStream.tagColor}20`
          }}>
            <div style={{
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.8)',
              borderBottom: `1px solid ${activeStream.tagColor}30`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
                animation: 'blink 1s ease-in-out infinite',
                flexShrink: 0
              }} />
              <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {activeStream.flag} {activeStream.label}
              </span>
              <span style={{ color: '#555', fontSize: '0.7rem' }}>{activeStream.desc}</span>
              <span style={{
                marginLeft: 'auto',
                background: '#ef444420',
                border: '1px solid #ef444450',
                color: '#ef4444',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '0.6rem',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}>
                ● LIVE
              </span>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                key={activeStream.videoId}
                src={`https://www.youtube.com/embed/${activeStream.videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                title={activeStream.label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ color: '#444', fontSize: '0.65rem', textAlign: 'center' }}>
            Streams are live YouTube embeds. If a stream is offline, select another source.
          </div>
        </div>
      )}

      {/* ── NEWS FEED TAB ── */}
      {activeTab === 'news' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {severities.map(s => {
                const color = s === 'CRITICAL' ? '#ef4444' : s === 'HIGH' ? '#f97316' : s === 'MEDIUM' ? '#fbbf24' : s === 'INFO' ? '#10b981' : '#888';
                return (
                  <button
                    key={s}
                    onClick={() => setFilterSeverity(s)}
                    style={{
                      background: filterSeverity === s ? `${color}25` : 'transparent',
                      border: `1px solid ${filterSeverity === s ? color : '#333'}`,
                      color: filterSeverity === s ? color : '#555',
                      padding: '4px 9px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      transition: 'all 0.15s'
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid #333',
                color: '#aaa',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              onClick={fetchAllFeeds}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid #333',
                color: '#10b981',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.72rem'
              }}
            >
              ⟳ Refresh
            </button>
          </div>

          {/* Partial error notice */}
          {errors.length > 0 && !loading && articles.length > 0 && (
            <div style={{
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid #fbbf2430',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#fbbf24',
              fontSize: '0.72rem'
            }}>
              ⚠️ {errors.length} source(s) unavailable — showing data from remaining feeds.
            </div>
          )}

          {/* Full error */}
          {errors.length === RSS_FEEDS.length && !loading && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid #ef444430',
              borderRadius: '6px',
              padding: '12px 16px',
              color: '#ef4444',
              fontSize: '0.8rem'
            }}>
              ⚠️ All feeds failed to load. This is usually a temporary CORS proxy issue. Try refreshing in a minute.
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: '72px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #111',
                  borderRadius: '8px',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              ))}
            </div>
          )}

          {/* Articles */}
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {displayed.length === 0 && (
                <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontSize: '0.85rem' }}>
                  No articles match your filter.
                </div>
              )}
              {displayed.map((article, i) => {
                const sevColor = getSeverityColor(article.severity);
                return (
                  <a
                    key={i}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid #1a1a1a',
                      borderLeft: `3px solid ${sevColor}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = sevColor + '50';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                      e.currentTarget.style.borderColor = '#1a1a1a';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span style={{
                        color: article.sourceColor,
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px'
                      }}>
                        {article.source}
                      </span>
                      <span style={{
                        background: `${sevColor}20`,
                        border: `1px solid ${sevColor}50`,
                        color: sevColor,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '0.58rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px'
                      }}>
                        {article.severity}
                      </span>
                      <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.65rem' }}>
                        {timeAgo(article.pubDate)}
                      </span>
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.82rem', lineHeight: '1.4' }}>
                      {article.title}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {!loading && displayed.length > 0 && (
            <div style={{ textAlign: 'center', color: '#444', fontSize: '0.65rem', paddingBottom: '8px' }}>
              {displayed.length} articles · Sources: {RSS_FEEDS.map(f => f.name).join(', ')} · Auto-refreshes every 10 min
            </div>
          )}
        </div>
      )}
    </div>
  );
}