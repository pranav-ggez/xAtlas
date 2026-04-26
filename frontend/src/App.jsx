import { useState, useEffect, useRef } from 'react'
import { useGalaxy } from './context/GalaxyContext'
import ThreatGlobe from './components/ThreatGlobe.jsx'
import SearchPanel from './components/SearchPanel.jsx'
import ThreatFeed from './components/ThreatFeed.jsx'
import SecurityPanel from './components/SecurityPanel.jsx'
import PasswordChecker from './components/PasswordChecker.jsx'
import CVEFeed from './components/CVEFeed.jsx'
import LiveNewsFeed from './components/LiveNewsFeed.jsx'
import ThreatAnalytics from './components/ThreatAnalytics.jsx'

function App() {
  const { state } = useGalaxy()
  const [attacks, setAttacks] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [activeLayers, setActiveLayers] = useState({
    attacks: true,
    tools: false,
    infrastructure: false,
    hotspots: true,
    nuclear: false
  })
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPaused, setIsPaused] = useState(false)
  const [activeSection, setActiveSection] = useState('globe')

  const globeSectionRef = useRef(null)
  const cveSectionRef = useRef(null)
  const newsSectionRef = useRef(null)
  const analyticsSectionRef = useRef(null)
  const toolsSectionRef = useRef(null)
  const mainScrollRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isPaused) return

    const cities = [
      { name: "USA", lat: 38.9072, lng: -77.0369 },
      { name: "China", lat: 39.9042, lng: 116.4074 },
      { name: "Russia", lat: 55.7558, lng: 37.6173 },
      { name: "India", lat: 12.9716, lng: 77.5946 },
      { name: "UK", lat: 51.5074, lng: -0.1278 },
      { name: "Brazil", lat: -23.5505, lng: -46.6333 },
      { name: "Germany", lat: 52.5200, lng: 13.4050 },
      { name: "Iran", lat: 35.6892, lng: 51.3890 },
      { name: "Israel", lat: 31.7683, lng: 35.2137 },
      { name: "North Korea", lat: 39.0392, lng: 125.7625 }
    ]

    const interval = setInterval(() => {
      const source = cities[Math.floor(Math.random() * cities.length)]
      let target = cities[Math.floor(Math.random() * cities.length)]
      while (source === target) {
        target = cities[Math.floor(Math.random() * cities.length)]
      }

      const types = [
        "DDoS",
        "SQL Injection",
        "Brute Force",
        "Malware C2",
        "Zero-Day Exploit",
        "Ransomware",
        "Phishing",
        "APT Activity"
      ]
      const type = types[Math.floor(Math.random() * types.length)]
      const severity = Math.random() > 0.7 ? "Critical" : Math.random() > 0.4 ? "High" : "Medium"

      const newAttack = {
        id: Date.now(),
        source_country: source.name,
        target_country: target.name,
        source_lat: source.lat,
        source_lng: source.lng,
        target_lat: target.lat,
        target_lng: target.lng,
        attack_type: type,
        severity: severity,
        timestamp: new Date().toLocaleTimeString()
      }

      setAttacks(prev => [newAttack, ...prev].slice(0, 50))
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  const stats = {
    totalAttacks: attacks.length,
    criticalCount: attacks.filter(a => a.severity === 'Critical').length,
    highCount: attacks.filter(a => a.severity === 'High').length,
    topAttacker: attacks.length > 0
      ? Object.entries(
          attacks.reduce((acc, a) => {
            acc[a.source_country] = (acc[a.source_country] || 0) + 1
            return acc
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      : 'N/A',
    topTarget: attacks.length > 0
      ? Object.entries(
          attacks.reduce((acc, a) => {
            acc[a.target_country] = (acc[a.target_country] || 0) + 1
            return acc
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      : 'N/A'
  }

  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }))
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const toggleBottomPanel = () => {
    setBottomPanelOpen(!bottomPanelOpen)
  }

  const scrollToSection = (ref, sectionName) => {
    setActiveSection(sectionName)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const navSections = [
    { key: 'globe', label: '🌐 GLOBE', ref: globeSectionRef },
    { key: 'cve', label: '🛡️ CVE FEED', ref: cveSectionRef },
    { key: 'news', label: '📰 NEWS', ref: newsSectionRef },
    { key: 'analytics', label: '📊 ANALYTICS', ref: analyticsSectionRef },
    { key: 'tools', label: '🔧 TOOLS', ref: toolsSectionRef },
  ]

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* TOP NAVIGATION BAR */}
      <div style={{
        flexShrink: 0,
        height: '50px',
        background: 'rgba(0, 20, 0, 0.95)',
        border: '1px solid #10b981',
        borderBottom: '2px solid #10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        zIndex: 100,
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
        boxSizing: 'border-box'
      }}>

        {/* LEFT: Logo */}
        <div style={{ overflow: 'hidden', flexShrink: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.3rem',
            color: '#fff',
            fontWeight: 'bold',
            letterSpacing: '1px',
            whiteSpace: 'nowrap'
          }}>
            XATLAS <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'normal' }}>GLOBAL THREAT MONITOR</span>
          </h1>
        </div>

        {/* CENTER: Section Nav */}
        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center'
        }}>
          {navSections.map(section => (
            <button
              key={section.key}
              onClick={() => scrollToSection(section.ref, section.key)}
              style={{
                background: activeSection === section.key ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                border: `1px solid ${activeSection === section.key ? '#10b981' : '#333'}`,
                color: activeSection === section.key ? '#10b981' : '#888',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== section.key) {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.color = '#10b981'
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== section.key) {
                  e.currentTarget.style.borderColor = '#333'
                  e.currentTarget.style.color = '#888'
                }
              }}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* RIGHT: Time + Pause */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 'bold' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {currentTime.toLocaleTimeString()} UTC
            </div>
          </div>
          <button
            onClick={togglePause}
            style={{
              background: isPaused ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${isPaused ? '#10b981' : '#ef4444'}`,
              color: isPaused ? '#10b981' : '#ef4444',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              minWidth: '140px',
              justifyContent: 'center'
            }}
          >
            {isPaused ? '▶ RESUME SIMULATION' : '⏸ PAUSE SIMULATION'}
          </button>
        </div>

      </div>

      {/* MAIN SCROLLABLE BODY */}
      <div
        ref={mainScrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#10b981 #001100',
          scrollBehavior: 'smooth'
        }}
      >

        {/* ── SECTION 1: GLOBE ── */}
        <div
          ref={globeSectionRef}
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100vh - 50px)',
            minHeight: '600px',
            background: '#000',
            flexShrink: 0
          }}
        >
          {!isPaused && (
            <>
              {/* LEFT SIDEBAR */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: leftSidebarOpen ? '280px' : '0',
                bottom: '0',
                background: 'rgba(0, 10, 0, 0.95)',
                borderRight: '1px solid #10b981',
                zIndex: 90,
                overflow: 'hidden',
                transition: 'width 0.3s ease'
              }}>
                <div style={{
                  width: '280px',
                  padding: '12px',
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#10b981 #001100',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column'
                }}>

                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #333',
                      paddingBottom: '6px'
                    }}>
                      📡 LAYERS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { key: 'attacks', label: '🔴 Live Attacks', color: '#ef4444' },
                        { key: 'tools', label: '🟢 Secure Nodes', color: '#10b981' },
                        { key: 'infrastructure', label: '🔵 Infrastructure', color: '#3b82f6' },
                        { key: 'hotspots', label: '🟠 Threat Hotspots', color: '#f97316' },
                        { key: 'nuclear', label: '☢️ Nuclear Sites', color: '#fbbf24' }
                      ].map(layer => (
                        <label
                          key={layer.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            background: activeLayers[layer.key] ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                            border: `1px solid ${activeLayers[layer.key] ? layer.color : '#333'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={activeLayers[layer.key]}
                            onChange={() => toggleLayer(layer.key)}
                            style={{
                              accentColor: layer.color,
                              width: '14px',
                              height: '14px',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ color: '#fff', fontSize: '0.8rem' }}>{layer.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}></div>

                  <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                    <h3 style={{
                      margin: '0 0 15px 0',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #333',
                      paddingBottom: '6px',
                      fontFamily: '"Press Start 2P", cursive, monospace',
                      letterSpacing: '1px'
                    }}>
                      CONNECT
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      <a
                        href="https://github.com/pranav-ggez"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.borderColor = '#fff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = '#333'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff', flexShrink: 0 }}>
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: '"Press Start 2P", cursive, monospace',
                          color: '#fff'
                        }}>GITHUB</span>
                      </a>

                      <a
                        href="https://www.linkedin.com/in/pranav-vaidya-025326255/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(10, 102, 194, 0.15)',
                          border: '1px solid #0a66c2',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(10, 102, 194, 0.25)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(10, 102, 194, 0.15)'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0a66c2', flexShrink: 0 }}>
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: '"Press Start 2P", cursive, monospace',
                          color: '#fff'
                        }}>LINKEDIN</span>
                      </a>

                      <a
                        href="https://discord.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(88, 101, 242, 0.15)',
                          border: '1px solid #5865F2',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(88, 101, 242, 0.25)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(88, 101, 242, 0.15)'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5865F2', flexShrink: 0 }}>
                          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419Z" />
                        </svg>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: '"Press Start 2P", cursive, monospace',
                          color: '#fff'
                        }}>DISCORD</span>
                      </a>
                    </div>
                  </div>

                </div>
              </div>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: leftSidebarOpen ? '290px' : '10px',
                  zIndex: 95,
                  background: 'rgba(16, 185, 129, 0.9)',
                  border: 'none',
                  width: '35px',
                  height: '35px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'left 0.3s ease',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                }}
              >
                {leftSidebarOpen ? '◀' : '▶'}
              </button>

              {/* Globe Area */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: leftSidebarOpen ? '280px' : '0',
                right: '300px',
                bottom: '0',
                background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)',
                overflow: 'hidden',
                transition: 'left 0.3s ease'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ThreatGlobe
                    attacks={attacks}
                    activeLayers={activeLayers}
                    onPointClick={(point) => setSelectedTool(point)}
                    key={`${leftSidebarOpen ? 'open' : 'closed'}-${bottomPanelOpen ? 'open' : 'closed'}`}
                  />
                </div>
              </div>

              {/* Right Stats Panel */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '300px',
                bottom: '0',
                background: 'rgba(0, 10, 0, 0.95)',
                borderLeft: '1px solid #10b981',
                zIndex: 90,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#10b981 #001100'
              }}>
                <div style={{ padding: '12px' }}>

                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #333',
                      paddingBottom: '6px'
                    }}>
                      🎯 THREAT INTEL
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ef4444'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#ef4444', marginBottom: '3px' }}>TOTAL ATTACKS</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{stats.totalAttacks}</div>
                      </div>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#10b981', marginBottom: '3px' }}>TOP TARGET</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{stats.topTarget}</div>
                      </div>
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #3b82f6'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#3b82f6', marginBottom: '3px' }}>THREAT ACTOR</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{stats.topAttacker}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{
                      margin: '0 0 10px 0',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #333',
                      paddingBottom: '6px'
                    }}>
                      📈 VECTORS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {['DDoS', 'SQL Injection', 'Ransomware', 'Phishing'].map((type) => {
                        const count = attacks.filter(a => a.attack_type === type).length
                        const percentage = attacks.length > 0 ? (count / attacks.length) * 100 : 0
                        return (
                          <div key={type} style={{ marginBottom: '6px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.7rem',
                              color: '#fff',
                              marginBottom: '3px'
                            }}>
                              <span>{type}</span>
                              <span>{count}</span>
                            </div>
                            <div style={{
                              height: '6px',
                              background: '#222',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              border: '1px solid #333'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #ef4444, #f97316)',
                                transition: 'width 0.5s ease',
                                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                              }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Panel */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: leftSidebarOpen ? '280px' : '0',
                right: '0',
                zIndex: 95,
                display: 'flex',
                flexDirection: 'column'
              }}>

                <div
                  onClick={toggleBottomPanel}
                  style={{
                    height: '24px',
                    background: '#10b981',
                    borderTop: '2px solid #000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 100,
                    fontSize: '0.8rem',
                    color: '#000',
                    fontWeight: 'bold'
                  }}
                >
                  {bottomPanelOpen ? '▼' : '▲'}
                </div>

                <div style={{
                  background: 'rgba(0, 10, 0, 0.95)',
                  borderTop: '2px solid #10b981',
                  overflowY: 'auto',
                  maxHeight: bottomPanelOpen ? '60vh' : '0',
                  transition: 'max-height 0.3s ease',
                  display: 'flex',
                  flexDirection: 'row',
                  minHeight: '0'
                }}>

                  <div style={{
                    width: '250px',
                    flexShrink: 0,
                    borderRight: '1px solid #333',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderBottom: '1px solid #333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>⚠️ LIVE FEED</span>
                      <span style={{
                        background: '#ef4444',
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        {attacks.length}
                      </span>
                    </div>
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '10px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#ef4444 #110000'
                    }}>
                      <ThreatFeed attacks={attacks} />
                    </div>
                  </div>

                  <div style={{
                    flex: 1,
                    minWidth: '200px',
                    borderRight: '1px solid #333',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background: 'rgba(0, 20, 0, 0.3)'
                  }}>
                    <div style={{ width: '100%', maxWidth: '280px' }}>
                      <SearchPanel onSelectTool={setSelectedTool} />
                    </div>
                  </div>

                  <div style={{
                    flex: 1,
                    minWidth: '200px',
                    borderRight: '1px solid #333',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background: 'rgba(0, 20, 0, 0.3)'
                  }}>
                    <div style={{ width: '100%', maxWidth: '280px' }}>
                      <PasswordChecker />
                    </div>
                  </div>

                  <div style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    background: 'rgba(0, 20, 0, 0.3)'
                  }}>
                    <div style={{ width: '100%', maxWidth: '280px' }}>
                      <SecurityPanel />
                    </div>
                  </div>

                </div>

              </div>
            </>
          )}
        </div>

        {/* ── SECTION 2: CVE FEED ── */}
        <div
          ref={cveSectionRef}
          style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #000 0%, #000d00 100%)',
            borderTop: '2px solid #10b981',
            padding: '30px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #1a3a1a'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <div>
              <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                CVE Intelligence Feed
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>
                Live vulnerability data from NVD National Vulnerability Database
              </p>
            </div>
            <div style={{
              marginLeft: 'auto',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.65rem',
              color: '#10b981',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              LIVE
            </div>
          </div>
          <CVEFeed />
        </div>

        {/* ── SECTION 3: NEWS FEED ── */}
        <div
          ref={newsSectionRef}
          style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #000d00 0%, #00080d 100%)',
            borderTop: '2px solid #3b82f6',
            padding: '30px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #1a2a3a'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📰</span>
            <div>
              <h2 style={{ margin: 0, color: '#3b82f6', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Cyber Intelligence News
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>
                Aggregated security news from trusted sources
              </p>
            </div>
            <div style={{
              marginLeft: 'auto',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.65rem',
              color: '#3b82f6',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              AGGREGATED
            </div>
          </div>
          <LiveNewsFeed />
        </div>

        {/* ── SECTION 4: ANALYTICS ── */}
        <div
          ref={analyticsSectionRef}
          style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #00080d 0%, #0d0800 100%)',
            borderTop: '2px solid #f97316',
            padding: '30px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #2a1a0a'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <div>
              <h2 style={{ margin: 0, color: '#f97316', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Threat Analytics
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>
                Real-time attack pattern analysis and trend visualization
              </p>
            </div>
          </div>
          <ThreatAnalytics attacks={attacks} />
        </div>

        {/* ── SECTION 5: TOOLS ── */}
        <div
          ref={toolsSectionRef}
          style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0d0800 0%, #000 100%)',
            borderTop: '2px solid #8b5cf6',
            padding: '30px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #1a102a'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔧</span>
            <div>
              <h2 style={{ margin: 0, color: '#8b5cf6', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                OSINT Tool Suite
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>
                Security tools, breach checkers, and reconnaissance utilities
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>

            {/* OSS Finder */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid #1a3a2a',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ color: '#10b981', margin: '0 0 16px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🔍 OSS Alternative Finder
              </h3>
              <SearchPanel onSelectTool={setSelectedTool} />
            </div>

            {/* Password Checker */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid #3a1a1a',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ color: '#ef4444', margin: '0 0 16px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🔐 Breach Checker
              </h3>
              <PasswordChecker />
            </div>

            {/* DNS Recon */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid #1a2a3a',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ color: '#3b82f6', margin: '0 0 16px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🌐 DNS Recon Terminal
              </h3>
              <SecurityPanel />
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          width: '100%',
          padding: '20px 30px',
          background: 'rgba(0, 20, 0, 0.95)',
          borderTop: '1px solid #10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px' }}>
            XATLAS © {new Date().getFullYear()} — GLOBAL THREAT MONITOR
          </div>
          <div style={{ color: '#444', fontSize: '0.65rem' }}>
            Data sources: NVD · HIBP · Public DNS · Simulated threat feeds
          </div>
          <div style={{ color: '#444', fontSize: '0.65rem' }}>
            For educational purposes only
          </div>
        </div>

      </div>

      {/* Tool Modal — stays outside scroll so it overlays everything */}
      {selectedTool && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 199,
              background: 'rgba(0,0,0,0.6)'
            }}
            onClick={() => setSelectedTool(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '450px',
              background: 'rgba(0, 20, 0, 0.98)',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '20px',
              zIndex: 200,
              boxShadow: '0 0 50px rgba(16, 185, 129, 0.5)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '1px solid #333',
              paddingBottom: '8px'
            }}>
              <h2 style={{ color: '#10b981', margin: 0, fontSize: '1.3rem' }}>{selectedTool.name}</h2>
              <button
                onClick={() => setSelectedTool(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444'
                  e.currentTarget.style.color = '#000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.currentTarget.style.color = '#ef4444'
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: '#ccc', lineHeight: '1.5', marginBottom: '15px', fontSize: '0.9rem' }}>
              {selectedTool.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '0.7rem', color: '#10b981', marginBottom: '3px' }}>License</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedTool.license_type}</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #3b82f6' }}>
                <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginBottom: '3px' }}>Replaces</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedTool.proprietary_alternative}</div>
              </div>
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid #f97316' }}>
                <div style={{ fontSize: '0.7rem', color: '#f97316', marginBottom: '3px' }}>Migration</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'capitalize' }}>{selectedTool.migration_difficulty}</div>
              </div>
              <div style={{
                background: selectedTool.signed_releases ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: '10px', borderRadius: '6px',
                border: `1px solid ${selectedTool.signed_releases ? '#10b981' : '#f59e0b'}`
              }}>
                <div style={{ fontSize: '0.7rem', color: selectedTool.signed_releases ? '#10b981' : '#f59e0b', marginBottom: '3px' }}>Security</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {selectedTool.signed_releases ? '✅ Signed' : '⚠️ Unsigned'}
                </div>
              </div>
            </div>

            {selectedTool.official_link && (
              <a
                href={selectedTool.official_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#000',
                  padding: '10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.7)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Visit Official Site ↗
              </a>
            )}
          </div>
        </>
      )}

    </div>
  )
}

export default App