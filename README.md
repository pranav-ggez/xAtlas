# XATLAS: Global Threat Monitor & OSINT Platform

> **Real-time cybersecurity situational awareness platform combining global threat visualization with practical OSINT and personal security tools.**

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688)
![Python](https://img.shields.io/badge/Python-3.11-3776AB)

---

## 🚀 Project Overview

**XATLAS** is a cybersecurity intelligence platform that blends **global threat visibility** with **real-world security tools** for both analysts and everyday users.

Unlike traditional dashboards, XATLAS is built as a **hybrid system**:

1. **Global Threat Visualization** — Interactive 3D globe displaying attack patterns and threat activity.
2. **Real OSINT Tool Suite** — Practical utilities powered by real APIs and browser-level data.
3. **User-Focused Security Tools** — Helps individuals analyze links, permissions, and digital exposure.

---

## 🛡️ Key Features

### 🌐 Interactive Threat Globe

* Powered by `react-globe.gl` and `Three.js`
* Real-time rendering of global attack patterns
* Dynamic layers for attacks, hotspots, and infrastructure
* Interactive nodes with contextual intelligence

---

### 🔐 Security & OSINT Tools

* **URL Safety Checker**

  * Scans links for reputation, HTTPS status, and redirects
  * Integrates with real threat intelligence sources

* **Digital Footprint Scanner**

  * Displays IP info, ISP, and approximate geolocation
  * Reveals browser-level exposure (cookies, storage, fingerprint basics)

* **Permission Analyzer**

  * Shows camera, microphone, location, and notification permissions
  * Uses browser APIs to reflect real access states

* **Public WiFi Risk Checker**

  * Detects secure/insecure browsing context
  * Warns about unsafe network conditions

* **Password Breach Checker**

  * Uses *Have I Been Pwned* with SHA-1 k-anonymity
  * Passwords are never transmitted directly

* **Safe Recon Terminal**

  * Executes controlled DNS lookups securely

* **Email Breach Checker**

  * Checks email exposure against known breach datasets

---

### 📊 Threat Intelligence Dashboard

* Live attack feed and categorized threat activity
* Severity classification (Critical / High / Medium)
* Region-based targeting insights
* Pause/resume simulation for analysis and demos

---

## 🛠️ Tech Stack

| Component         | Technology                                         |
| :---------------- | :------------------------------------------------- |
| **Frontend**      | React 18, Vite, CSS Modules, Three.js              |
| **Backend**       | FastAPI, Python 3.11                               |
| **Database**      | SQLite                                             |
| **APIs**          | Have I Been Pwned, ThreatFox, IP Intelligence APIs |
| **Visualization** | react-globe.gl, custom geo layers                  |

---

## 🎯 Usage Guide

* Monitor Threats: Observe live attack activity on the globe
* Explore Tools: Use the Tools section for security analysis
* Check Links: Verify suspicious URLs before opening them
* Analyze Exposure: Understand what data your browser reveals
* Audit Permissions: See what access websites currently have

---

## 🔒 Security Note

* Password checks use **k-anonymity** — only hash prefixes are sent
* No sensitive data is stored or logged
* All tools rely on **real data sources or browser APIs**
* No simulated security results are presented

---

## 🤝 Contributing

Contributions are welcome. Fork the repository and submit a pull request.

---

Developed by @pranav-ggez on GitHub
