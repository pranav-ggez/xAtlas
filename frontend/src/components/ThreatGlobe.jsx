import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

export default function ThreatGlobe({ attacks, activeLayers }) {
  const globeEl = useRef(null);
  const [historicalAttacks, setHistoricalAttacks] = useState([]);
  const [infrastructureNodes, setInfrastructureNodes] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [secureNodes, setSecureNodes] = useState([]);

  // Generate persistent data on mount
  useEffect(() => {
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
      { name: "Thailand", lat: 13.7563, lng: 100.5018 },
      { name: "Vietnam", lat: 21.0285, lng: 105.8542 },
      { name: "Pakistan", lat: 33.6844, lng: 73.0479 },
      { name: "Bangladesh", lat: 23.8103, lng: 90.4125 },
      { name: "Egypt", lat: 30.0444, lng: 31.2357 },
      { name: "Nigeria", lat: 6.5244, lng: 3.3792 },
      { name: "Kenya", lat: -1.2921, lng: 36.8219 },
      { name: "Argentina", lat: -34.6037, lng: -58.3816 },
      { name: "Chile", lat: -33.4489, lng: -70.6693 },
      { name: "Colombia", lat: 4.7110, lng: -74.0721 },
      { name: "Peru", lat: -12.0464, lng: -77.0428 },
      { name: "Venezuela", lat: 10.4806, lng: -66.9036 },
      { name: "Ukraine", lat: 50.4501, lng: 30.5234 },
      { name: "Belarus", lat: 53.9006, lng: 27.5590 },
      { name: "Kazakhstan", lat: 51.1694, lng: 71.4491 },
      { name: "Malaysia", lat: 3.1390, lng: 101.6869 },
      { name: "Philippines", lat: 14.5995, lng: 120.9842 },
      { name: "New Zealand", lat: -41.2865, lng: 174.7762 },
      { name: "Finland", lat: 60.1699, lng: 24.9384 },
      { name: "Norway", lat: 59.9139, lng: 10.7522 },
      { name: "Denmark", lat: 55.6761, lng: 12.5683 },
      { name: "Austria", lat: 48.2082, lng: 16.3738 },
      { name: "Switzerland", lat: 46.8182, lng: 8.2275 },
      { name: "Belgium", lat: 50.8503, lng: 4.3517 },
      { name: "Portugal", lat: 38.7223, lng: -9.1393 },
      { name: "Greece", lat: 37.9838, lng: 23.7275 },
      { name: "Czech Republic", lat: 50.0755, lng: 14.4378 },
      { name: "Romania", lat: 44.4268, lng: 26.1025 },
      { name: "Hungary", lat: 47.4979, lng: 19.0402 },
      { name: "Bulgaria", lat: 42.6977, lng: 23.3219 },
      { name: "Croatia", lat: 45.8150, lng: 15.9819 },
      { name: "Serbia", lat: 44.7866, lng: 20.4489 },
      { name: "Slovakia", lat: 48.1486, lng: 17.1077 },
      { name: "Slovenia", lat: 46.0569, lng: 14.5058 },
      { name: "Lithuania", lat: 54.6872, lng: 25.2797 },
      { name: "Latvia", lat: 56.9496, lng: 24.1052 },
      { name: "Estonia", lat: 59.4370, lng: 24.7536 },
      { name: "Ireland", lat: 53.3498, lng: -6.2603 },
      { name: "Iceland", lat: 64.1466, lng: -21.9426 },
      { name: "Luxembourg", lat: 49.6116, lng: 6.1319 },
      { name: "Malta", lat: 35.8989, lng: 14.5146 },
      { name: "Cyprus", lat: 35.1856, lng: 33.3823 },
      { name: "Qatar", lat: 25.2854, lng: 51.5310 },
      { name: "Kuwait", lat: 29.3759, lng: 47.9774 },
      { name: "Bahrain", lat: 26.0667, lng: 50.5577 },
      { name: "Oman", lat: 23.5880, lng: 58.3829 },
      { name: "Jordan", lat: 31.9454, lng: 35.9284 },
      { name: "Lebanon", lat: 33.8886, lng: 35.4955 },
      { name: "Iraq", lat: 33.3152, lng: 44.3661 },
      { name: "Syria", lat: 34.8021, lng: 38.9968 },
      { name: "Yemen", lat: 15.5527, lng: 48.5164 },
      { name: "Afghanistan", lat: 34.5553, lng: 69.2075 },
      { name: "Myanmar", lat: 21.9162, lng: 95.9560 },
      { name: "Cambodia", lat: 11.5564, lng: 104.9282 },
      { name: "Laos", lat: 17.9757, lng: 102.6331 },
      { name: "Nepal", lat: 27.7172, lng: 85.3240 },
      { name: "Sri Lanka", lat: 6.9271, lng: 79.8612 },
      { name: "Mongolia", lat: 47.8864, lng: 106.9057 },
      { name: "Tajikistan", lat: 38.8610, lng: 71.2761 },
      { name: "Kyrgyzstan", lat: 42.8746, lng: 74.5698 },
      { name: "Turkmenistan", lat: 37.9601, lng: 58.3261 },
      { name: "Uzbekistan", lat: 41.2995, lng: 69.2401 },
      { name: "Armenia", lat: 40.1792, lng: 44.4991 },
      { name: "Georgia", lat: 41.7151, lng: 44.8271 },
      { name: "Azerbaijan", lat: 40.4093, lng: 49.8671 },
      { name: "Algeria", lat: 36.7538, lng: 3.0588 },
      { name: "Morocco", lat: 33.9716, lng: -6.8498 },
      { name: "Tunisia", lat: 36.8065, lng: 10.1815 },
      { name: "Libya", lat: 32.8872, lng: 13.1913 },
      { name: "Sudan", lat: 15.5007, lng: 32.5599 },
      { name: "Ethiopia", lat: 9.1450, lng: 40.4897 },
      { name: "Somalia", lat: 2.0469, lng: 45.3182 },
      { name: "Djibouti", lat: 11.8251, lng: 42.5903 },
      { name: "Eritrea", lat: 15.1794, lng: 39.7823 },
      { name: "South Sudan", lat: 4.8594, lng: 31.5713 },
      { name: "Central African Republic", lat: 4.3947, lng: 18.5582 },
      { name: "Chad", lat: 12.1348, lng: 15.0557 },
      { name: "Cameroon", lat: 3.8480, lng: 11.5021 },
      { name: "Gabon", lat: 0.4162, lng: 9.4673 },
      { name: "Equatorial Guinea", lat: 1.6508, lng: 10.2679 },
      { name: "Republic of the Congo", lat: -4.2634, lng: 15.2429 },
      { name: "Democratic Republic of the Congo", lat: -4.0383, lng: 21.7587 },
      { name: "Angola", lat: -8.8390, lng: 13.2894 },
      { name: "Zambia", lat: -15.3875, lng: 28.3228 },
      { name: "Zimbabwe", lat: -17.8252, lng: 31.0335 },
      { name: "Botswana", lat: -24.6282, lng: 25.9231 },
      { name: "Namibia", lat: -22.9576, lng: 18.4904 },
      { name: "Lesotho", lat: -29.6100, lng: 28.2336 },
      { name: "Eswatini", lat: -26.5225, lng: 31.4659 },
      { name: "Mozambique", lat: -25.9692, lng: 32.5732 },
      { name: "Madagascar", lat: -18.7669, lng: 46.8691 },
      { name: "Mauritius", lat: -20.3484, lng: 57.5522 },
      { name: "Seychelles", lat: -4.6796, lng: 55.4920 },
      { name: "Comoros", lat: -11.8750, lng: 43.8722 },
      { name: "Tanzania", lat: -6.3690, lng: 34.8888 },
      { name: "Rwanda", lat: -1.9403, lng: 29.8739 },
      { name: "Burundi", lat: -3.3731, lng: 29.9189 },
      { name: "Uganda", lat: 0.3476, lng: 32.5825 },
      { name: "Malawi", lat: -13.2543, lng: 34.3015 },
      { name: "Senegal", lat: 14.4974, lng: -14.4524 },
      { name: "Gambia", lat: 13.4432, lng: -15.3101 },
      { name: "Guinea-Bissau", lat: 11.8037, lng: -15.1804 },
      { name: "Guinea", lat: 9.9456, lng: -9.6966 },
      { name: "Sierra Leone", lat: 8.4606, lng: -11.7799 },
      { name: "Liberia", lat: 6.4281, lng: -9.4295 },
      { name: "Ivory Coast", lat: 7.5400, lng: -5.5471 },
      { name: "Ghana", lat: 7.9465, lng: -1.0232 },
      { name: "Togo", lat: 6.1256, lng: 1.2250 },
      { name: "Benin", lat: 6.4969, lng: 2.6289 },
      { name: "Niger", lat: 17.6078, lng: 8.0817 },
      { name: "Mali", lat: 17.5707, lng: -3.9962 },
      { name: "Burkina Faso", lat: 12.2383, lng: -1.5616 },
      { name: "Mauritania", lat: 21.0079, lng: -10.9408 },
      { name: "Western Sahara", lat: 24.2155, lng: -12.8858 },
      { name: "Cape Verde", lat: 16.5388, lng: -24.0132 },
      { name: "Sao Tome and Principe", lat: 0.1864, lng: 6.6131 },
      { name: "Papua New Guinea", lat: -6.314993, lng: 143.95555 },
      { name: "Solomon Islands", lat: -9.6457, lng: 160.1562 },
      { name: "Vanuatu", lat: -15.3767, lng: 166.9592 },
      { name: "Fiji", lat: -16.578, lng: 179.4144 },
      { name: "Samoa", lat: -13.759, lng: -172.1046 },
      { name: "Tonga", lat: -21.1789, lng: -175.1982 },
      { name: "Kiribati", lat: 1.8709, lng: -157.3630 },
      { name: "Marshall Islands", lat: 7.1315, lng: 171.1845 },
      { name: "Micronesia", lat: 7.4256, lng: 150.5508 },
      { name: "Palau", lat: 7.5150, lng: 134.5825 },
      { name: "Nauru", lat: -0.5228, lng: 166.9315 },
      { name: "Tuvalu", lat: -7.1095, lng: 177.6493 }
    ];

    // Generate 200+ historical attacks
    const histAttacks = [];
    for (let i = 0; i < 200; i++) {
      const source = cities[Math.floor(Math.random() * cities.length)];
      let target = cities[Math.floor(Math.random() * cities.length)];
      while (source === target) {
        target = cities[Math.floor(Math.random() * cities.length)];
      }
      
      const types = ["DDoS", "SQL Injection", "Brute Force", "Malware C2", "Zero-Day", "Ransomware", "Phishing", "APT"];
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = Math.random() > 0.7 ? "Critical" : Math.random() > 0.4 ? "High" : "Medium";
      
      histAttacks.push({
        lat: target.lat + (Math.random() - 0.5) * 2,
        lng: target.lng + (Math.random() - 0.5) * 2,
        size: severity === "Critical" ? 2.5 : severity === "High" ? 1.8 : 1.2,
        color: severity === "Critical" ? '#ef4444' : severity === "High" ? '#f97316' : '#fbbf24',
        label: `${type}`,
        severity: severity,
        country: target.name
      });
    }
    setHistoricalAttacks(histAttacks);

    // Generate 100+ infrastructure nodes
    const infraNodes = [];
    for (let i = 0; i < 100; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      infraNodes.push({
        lat: city.lat + (Math.random() - 0.5) * 3,
        lng: city.lng + (Math.random() - 0.5) * 3,
        size: 1.5,
        color: '#3b82f6',
        label: `Infrastructure Node`,
        type: 'infrastructure'
      });
    }
    setInfrastructureNodes(infraNodes);

    // Generate 50+ threat hotspots
    const hotspotCities = [];
    for (let i = 0; i < 50; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      hotspotCities.push({
        lat: city.lat,
        lng: city.lng,
        size: 3,
        color: '#f97316',
        label: `Threat Hotspot`,
        intensity: Math.random()
      });
    }
    setHotspots(hotspotCities);

    // Generate 84 SECURE NODES (from database tools)
    const secureNodeData = [];
    // Use a subset of major tech hubs for secure nodes
    const techHubs = [
      { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
      { name: "Seattle", lat: 47.6062, lng: -122.3321 },
      { name: "Austin", lat: 30.2672, lng: -97.7431 },
      { name: "Boston", lat: 42.3601, lng: -71.0589 },
      { name: "London", lat: 51.5074, lng: -0.1278 },
      { name: "Berlin", lat: 52.5200, lng: 13.4050 },
      { name: "Paris", lat: 48.8566, lng: 2.3522 },
      { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
      { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
      { name: "Singapore", lat: 1.3521, lng: 103.8198 },
      { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
      { name: "Tel Aviv", lat: 32.0853, lng: 34.7818 },
      { name: "Toronto", lat: 43.6532, lng: -79.3832 },
      { name: "Sydney", lat: -33.8688, lng: 151.2093 },
      { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
      { name: "Helsinki", lat: 60.1699, lng: 24.9384 },
      { name: "Copenhagen", lat: 55.6761, lng: 12.5683 },
      { name: "Zurich", lat: 46.8182, lng: 8.2275 },
      { name: "Vienna", lat: 48.2082, lng: 16.3738 },
      { name: "Warsaw", lat: 52.2297, lng: 21.0122 },
      { name: "Prague", lat: 50.0755, lng: 14.4378 },
      { name: "Budapest", lat: 47.4979, lng: 19.0402 },
      { name: "Bucharest", lat: 44.4268, lng: 26.1025 },
      { name: "Sofia", lat: 42.6977, lng: 23.3219 },
      { name: "Athens", lat: 37.9838, lng: 23.7275 },
      { name: "Lisbon", lat: 38.7223, lng: -9.1393 },
      { name: "Madrid", lat: 40.4168, lng: -3.7038 },
      { name: "Rome", lat: 41.9028, lng: 12.4964 },
      { name: "Milan", lat: 45.4642, lng: 9.1900 },
      { name: "Munich", lat: 48.1351, lng: 11.5820 },
      { name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
      { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
      { name: "Oslo", lat: 59.9139, lng: 10.7522 },
      { name: "Gothenburg", lat: 57.7089, lng: 11.9746 },
      { name: "Malmö", lat: 55.6050, lng: 13.0038 },
      { name: "Reykjavik", lat: 64.1466, lng: -21.9426 },
      { name: "Dublin", lat: 53.3498, lng: -6.2603 },
      { name: "Edinburgh", lat: 55.9533, lng: -3.1883 },
      { name: "Manchester", lat: 53.4808, lng: -2.2426 },
      { name: "Birmingham", lat: 52.4862, lng: -1.8904 },
      { name: "Liverpool", lat: 53.4084, lng: -2.9916 },
      { name: "Leeds", lat: 53.8008, lng: -1.5491 },
      { name: "Bristol", lat: 51.4545, lng: -2.5879 },
      { name: "Cardiff", lat: 51.4816, lng: -3.1791 },
      { name: "Belfast", lat: 54.5973, lng: -5.9301 },
      { name: "Glasgow", lat: 55.8642, lng: -4.2518 },
      { name: "Aberdeen", lat: 57.1497, lng: -2.0943 },
      { name: "Inverness", lat: 57.4778, lng: -4.2247 },
      { name: "Stirling", lat: 56.1165, lng: -3.9369 },
      { name: "Perth", lat: 56.3950, lng: -3.4370 },
      { name: "Dundee", lat: 56.4620, lng: -2.9707 },
      { name: "Newcastle", lat: 54.9783, lng: -1.6178 },
      { name: "Sheffield", lat: 53.3811, lng: -1.4701 },
      { name: "Nottingham", lat: 52.9548, lng: -1.1581 },
      { name: "Leicester", lat: 52.6369, lng: -1.1398 },
      { name: "Coventry", lat: 52.4068, lng: -1.5197 },
      { name: "Wolverhampton", lat: 52.5865, lng: -2.1285 },
      { name: "Stoke-on-Trent", lat: 53.0027, lng: -2.1794 },
      { name: "Derby", lat: 52.9225, lng: -1.4746 },
      { name: "Lincoln", lat: 53.2307, lng: -0.5406 },
      { name: "York", lat: 53.9600, lng: -1.0873 },
      { name: "Hull", lat: 53.7457, lng: -0.3367 },
      { name: "Plymouth", lat: 50.3755, lng: -4.1427 },
      { name: "Exeter", lat: 50.7184, lng: -3.5339 },
      { name: "Bath", lat: 51.3758, lng: -2.3599 },
      { name: "Gloucester", lat: 51.8642, lng: -2.2382 },
      { name: "Oxford", lat: 51.7520, lng: -1.2577 },
      { name: "Cambridge", lat: 52.2053, lng: 0.1218 },
      { name: "Norwich", lat: 52.6309, lng: 1.2974 },
      { name: "Ipswich", lat: 52.0594, lng: 1.1556 },
      { name: "Colchester", lat: 51.8860, lng: 0.9035 },
      { name: "Southend-on-Sea", lat: 51.5459, lng: 0.7077 },
      { name: "Brighton", lat: 50.8225, lng: -0.1372 },
      { name: "Portsmouth", lat: 50.8198, lng: -1.0880 },
      { name: "Southampton", lat: 50.9097, lng: -1.4044 },
      { name: "Reading", lat: 51.4543, lng: -0.9781 },
      { name: "Slough", lat: 51.5105, lng: -0.5950 },
      { name: "Luton", lat: 51.8787, lng: -0.4200 },
      { name: "Watford", lat: 51.6565, lng: -0.3903 },
      { name: "St Albans", lat: 51.7520, lng: -0.3360 },
      { name: "Hemel Hempstead", lat: 51.7520, lng: -0.4670 },
      { name: "High Wycombe", lat: 51.6280, lng: -0.7480 },
      { name: "Aylesbury", lat: 51.8160, lng: -0.8100 },
      { name: "Milton Keynes", lat: 52.0406, lng: -0.7594 },
      { name: "Northampton", lat: 52.2405, lng: -0.9027 },
      { name: "Peterborough", lat: 52.5695, lng: -0.2405 },
      { name: "Cambridge", lat: 52.2053, lng: 0.1218 },
      { name: "Ely", lat: 52.3980, lng: 0.2620 },
      { name: "King's Lynn", lat: 52.7530, lng: 0.3980 },
      { name: "Great Yarmouth", lat: 52.6080, lng: 1.7260 },
      { name: "Lowestoft", lat: 52.4780, lng: 1.7520 },
      { name: "Bury St Edmunds", lat: 52.2460, lng: 0.7120 },
      { name: "Newmarket", lat: 52.2440, lng: 0.4060 },
      { name: "Thetford", lat: 52.4140, lng: 0.7420 },
      { name: "Diss", lat: 52.3720, lng: 1.1120 },
      { name: "Harleston", lat: 52.3720, lng: 1.2120 },
      { name: "Beccles", lat: 52.4520, lng: 1.5620 },
      { name: "Halesworth", lat: 52.3520, lng: 1.5120 },
      { name: "Southwold", lat: 52.3220, lng: 1.6720 },
      { name: "Aldeburgh", lat: 52.1520, lng: 1.6120 },
      { name: "Saxmundham", lat: 52.2520, lng: 1.5120 },
      { name: "Wickham Market", lat: 52.1520, lng: 1.4120 },
      { name: "Woodbridge", lat: 52.0920, lng: 1.3120 },
      { name: "Framlingham", lat: 52.2120, lng: 1.3420 },
      { name: "Eye", lat: 52.2920, lng: 1.0120 },
      { name: "Stradbroke", lat: 52.2720, lng: 1.2120 },
      { name: "Hoxne", lat: 52.2520, lng: 1.1120 },
      { name: "Harleston", lat: 52.3720, lng: 1.2120 },
      { name: "Bungay", lat: 52.4520, lng: 1.4520 },
      { name: "Beccles", lat: 52.4520, lng: 1.5620 },
      { name: "Halesworth", lat: 52.3520, lng: 1.5120 },
      { name: "Southwold", lat: 52.3220, lng: 1.6720 },
      { name: "Aldeburgh", lat: 52.1520, lng: 1.6120 },
      { name: "Saxmundham", lat: 52.2520, lng: 1.5120 },
      { name: "Wickham Market", lat: 52.1520, lng: 1.4120 },
      { name: "Woodbridge", lat: 52.0920, lng: 1.3120 },
      { name: "Framlingham", lat: 52.2120, lng: 1.3420 },
      { name: "Eye", lat: 52.2920, lng: 1.0120 },
      { name: "Stradbroke", lat: 52.2720, lng: 1.2120 },
      { name: "Hoxne", lat: 52.2520, lng: 1.1120 }
    ];

    // Create 84 secure nodes from these hubs
    for (let i = 0; i < 84; i++) {
      const hub = techHubs[i % techHubs.length];
      secureNodeData.push({
        lat: hub.lat + (Math.random() - 0.5) * 0.5,
        lng: hub.lng + (Math.random() - 0.5) * 0.5,
        size: 2,
        color: '#10b981',
        label: `Secure Node ${i + 1}`,
        type: 'secure_node',
        toolName: `Tool-${i + 1}`
      });
    }
    setSecureNodes(secureNodeData);

  }, []);

  // Prepare data based on active layers
  const pointData = [];
  
  if (activeLayers.attacks) {
    // Live attacks
    attacks.forEach(a => {
      pointData.push({
        lat: a.target_lat || a.targetLat,
        lng: a.target_lng || a.targetLng,
        size: a.severity === 'Critical' ? 3 : a.severity === 'High' ? 2 : 1.5,
        color: a.severity === 'Critical' ? '#ef4444' : a.severity === 'High' ? '#f97316' : '#fbbf24',
        label: `${a.attack_type}`,
        severity: a.severity,
        timestamp: a.timestamp,
        source: a.source_country,
        target: a.target_country,
        type: 'live_attack'
      });
    });
    
    // Historical attacks
    historicalAttacks.forEach(h => {
      pointData.push({
        lat: h.lat,
        lng: h.lng,
        size: h.size * 0.8,
        color: h.color,
        label: h.label,
        severity: h.severity,
        country: h.country,
        type: 'historical_attack'
      });
    });
  }

  if (activeLayers.tools) {
    // Secure nodes (green)
    secureNodes.forEach(node => {
      pointData.push(node);
    });
  }

  if (activeLayers.infrastructure) {
    infrastructureNodes.forEach(node => {
      pointData.push(node);
    });
  }

  if (activeLayers.hotspots) {
    hotspots.forEach(hs => {
      pointData.push(hs);
    });
  }

  // Nuclear sites (static, always visible if layer enabled)
  const nuclearSites = activeLayers.nuclear ? [
    { lat: 35.6762, lng: 139.6503, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 39.9042, lng: 116.4074, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 55.7558, lng: 37.6173, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 38.9072, lng: -77.0369, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 51.5074, lng: -0.1278, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 48.8566, lng: 2.3522, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 52.5200, lng: 13.4050, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 33.6844, lng: 73.0479, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 31.7683, lng: 35.2137, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' },
    { lat: 24.7136, lng: 46.6753, size: 2, color: '#fbbf24', label: 'Nuclear Facility', type: 'nuclear' }
  ] : [];

  nuclearSites.forEach(site => pointData.push(site));

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        cloudsImageUrl="//unpkg.com/three-globe/example/img/earth-clouds.png"
        cloudsSpeed={0.0005}
        
        pointsData={pointData}
        pointColor="color"
        pointAltitude={0.03}
        pointRadius={d => d.size}
        
        pointLabel={d => `
          <div style="
            background: rgba(0,0,0,0.9);
            padding: 10px 14px;
            border: 2px solid ${d.color};
            border-radius: 8px;
            color: #fff;
            font-family: 'Inter', monospace;
            font-size: 12px;
            max-width: 250px;
            box-shadow: 0 0 20px ${d.color}60;
          ">
            <div style="color: ${d.color}; font-weight: bold; margin-bottom: 6px; font-size: 14px;">
              ${d.type === 'live_attack' ? '⚠️ LIVE: ' : d.type === 'historical_attack' ? '📜 HISTORICAL: ' : d.type === 'infrastructure' ? '🏢 INFRA: ' : d.type === 'secure_node' ? '🟢 SECURE: ' : d.type === 'nuclear' ? '☢️ NUCLEAR: ' : '🔥 HOTSPOT: '}${d.label}
            </div>
            <div style="color: #aaa; font-size: 11px; line-height: 1.6;">
              ${d.country ? `<div>📍 Location: ${d.country}</div>` : ''}
              ${d.source ? `<div>🎯 Source: ${d.source}</div>` : ''}
              ${d.severity ? `<div>⚡ Severity: ${d.severity}</div>` : ''}
              ${d.timestamp ? `<div>🕐 ${d.timestamp}</div>` : ''}
              ${d.toolName ? `<div>🛠️ Tool: ${d.toolName}</div>` : ''}
            </div>
          </div>
        `}
        
        ringsData={pointData.filter(d => d.type === 'live_attack' || d.type === 'historical_attack')}
        ringColor={d => [d.color, 'transparent']}
        ringMaxRadius={d => d.size * 4}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1000}
        
        atmosphereColor="#1e3a8a"
        atmosphereAltitude={0.15}
        
        onPointClick={point => {
          const msg = `THREAT INTELLIGENCE REPORT\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Type: ${point.type === 'live_attack' ? 'LIVE ATTACK' : point.type === 'historical_attack' ? 'HISTORICAL ATTACK' : point.type === 'infrastructure' ? 'INFRASTRUCTURE NODE' : point.type === 'secure_node' ? 'SECURE NODE' : point.type === 'nuclear' ? 'NUCLEAR FACILITY' : 'THREAT HOTSPOT'}\n` +
            `Label: ${point.label}\n` +
            `Location: ${point.country || 'Unknown'}\n` +
            `Severity: ${point.severity || 'N/A'}\n` +
            `Source: ${point.source || 'Unknown'}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Analyze this threat in detail?`;
          if (window.confirm(msg)) {
            // Could open detailed modal here
          }
        }}
        
        rotateOnLoad={true}
        rotationSpeed={0.3}
        enableZoom={true}
        enablePan={true}
        initialPosition={{ lat: 20, lng: 0, altitude: 1.8 }}
        rendererConfig={{ antialias: true, alpha: true }}
      />
    </div>
  );
}