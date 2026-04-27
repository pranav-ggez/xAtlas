import { useState, useEffect, useCallback, useRef } from 'react';

// rss2json is more reliable than allorigins for RSS
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

const RSS_FEEDS = [
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', color: '#ef4444' },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', color: '#f97316' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', color: '#fbbf24' },
  { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', color: '#3b82f6' },
  { name: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', color: '#10b981' },
];

// Stream sources — two types:
// type: 'hls'     → direct m3u8, played via HLS.js, most reliable, no rotation issues
// type: 'youtube' → YouTube iframe, used only where no public HLS exists (WION, NDTV)
const STREAMS = [
  {
    id: 'aljazeera',
    label: 'Al Jazeera',
    flag: '🌐',
    tag: 'GLOBAL',
    tagColor: '#10b981',
    type: 'hls',
    // Al Jazeera's official public HLS stream — stable, no token
    src: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
    desc: 'Al Jazeera English'
  },
  {
    id: 'trtworld',
    label: 'TRT World',
    flag: '🌍',
    tag: 'GLOBAL',
    tagColor: '#10b981',
    type: 'hls',
    // TRT World official HLS
    src: 'https://tv-trtworld.live.trt.com.tr/master.m3u8',
    desc: 'TRT World Turkey'
  },
  {
    id: 'nhkworld',
    label: 'NHK World',
    flag: '🇯🇵',
    tag: 'ASIA',
    tagColor: '#3b82f6',
    type: 'hls',
    // NHK World official HLS — very stable
    src: 'https://cdn.nhkworld.jp/www11/nhkworld-tv/pre/hlscomp.m3u8',
    desc: 'NHK World Japan'
  },
  {
    id: 'wion',
    label: 'WION Live',
    flag: '🇮🇳',
    tag: 'INDIA',
    tagColor: '#f97316',
    type: 'youtube',
    // WION has no public HLS — YouTube only
    src: 'SnFSaD7FKuI',
    desc: 'World Is One News — India'
  },
  {
    id: 'ndtv',
    label: 'NDTV 24x7',
    flag: '🇮🇳',
    tag: 'INDIA',
    tagColor: '#f97316',
    type: 'youtube',
    // NDTV has no public HLS — YouTube only
    src: 'Fzz-GbJMhUE',
    desc: 'NDTV English News — India'
  },
];

// ── HLS Player using HLS.js loaded from CDN ──
function HLSPlayer({ stream }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setLoading(true);

    const video = videoRef.current;
    if (!video) return;

    // Load HLS.js from CDN if not already loaded
    const initHLS = () => {
      if (window.Hls && window.Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new window.Hls({
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(stream.src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {
            // autoplay blocked — that's fine, user can click play
          });
        });
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError('Stream unavailable. The channel may be temporarily offline.');
            setLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = stream.src;
        video.addEventListener('loadedmetadata', () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        video.addEventListener('error', () => {
          setError('Stream unavailable.');
          setLoading(false);
        });
      } else {
        setError('HLS not supported in this browser.');
        setLoading(false);
      }
    };

    if (!window.Hls) {
      // Dynamically load HLS.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js';
      script.onload = initHLS;
      script.onerror = () => {
        setError('Failed to load video player library.');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initHLS();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream.src]);

  return (
    <div style={{ position: 'relative', width: '100%', background: '#000' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#050505',
          zIndex: 2,
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ color: '#10b981', fontSize: '0.8rem' }}>⟳ Connecting to stream…</div>
          <div style={{ color: '#444', fontSize: '0.7rem' }}>{stream.label}</div>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#050505',
          zIndex: 2,
          flexDirection: 'column',
          gap: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem' }}>📡</div>
          <div style={{ color: '#ef4444', fontSize: '0.78rem' }}>{error}</div>
          <div style={{ color: '#555', fontSize: '0.68rem' }}>Try selecting another channel</div>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        muted
        playsInline
        style={{
          width: '100%',
          display: 'block',
          aspectRatio: '16/9',
          background: '#000'
        }}
      />
    </div>
  );
}

// ── YouTube Player ──
function YouTubePlayer({ stream }) {
  const [muted, setMuted] = useState(true);
  const src = `https://www.youtube.com/embed/${stream.src}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&iv_load_policy=3`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <iframe
        key={`${stream.src}-${muted}`}
        src={src}
        title={stream.label}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block', background: '#000' }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.7)'
      }}>
        <span style={{ color: '#555', fontSize: '0.65rem' }}>
          YouTube stream — video ID may change if channel updates their live broadcast
        </span>
        <button
          onClick={() => setMuted(m => !m)}
          style={{
            background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${muted ? '#ef444450' : '#10b98150'}`,
            color: muted ? '#ef4444' : '#10b981',
            padding: '3px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}
        >
          {muted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>
    </div>
  );
}

// ── Utility functions ──
function getSeverity(title) {
  const t = title.toLowerCase();
  if (t.includes('critical') || t.includes('zero-day') || t.includes('ransomware') || t.includes('breach') || t.includes('exploit') || t.includes('backdoor')) return 'CRITICAL';
  if (t.includes('vulnerability') || t.includes('malware') || t.includes('attack') || t.includes('hack') || t.includes('trojan')) return 'HIGH';
  if (t.includes('warning') || t.includes('risk') || t.includes('threat') || t.includes('flaw') || t.includes('patch')) return 'MEDIUM';
  return 'INFO';
}

function getSeverityColor(s) {
  if (s === 'CRITICAL') return '#ef4444';
  if (s === 'HIGH') return '#f97316';
  if (s === 'MEDIUM') return '#fbbf24';
  return '#10b981';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  } catch { return 'Recently'; }
}

async function fetchFeed(feed) {
  const url = `${RSS2JSON}${encodeURIComponent(feed.url)}&count=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'Feed error');
  return (data.items || []).map(item => ({
    source: feed.name,
    sourceColor: feed.color,
    title: item.title?.trim() || 'Untitled',
    link: item.link || '#',
    pubDate: item.pubDate,
    severity: getSeverity(item.title || '')
  }));
}

// ── Main component ──
export default function LiveNewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedFeeds, setFailedFeeds] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('news');
  const [activeStream, setActiveStream] = useState(STREAMS[0]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = [];
    const failed = [];
    await Promise.allSettled(
      RSS_FEEDS.map(async feed => {
        try {
          const items = await fetchFeed(feed);
          results.push(...items);
        } catch {
          failed.push(feed.name);
        }
      })
    );
    results.sort((a, b) => {
      try { return new Date(b.pubDate) - new Date(a.pubDate); }
      catch { return 0; }
    });
    setArticles(results);
    setFailedFeeds(failed);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];
  const sources = ['ALL', ...RSS_FEEDS.map(f => f.name)];

  const displayed = articles.filter(a => {
    const ms = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const mso = filterSource === 'ALL' || a.source === filterSource;
    return ms && mso;
  });

  const critCount = articles.filter(a => a.severity === 'CRITICAL').length;
  const highCount = articles.filter(a => a.severity === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        @keyframes liveblink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes shimmer { 0%,100%{opacity:0.35} 50%{opacity:0.65} }
      `}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
        {[
          { label: 'ARTICLES', value: articles.length, color: '#3b82f6' },
          { label: 'CRITICAL', value: critCount, color: '#ef4444' },
          { label: 'HIGH', value: highCount, color: '#f97316' },
          { label: 'LIVE CHANNELS', value: STREAMS.length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${s.color}25`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: s.color }}>
              {loading && s.label === 'ARTICLES' ? '…' : s.value}
            </div>
            <div style={{ fontSize: '0.58rem', color: '#555', letterSpacing: '1px', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[{ key: 'news', label: '📰 News Feed' }, { key: 'streams', label: '📺 Live TV' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background: activeTab === tab.key ? 'rgba(59,130,246,0.2)' : 'transparent',
            border: `1px solid ${activeTab === tab.key ? '#3b82f6' : '#2a2a2a'}`,
            color: activeTab === tab.key ? '#3b82f6' : '#555',
            padding: '7px 16px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.15s'
          }}>
            {tab.label}
          </button>
        ))}
        {lastUpdated && (
          <span style={{ marginLeft: 'auto', color: '#444', fontSize: '0.62rem' }}>
            News updated {timeAgo(lastUpdated)}
          </span>
        )}
      </div>

      {/* ── LIVE TV TAB ── */}
      {activeTab === 'streams' && (
        <div style={{ display: 'flex', gap: '16px' }}>

          {/* Channel list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '200px', flexShrink: 0 }}>
            <div style={{ color: '#444', fontSize: '0.6rem', letterSpacing: '1px', marginBottom: '4px' }}>
              SELECT CHANNEL
            </div>
            {STREAMS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveStream(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', textAlign: 'left',
                  background: activeStream.id === s.id ? `${s.tagColor}15` : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${activeStream.id === s.id ? s.tagColor + '70' : '#1f1f1f'}`,
                  borderRadius: '6px', padding: '8px 10px',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: '1rem' }}>{s.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: activeStream.id === s.id ? '#fff' : '#999', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {s.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{
                      background: `${s.tagColor}20`, border: `1px solid ${s.tagColor}40`,
                      color: s.tagColor, padding: '1px 5px', borderRadius: '2px',
                      fontSize: '0.55rem', fontWeight: 'bold'
                    }}>{s.tag}</span>
                    <span style={{ color: '#444', fontSize: '0.55rem' }}>
                      {s.type === 'hls' ? 'HLS' : 'YT'}
                    </span>
                  </div>
                </div>
                {activeStream.id === s.id && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#ef4444', boxShadow: '0 0 6px #ef4444',
                    flexShrink: 0, animation: 'liveblink 1.2s ease-in-out infinite'
                  }} />
                )}
              </button>
            ))}

            <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #1a1a1a', borderRadius: '6px' }}>
              <div style={{ color: '#444', fontSize: '0.6rem', lineHeight: '1.5' }}>
                <div style={{ color: '#10b981', marginBottom: '4px', fontSize: '0.62rem' }}>Stream types:</div>
                <div><span style={{ color: '#3b82f6' }}>HLS</span> — direct stream, most reliable</div>
                <div><span style={{ color: '#f97316' }}>YT</span> — YouTube embed (WION/NDTV have no public HLS)</div>
              </div>
            </div>
          </div>

          {/* Player area */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Now playing bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.6)',
              border: `1px solid ${activeStream.tagColor}30`,
              borderRadius: '8px'
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', boxShadow: '0 0 8px #ef4444',
                animation: 'liveblink 1.2s ease-in-out infinite', flexShrink: 0
              }} />
              <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {activeStream.flag} {activeStream.label}
              </span>
              <span style={{ color: '#555', fontSize: '0.7rem' }}>{activeStream.desc}</span>
              <span style={{
                marginLeft: 'auto',
                background: '#ef444415', border: '1px solid #ef444440',
                color: '#ef4444', padding: '2px 8px', borderRadius: '3px',
                fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px'
              }}>● LIVE</span>
            </div>

            {/* Conditional player */}
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${activeStream.tagColor}25` }}>
              {activeStream.type === 'hls'
                ? <HLSPlayer key={activeStream.id} stream={activeStream} />
                : <YouTubePlayer key={activeStream.id} stream={activeStream} />
              }
            </div>
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
                const c = s === 'CRITICAL' ? '#ef4444' : s === 'HIGH' ? '#f97316' : s === 'MEDIUM' ? '#fbbf24' : s === 'INFO' ? '#10b981' : '#888';
                return (
                  <button key={s} onClick={() => setFilterSeverity(s)} style={{
                    background: filterSeverity === s ? `${c}25` : 'transparent',
                    border: `1px solid ${filterSeverity === s ? c : '#2a2a2a'}`,
                    color: filterSeverity === s ? c : '#555',
                    padding: '4px 9px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.62rem', fontWeight: 'bold', transition: 'all 0.15s'
                  }}>{s}</button>
                );
              })}
            </div>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              style={{
                background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#aaa',
                padding: '5px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', outline: 'none'
              }}
            >
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={fetchAll} style={{
              marginLeft: 'auto', background: 'transparent', border: '1px solid #2a2a2a',
              color: '#10b981', padding: '5px 12px', borderRadius: '4px',
              cursor: 'pointer', fontSize: '0.7rem'
            }}>⟳ Refresh</button>
          </div>

          {/* Partial failure */}
          {failedFeeds.length > 0 && failedFeeds.length < RSS_FEEDS.length && !loading && (
            <div style={{
              background: 'rgba(251,191,36,0.07)', border: '1px solid #fbbf2425',
              borderRadius: '6px', padding: '8px 12px', color: '#fbbf24', fontSize: '0.7rem'
            }}>
              ⚠️ Unavailable: {failedFeeds.join(', ')}
            </div>
          )}

          {/* Full failure */}
          {failedFeeds.length === RSS_FEEDS.length && !loading && (
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid #ef444425',
              borderRadius: '6px', padding: '12px 16px', color: '#ef4444', fontSize: '0.78rem'
            }}>
              ⚠️ All feeds failed. The RSS proxy may be temporarily down. Try refreshing in a minute.
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: '68px', background: 'rgba(255,255,255,0.025)',
                  border: '1px solid #111', borderRadius: '6px',
                  animation: 'shimmer 1.5s ease-in-out infinite'
                }} />
              ))}
            </div>
          )}

          {/* Articles */}
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {displayed.length === 0 && (
                <div style={{ color: '#555', textAlign: 'center', padding: '40px', fontSize: '0.85rem' }}>
                  No articles match your filter.
                </div>
              )}
              {displayed.map((a, i) => {
                const c = getSeverityColor(a.severity);
                return (
                  <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textDecoration: 'none',
                    background: 'rgba(0,0,0,0.45)', border: '1px solid #141414',
                    borderLeft: `3px solid ${c}`, borderRadius: '6px',
                    padding: '11px 14px', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = c + '40'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.borderColor = '#141414'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span style={{ color: a.sourceColor, fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {a.source}
                      </span>
                      <span style={{
                        background: `${c}18`, border: `1px solid ${c}45`, color: c,
                        padding: '1px 6px', borderRadius: '3px', fontSize: '0.58rem', fontWeight: 'bold'
                      }}>
                        {a.severity}
                      </span>
                      <span style={{ marginLeft: 'auto', color: '#444', fontSize: '0.62rem' }}>
                        {timeAgo(a.pubDate)}
                      </span>
                    </div>
                    <div style={{ color: '#c0c0c0', fontSize: '0.8rem', lineHeight: '1.45' }}>{a.title}</div>
                  </a>
                );
              })}
            </div>
          )}

          {!loading && displayed.length > 0 && (
            <div style={{ color: '#383838', fontSize: '0.62rem', textAlign: 'center', paddingBottom: '4px' }}>
              {displayed.length} articles · Refreshes every 10 min
            </div>
          )}
        </div>
      )}
    </div>
  );
}