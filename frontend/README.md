# 🌍 XATLAS: Global Threat Monitor & OSINT Platform

> **Real-time cybersecurity situational awareness dashboard visualizing global threats, simulating live attack vectors, and providing actionable Open Source Intelligence (OSINT) tools.**

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688)
![Python](https://img.shields.io/badge/Python-3.11-3776AB)

---

## 🚀 Project Overview

**XATLAS** is a high-fidelity cyber threat intelligence platform designed for Security Operations Centers (SOCs) and analysts. It combines a photorealistic 3D globe visualization with real-time data simulation and practical security utilities.

Unlike standard dashboards, XATLAS integrates:
1.  **Live Threat Simulation**: Generates realistic cyber attack patterns (DDoS, APT, Ransomware) across 150+ global cities.
2.  **OSINT Tool Suite**: Built-in utilities for password breach checking (via *Have I Been Pwned*) and safe DNS reconnaissance.
3.  **Migration Intelligence**: A comprehensive database mapping 150+ proprietary enterprise tools to secure Open Source alternatives.

---

## 🛡️ Key Features

### 🌐 Interactive 3D Globe
- Powered by `react-globe.gl` and `Three.js`.
- **Dynamic Layers**: Toggle visibility for Live Attacks, Secure Nodes, Infrastructure, Threat Hotspots, and Nuclear Sites.
- **Real-Time Rendering**: Displays pulsing attack rings, infrastructure clusters, and historical data points.
- **Interactive Tooltips**: Click any node to view detailed threat intelligence reports.

### 🔐 Security Utilities
- **Breach Checker**: Validates passwords against the *Have I Been Pwned* API using **SHA-1 K-Anonymity** (only hash prefixes are transmitted).
- **Safe Recon Terminal**: Executes pre-approved DNS lookups safely without exposing the analyst's IP address.
- **Alternative Finder**: Search for proprietary software (e.g., "Photoshop", "SolidWorks") to find vetted, secure open-source replacements with migration difficulty ratings.

### 📊 Threat Intelligence Dashboard
- **Live Statistics**: Real-time counters for total attacks, critical severity events, top targeted regions, and primary threat actors.
- **Attack Vectors**: Visual breakdown of attack types (DDoS, SQL Injection, Phishing, etc.).
- **Simulation Control**: Pause/Resume functionality for presentations and detailed analysis.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, CSS Modules, React Globe GL, Three.js |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy, Uvicorn |
| **Database** | SQLite (with seeders for 150+ tools) |
| **APIs** | Have I Been Pwned (v3), Socket (DNS Lookup) |
| **Visualization** | Custom GeoJSON data, Pulsing Ring Animations |

🎯 Usage Guide
Monitor Threats: Watch the globe for pulsing red/orange rings indicating live attacks.
Analyze Layers: Use the left sidebar to toggle specific data layers (e.g., hide "Live Attacks" to see "Secure Nodes").
Check Credentials: Use the Breach Checker in the bottom panel to verify password safety.
Find Alternatives: Search for proprietary software (e.g., "Photoshop") to find vetted open-source replacements.
Presentation Mode: Click "Pause Simulation" in the top right to freeze the map for screenshots or demos.

🔒 Security Note
The Breach Checker uses k-anonymity; only the first 5 characters of the SHA-1 hash are sent to the API, ensuring your password is never exposed.
The Recon Terminal restricts commands to safe DNS lookups only to prevent server-side execution attacks.

🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

Developed by @pranav-ggez on GitHub