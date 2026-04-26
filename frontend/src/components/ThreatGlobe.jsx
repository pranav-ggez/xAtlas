import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';

const ATTACK_TYPES = ["DDoS", "SQL Injection", "Brute Force", "Malware C2", "Zero-Day", "Ransomware", "Phishing", "APT"];

const CITIES = [
  { name: "USA", lat: 38.9072, lng: -77.0369 },
  { name: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Russia", lat: 55.7558, lng: 37.6173 },
  { name: "India", lat: 12.9716, lng: 77.5946 },
  { name: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Iran", lat: 35.6892, lng: 51.3890 },
  { name: "Israel", lat: 31.7683, lng: 35.2137 },
  { name: "North Korea", lat: 39.0392, lng: 125.7625 },
  { name: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Poland", lat: 52.2297, lng: 21.0122 },
  { name: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { name: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "South Korea", lat: 37.5665, lng: 126.9780 },
  { name: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Ukraine", lat: 50.4501, lng: 30.5234 },
  { name: "Pakistan", lat: 33.6844, lng: 73.0479 },
  { name: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Colombia", lat: 4.7110, lng: -74.0721 },
  { name: "Vietnam", lat: 21.0285, lng: 105.8542 },
  { name: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { name: "Romania", lat: 44.4268, lng: 26.1025 },
  { name: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  { name: "Kazakhstan", lat: 51.1694, lng: 71.4491 },
  { name: "Kenya", lat: -1.2921, lng: 36.8219 }
];

// Proper global tech hubs — no more Suffolk villages
const TECH_HUBS = [
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321 },
  { name: "Austin", lat: 30.2672, lng: -97.7431 },
  { name: "New York", lat: 40.7128, lng: -74.0060 },
  { name: "Boston", lat: 42.3601, lng: -71.0589 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Berlin", lat: 52.5200, lng: 13.4050 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
  { name: "Helsinki", lat: 60.1699, lng: 24.9384 },
  { name: "Copenhagen", lat: 55.6761, lng: 12.5683 },
  { name: "Zurich", lat: 47.3769, lng: 8.5417 },
  { name: "Vienna", lat: 48.2082, lng: 16.3738 },
  { name: "Warsaw", lat: 52.2297, lng: 21.0122 },
  { name: "Prague", lat: 50.0755, lng: 14.4378 },
  { name: "Dublin", lat: 53.3498, lng: -6.2603 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
  { name: "Milan", lat: 45.4642, lng: 9.1900 },
  { name: "Munich", lat: 48.1351, lng: 11.5820 },
  { name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
  { name: "Lisbon", lat: 38.7223, lng: -9.1393 },
  { name: "Oslo", lat: 59.9139, lng: 10.7522 },
  { name: "Brussels", lat: 50.8503, lng: 4.3517 },
  { name: "Tallinn", lat: 59.4370, lng: 24.7536 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Tel Aviv", lat: 32.0853, lng: 34.7818 },
  { name: "Taipei", lat: 25.0330, lng: 121.5654 },
  { name: "Seoul", lat: 37.5665, lng: 126.9780 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { name: "Bogotá", lat: 4.7110, lng: -74.0721 },
  { name: "Santiago", lat: -33.4489, lng: -70.6693 },
  { name: "Beijing", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai", lat: 31.2304, lng: 121.4737 },
  { name: "Shenzhen", lat: 22.5431, lng: 114.0579 },
  { name: "Chengdu", lat: 30.5728, lng: 104.0668 },
  { name: "Hangzhou", lat: 30.2741, lng: 120.1551 },
  { name: "Moscow", lat: 55.7558, lng: 37.6173 },
  { name: "Kyiv", lat: 50.4501, lng: 30.5234 },
  { name: "Warsaw", lat: 52.2297, lng: 21.0122 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
  { name: "Johannesburg", lat: -26.2041, lng: 28.0473 },
  { name: "Accra", lat: 5.6037, lng: -0.1870 },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869 },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
  { name: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297 },
  { name: "Manila", lat: 14.5995, lng: 120.9842 },
  { name: "Karachi", lat: 24.8607, lng: 67.0011 },
  { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Colombo", lat: 6.9271, lng: 79.8612 },
  { name: "Kathmandu", lat: 27.7172, lng: 85.3240 },
  { name: "Almaty", lat: 43.2220, lng: 76.8512 },
  { name: "Tashkent", lat: 41.2995, lng: 69.2401 },
  { name: "Tbilisi", lat: 41.7151, lng: 44.8271 },
  { name: "Reykjavik", lat: 64.1466, lng: -21.9426 },
  { name: "Wellington", lat: -41.2865, lng: 174.7762 },
  { name: "Auckland", lat: -36.8485, lng: 174.7633 },
  { name: "Lima", lat: -12.0464, lng: -77.0428 },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898 },
  { name: "Tunis", lat: 36.8065, lng: 10.1815 },
  { name: "Bucharest", lat: 44.4268, lng: 26.1025 },
  { name: "Sofia", lat: 42.6977, lng: 23.3219 },
  { name: "Athens", lat: 37.9838, lng: 23.7275 }
];

const NUCLEAR_SITES = [
  { lat: 35.6762, lng: 139.6503, label: 'Fukushima Exclusion Zone', country: 'Japan' },
  { lat: 39.9042, lng: 116.4074, label: 'Beijing Nuclear Research', country: 'China' },
  { lat: 55.7558, lng: 37.6173, label: 'Kurchatov Institute', country: 'Russia' },
  { lat: 38.9072, lng: -77.0369, label: 'DOE Headquarters', country: 'USA' },
  { lat: 51.5074, lng: -0.1278, label: 'Atomic Weapons Establishment', country: 'UK' },
  { lat: 48.8566, lng: 2.3522, label: 'CEA Saclay', country: 'France' },
  { lat: 52.5200, lng: 13.4050, label: 'Helmholtz Berlin', country: 'Germany' },
  { lat: 33.6844, lng: 73.0479, label: 'PAEC Islamabad', country: 'Pakistan' },
  { lat: 31.7683, lng: 35.2137, label: 'Negev Nuclear Research', country: 'Israel' },
  { lat: 24.7136, lng: 46.6753, label: 'KACST Riyadh', country: 'Saudi Arabia' }
];

function getSeverityColor(severity) {
  if (severity === 'Critical') return '#ef4444';
  if (severity === 'High') return '#f97316';
  return '#fbbf24';
}

function buildTooltip(d) {
  const typeLabel = {
    live_attack: '⚠️ LIVE ATTACK',
    historical_attack: '📜 HISTORICAL',
    infrastructure: '🏢 INFRASTRUCTURE',
    secure_node: '🟢 SECURE NODE',
    nuclear: '☢️ NUCLEAR SITE',
    hotspot: '🔥 HOTSPOT'
  }[d.type] || d.type;

  return `
    <div style="
      background: rgba(0,5,0,0.97);
      padding: 12px 16px;
      border: 1px solid ${d.color};
      border-radius: 8px;
      color: #fff;
      font-family: 'Inter', monospace;
      font-size: 12px;
      max-width: 260px;
      box-shadow: 0 0 24px ${d.color}50;
      line-height: 1.7;
    ">
      <div style="color: ${d.color}; font-weight: 700; margin-bottom: 8px; font-size: 13px; letter-spacing: 0.5px;">
        ${typeLabel}
      </div>
      <div style="color: #ddd; font-size: 11px;">
        ${d.label ? `<div>📌 ${d.label}</div>` : ''}
        ${d.country ? `<div>🌍 ${d.country}</div>` : ''}
        ${d.source ? `<div>🎯 Source: <span style="color:#ef4444">${d.source}</span></div>` : ''}
        ${d.severity ? `<div>⚡ Severity: <span style="color:${d.color}">${d.severity}</span></div>` : ''}
        ${d.timestamp ? `<div>🕐 ${d.timestamp}</div>` : ''}
        ${d.toolName ? `<div>🛠️ ${d.toolName}</div>` : ''}
      </div>
    </div>
  `;
}

export default function ThreatGlobe({ attacks, activeLayers, onPointClick }) {
  const globeEl = useRef(null);
  const [historicalAttacks, setHistoricalAttacks] = useState([]);
  const [infrastructureNodes, setInfrastructureNodes] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [secureNodes, setSecureNodes] = useState([]);
  const [arcs, setArcs] = useState([]);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-rotate on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.4;
      globeEl.current.controls().enableDamping = true;
      globeEl.current.controls().dampingFactor = 0.1;
      globeEl.current.pointOfView({ lat: 20, lng: 10, altitude: 1.8 }, 0);
    }
  }, []);

  // Generate static data once
  useEffect(() => {
    // Historical attacks
    const histAttacks = Array.from({ length: 200 }, () => {
      const target = CITIES[Math.floor(Math.random() * CITIES.length)];
      const severity = Math.random() > 0.7 ? 'Critical' : Math.random() > 0.4 ? 'High' : 'Medium';
      const type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
      return {
        lat: target.lat + (Math.random() - 0.5) * 2,
        lng: target.lng + (Math.random() - 0.5) * 2,
        size: severity === 'Critical' ? 2.0 : severity === 'High' ? 1.4 : 0.9,
        color: getSeverityColor(severity),
        label: type,
        severity,
        country: target.name,
        type: 'historical_attack'
      };
    });
    setHistoricalAttacks(histAttacks);

    // Infrastructure nodes
    const infraNodes = Array.from({ length: 100 }, () => {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      return {
        lat: city.lat + (Math.random() - 0.5) * 3,
        lng: city.lng + (Math.random() - 0.5) * 3,
        size: 1.2,
        color: '#3b82f6',
        label: 'Infrastructure Node',
        country: city.name,
        type: 'infrastructure'
      };
    });
    setInfrastructureNodes(infraNodes);

    // Threat hotspots
    const hotspotData = Array.from({ length: 50 }, () => {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      return {
        lat: city.lat + (Math.random() - 0.5) * 1,
        lng: city.lng + (Math.random() - 0.5) * 1,
        size: 2.5,
        color: '#f97316',
        label: `High Activity Zone`,
        country: city.name,
        type: 'hotspot'
      };
    });
    setHotspots(hotspotData);

    // Secure nodes — real global tech hubs only
    const secureNodeData = Array.from({ length: 84 }, (_, i) => {
      const hub = TECH_HUBS[i % TECH_HUBS.length];
      return {
        lat: hub.lat + (Math.random() - 0.5) * 0.3,
        lng: hub.lng + (Math.random() - 0.5) * 0.3,
        size: 1.6,
        color: '#10b981',
        label: hub.name,
        country: hub.name,
        type: 'secure_node',
        toolName: `Monitored Node`
      };
    });
    setSecureNodes(secureNodeData);
  }, []);

  // Update arcs when live attacks change — show last 15 as animated arcs
  useEffect(() => {
    if (!activeLayers.attacks) {
      setArcs([]);
      return;
    }
    const recentArcs = attacks.slice(0, 15).map(a => ({
      startLat: a.source_lat,
      startLng: a.source_lng,
      endLat: a.target_lat,
      endLng: a.target_lng,
      color: getSeverityColor(a.severity),
      label: a.attack_type,
      severity: a.severity,
      source: a.source_country,
      target: a.target_country,
      stroke: a.severity === 'Critical' ? 1.2 : 0.8
    }));
    setArcs(recentArcs);
  }, [attacks, activeLayers.attacks]);

  // Build point data from active layers
  const pointData = [];

  if (activeLayers.attacks) {
    attacks.forEach(a => {
      pointData.push({
        lat: a.target_lat,
        lng: a.target_lng,
        size: a.severity === 'Critical' ? 2.8 : a.severity === 'High' ? 2.0 : 1.4,
        color: getSeverityColor(a.severity),
        label: a.attack_type,
        severity: a.severity,
        timestamp: a.timestamp,
        source: a.source_country,
        country: a.target_country,
        type: 'live_attack'
      });
    });
    historicalAttacks.forEach(h => pointData.push(h));
  }

  if (activeLayers.tools) secureNodes.forEach(n => pointData.push(n));
  if (activeLayers.infrastructure) infrastructureNodes.forEach(n => pointData.push(n));
  if (activeLayers.hotspots) hotspots.forEach(h => pointData.push(h));

  if (activeLayers.nuclear) {
    NUCLEAR_SITES.forEach(site => {
      pointData.push({
        ...site,
        size: 2,
        color: '#fbbf24',
        type: 'nuclear'
      });
    });
  }

  const ringData = pointData.filter(d => d.type === 'live_attack');

  const handlePointClick = useCallback((point) => {
    if (onPointClick) onPointClick(point);
  }, [onPointClick]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}

        // Textures
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        cloudsImageUrl="//unpkg.com/three-globe/example/img/earth-clouds.png"
        cloudsOpacity={0.15}
        cloudsSpeed={0.0004}

        // Atmosphere — deeper blue glow
        atmosphereColor="#1a3a6a"
        atmosphereAltitude={0.18}

        // Points
        pointsData={pointData}
        pointColor="color"
        pointAltitude={0.025}
        pointRadius={d => d.size * 0.4}
        pointResolution={8}
        pointsMerge={false}
        pointLabel={buildTooltip}
        onPointClick={handlePointClick}

        // Rings on live attacks only
        ringsData={ringData}
        ringColor={d => t => {
          const alpha = Math.max(0, 1 - t);
          const hex = d.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        }}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={800}

        // Arcs for live attack trajectories
        arcsData={arcs}
        arcColor="color"
        arcAltitude={0.3}
        arcStroke={d => d.stroke}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1800}
        arcLabel={d => `
          <div style="background:rgba(0,0,0,0.85);padding:8px 12px;border:1px solid ${d.color};border-radius:6px;color:#fff;font-size:11px;">
            <div style="color:${d.color};font-weight:bold;">${d.label}</div>
            <div>${d.source} → ${d.target}</div>
            <div style="color:#888;">Severity: ${d.severity}</div>
          </div>
        `}

        rendererConfig={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      />
    </div>
  );
}