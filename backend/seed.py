from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import sessionmaker
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.database import Base, engine
    from app.models.tool import Tool
    from app.models.alternative import Alternative
    from app.models.command import Command
    
    # Local model for historical attacks (for seeding)
    class HistoricalAttack(Base):
        __tablename__ = "historical_attacks"
        id = Column(Integer, primary_key=True, index=True)
        source_country = Column(String)
        target_country = Column(String)
        source_lat = Column(Float)
        source_lng = Column(Float)
        target_lat = Column(Float)
        target_lng = Column(Float)
        attack_type = Column(String)
        timestamp = Column(DateTime)
        severity = Column(String)

    print("✅ Imports successful.")
except Exception as e:
    print(f"❌ IMPORT ERROR: {e}")
    sys.exit(1)

# --- THE MASTER LIST OF TOOLS (Duplicates Removed) ---
# Format: (OSS Name, Category, Description, License, Proprietary Target, Difficulty, Link, CVEs, Signed, Lat, Lng, Excuse/Note)
MASTER_DATA = [
    # --- OFFICE & PRODUCTIVITY ---
    ("LibreOffice", "office", "Full office suite (Writer, Calc, Impress).", "MPL", "Microsoft Office", "easy", "https://libreoffice.org", 0, True, 52.52, 13.40, ""),
    ("OnlyOffice", "office", "High compatibility MS Office clone.", "AGPL", "Microsoft Office 365", "easy", "https://onlyoffice.com", 0, True, 55.75, 37.61, ""),
    ("Calligra Suite", "office", "Integrated office suite for KDE.", "GPL", "Microsoft Office", "hard", "https://calligra.org", 0, False, 50.85, 4.35, ""),
    ("Etherpad", "office", "Real-time collaborative text editor.", "Apache", "Google Docs", "medium", "https://etherpad.org", 0, True, 37.77, -122.41, ""),
    ("CryptPad", "office", "End-to-end encrypted collaboration suite.", "AGPL", "Google Workspace", "medium", "https://cryptpad.fr", 0, True, 48.85, 2.35, ""),
    
    # --- DESIGN & MEDIA ---
    ("GIMP", "design", "Advanced raster image editor.", "GPL", "Adobe Photoshop", "medium", "https://gimp.org", 1, False, 51.50, -0.12, ""),
    ("Krita", "design", "Professional digital painting & illustration.", "GPL", "Corel Painter, Photoshop", "easy", "https://krita.org", 0, True, 50.85, 4.35, ""),
    ("Inkscape", "design", "Vector graphics editor.", "GPL", "Adobe Illustrator", "medium", "https://inkscape.org", 0, True, 37.77, -122.41, ""),
    ("Scribus", "design", "Desktop publishing (DTP).", "GPL", "Adobe InDesign", "hard", "https://scribus.net", 0, False, 52.52, 13.40, ""),
    ("Darktable", "media", "Photography workflow & RAW developer.", "GPL", "Adobe Lightroom", "medium", "https://darktable.org", 0, True, 48.85, 2.35, ""),
    ("RawTherapee", "media", "Cross-platform RAW image processor.", "GPL", "Capture One", "hard", "https://rawtherapee.com", 0, False, 47.49, 19.04, ""),
    ("Blender", "media", "3D creation suite (Modeling, Animation).", "GPL", "Maya, 3ds Max, Cinema 4D", "medium", "https://blender.org", 0, True, 50.85, 4.35, ""),
    ("Kdenlive", "media", "Non-linear video editor.", "GPL", "Adobe Premiere Pro", "medium", "https://kdenlive.org", 0, False, 48.85, 2.35, ""),
    ("Shotcut", "media", "Cross-platform video editor.", "GPL", "Final Cut Pro", "easy", "https://shotcut.org", 0, True, 37.77, -122.41, ""),
    ("OBS Studio", "media", "Broadcasting & screen recording.", "GPL", "Camtasia, Zoom Recording", "easy", "https://obsproject.com", 0, True, 37.77, -122.41, ""),
    ("Audacity", "media", "Audio editing & recording.", "GPL", "Adobe Audition", "easy", "https://audacityteam.org", 2, True, 37.77, -122.41, ""),
    ("Ardour", "media", "Digital Audio Workstation (DAW).", "GPL", "Pro Tools, Logic Pro", "hard", "https://ardour.org", 0, True, 37.77, -122.41, ""),
    ("Synfig Studio", "media", "2D vector animation.", "GPL", "Adobe After Effects", "hard", "https://synfig.org", 0, False, 40.41, -3.70, ""),
    ("Natron", "media", "Node-based compositing.", "MPL", "Nuke, After Effects", "hard", "https://natrongithub.github.io", 0, False, 48.85, 2.35, ""),
    ("HandBrake", "media", "Video transcoder.", "GPL", "MediaEncoder", "easy", "https://handbrake.fr", 0, True, 37.77, -122.41, ""),

    # --- DEVELOPMENT & DATA SCIENCE ---
    ("VS Code", "dev", "Code editor (Open Source Build).", "MIT", "Sublime Text, Atom", "easy", "https://code.visualstudio.com", 0, True, 47.60, -122.33, ""),
    ("Eclipse", "dev", "Integrated Development Environment.", "EPL", "IntelliJ IDEA (Ultimate)", "medium", "https://eclipse.org", 1, True, 50.85, 4.35, ""),
    ("NetBeans", "dev", "Java IDE.", "Apache", "Oracle JDeveloper", "medium", "https://netbeans.apache.org", 0, True, 37.77, -122.41, ""),
    ("Postman (Insomnia)", "dev", "API Testing Client.", "Apache", "Postman (Cloud features)", "easy", "https://insomnia.rest", 0, True, 37.77, -122.41, "Insomnia is the OSS alternative to Postman's cloud features."),
    ("Git", "dev", "Version Control System.", "GPL", "Perforce, SVN", "medium", "https://git-scm.com", 0, True, 37.77, -122.41, ""),
    ("MySQL/MariaDB", "dev", "Relational Database.", "GPL", "Oracle DB, MS SQL Server", "medium", "https://mariadb.org", 0, True, 50.85, 4.35, ""),
    ("PostgreSQL", "dev", "Advanced Relational Database.", "PostgreSQL", "Oracle DB", "medium", "https://postgresql.org", 0, True, 37.77, -122.41, ""),
    ("MongoDB (Community)", "dev", "NoSQL Database.", "SSPL", "Couchbase Enterprise", "easy", "https://mongodb.com", 1, True, 37.77, -122.41, ""),
    ("Python", "dev", "Programming Language.", "PSF", "MATLAB (for scripting)", "hard", "https://python.org", 0, True, 37.77, -122.41, ""),
    ("R Project", "dev", "Statistical Computing.", "GPL", "SAS, SPSS", "hard", "https://r-project.org", 0, True, 37.77, -122.41, ""),
    ("Scilab", "dev", "Numerical Computation.", "CeCILL", "MATLAB", "hard", "https://scilab.org", 0, True, 48.85, 2.35, ""),
    ("Octave", "dev", "High-level language for numerical computations.", "GPL", "MATLAB", "medium", "https://octave.org", 0, False, 37.77, -122.41, ""),
    ("Jupyter", "dev", "Interactive Computing Notebooks.", "BSD", "MATLAB Notebooks", "easy", "https://jupyter.org", 0, True, 37.77, -122.41, ""),
    ("TensorFlow/PyTorch", "dev", "Machine Learning Frameworks.", "Apache/BSD", "Proprietary AI Suites", "hard", "https://pytorch.org", 0, True, 37.77, -122.41, ""),
    ("Godot Engine", "dev", "Game Engine.", "MIT", "Unity, Unreal Engine", "medium", "https://godotengine.org", 0, True, 34.05, -118.24, ""),
    ("Unity (Personal)", "dev", "Game Engine (Free Tier).", "Proprietary-Free", "Unreal Engine", "easy", "https://unity.com", 0, True, 37.77, -122.41, "Not strictly OSS but free for students."),

    # --- COMMUNICATION & COLLABORATION ---
    ("Thunderbird", "comm", "Email Client.", "MPL", "Microsoft Outlook", "easy", "https://thunderbird.net", 0, True, 37.77, -122.41, ""),
    ("Evolution", "comm", "Mail, Calendar, Tasks.", "GPL", "Microsoft Outlook", "medium", "https://gnome.org/evolution", 0, True, 50.85, 4.35, ""),
    ("Signal", "comm", "Encrypted Messaging.", "AGPL", "WhatsApp, Telegram", "easy", "https://signal.org", 0, True, 37.77, -122.41, ""),
    ("Element (Matrix)", "comm", "Secure Decentralized Chat.", "Apache", "Slack, Microsoft Teams", "medium", "https://element.io", 0, True, 51.50, -0.12, ""),
    ("Mattermost", "comm", "Self-hosted Team Chat.", "AGPL", "Slack", "medium", "https://mattermost.com", 1, True, 43.65, -79.38, ""),
    ("Rocket.Chat", "comm", "Team Communication Platform.", "MIT", "Slack", "medium", "https://rocket.chat", 0, True, 34.05, -118.24, ""),
    ("Jitsi Meet", "comm", "Video Conferencing.", "Apache", "Zoom, Skype, Teams", "easy", "https://jitsi.org", 0, True, 46.81, 8.22, ""),
    ("BigBlueButton", "comm", "Web Conferencing for Education.", "LGPL", "Blackboard Collaborate", "medium", "https://bigbluebutton.org", 0, True, 43.65, -79.38, ""),
    ("Nextcloud", "comm", "File Sync & Share.", "AGPL", "Dropbox, Google Drive, OneDrive", "medium", "https://nextcloud.com", 0, True, 50.85, 4.35, ""),
    ("Syncthing", "comm", "Continuous File Synchronization.", "MPL", "Dropbox, Resilio Sync", "hard", "https://syncthing.net", 1, True, 12.97, 77.59, ""),
    ("FileZilla", "comm", "FTP Client.", "GPL", "SecureFX", "easy", "https://filezilla-project.org", 1, True, 50.85, 4.35, ""),
    ("WinSCP", "comm", "SFTP/SCP Client for Windows.", "GPL", "SecureFX", "easy", "https://winscp.net", 0, True, 50.07, 14.43, ""),

    # --- REMOTE ACCESS & SYSADMIN ---
    ("RustDesk", "remote", "Remote Desktop Software.", "AGPL", "TeamViewer, AnyDesk", "easy", "https://rustdesk.com", 0, True, 1.35, 103.81, ""),
    ("Remmina", "remote", "Remote Desktop Client (Linux).", "GPL", "Remote Desktop Manager", "medium", "https://remmina.org", 0, True, 43.76, 11.25, ""),
    ("PuTTY", "remote", "SSH/Telnet Client.", "MIT", "SecureCRT", "easy", "https://putty.org", 0, False, 51.50, -0.12, ""),
    ("KiTTY", "remote", "Fork of PuTTY with more features.", "MIT", "SecureCRT", "easy", "https://kitty.9bis.net", 0, False, 48.85, 2.35, ""),
    ("Wireshark", "remote", "Network Protocol Analyzer.", "GPL", "SolarWinds NTA", "medium", "https://wireshark.org", 1, True, 48.85, 2.35, ""),
    ("Nmap", "remote", "Network Discovery & Security Scanner.", "GPL", "ManageEngine OpUtils", "hard", "https://nmap.org", 0, True, 37.77, -122.41, ""),
    ("Metasploit", "remote", "Penetration Testing Framework.", "BSD", "Core Impact, Canvas", "hard", "https://metasploit.com", 0, True, 37.77, -122.41, ""),
    ("Burp Suite (Community)", "remote", "Web Vulnerability Scanner.", "Proprietary-Free", "Acunetix", "medium", "https://portswigger.net", 0, True, 51.50, -0.12, "Community edition is free but not OSS."),
    ("OWASP ZAP", "remote", "Web Application Scanner.", "Apache", "Burp Suite Professional", "medium", "https://zaproxy.org", 0, True, 51.50, -0.12, ""),
    ("VeraCrypt", "remote", "Disk Encryption.", "Apache", "BitLocker (Pro), Symantec PGP", "medium", "https://veracrypt.fr", 0, True, 48.85, 2.35, ""),
    ("KeePassXC", "remote", "Password Manager.", "GPL", "LastPass, 1Password", "easy", "https://keepassxc.org", 0, True, 50.85, 4.35, ""),
    ("Bitwarden", "remote", "Cloud Password Manager.", "AGPL", "LastPass, Dashlane", "easy", "https://bitwarden.com", 0, True, 38.90, -77.03, ""),

    # --- BROWSERS & UTILITIES ---
    ("Firefox", "browser", "Privacy-focused Web Browser.", "MPL", "Google Chrome", "easy", "https://firefox.com", 2, True, 37.77, -122.41, ""),
    ("Chromium", "browser", "Open Source base for Chrome.", "BSD", "Google Chrome", "hard", "https://chromium.org", 0, False, 37.77, -122.41, ""),
    ("Brave", "browser", "Privacy Browser with AdBlock.", "MPL", "Chrome", "easy", "https://brave.com", 0, True, 37.77, -122.41, ""),
    ("Tor Browser", "browser", "Anonymity Network Browser.", "BSD", "Standard Browsers", "medium", "https://torproject.org", 0, True, 37.77, -122.41, ""),
    ("7-Zip", "utility", "File Archiver.", "LGPL", "WinRAR, WinZip", "easy", "https://7-zip.org", 2, True, 50.45, 30.52, ""),
    ("PeaZip", "utility", "File Archiver with GUI.", "LGPL", "WinRAR", "easy", "https://peazip.github.io", 0, True, 45.46, 9.18, ""),
    ("VLC Media Player", "utility", "Multimedia Player.", "GPL", "Windows Media Player, QuickTime", "easy", "https://videolan.org", 0, True, 48.85, 2.35, ""),
    ("MPV", "utility", "Minimalist Media Player.", "LGPL", "PotPlayer", "hard", "https://mpv.io", 0, False, 37.77, -122.41, ""),
    ("SumatraPDF", "utility", "Lightweight PDF Reader.", "GPL", "Adobe Acrobat Reader", "easy", "https://sumatrapdfreader.org", 0, True, 52.52, 13.40, ""),
    ("Okular", "utility", "Document Viewer (KDE).", "GPL", "Adobe Acrobat", "medium", "https://okular.kde.org", 0, True, 50.85, 4.35, ""),
    ("Recuva", "utility", "File Recovery.", "Proprietary-Free", "EaseUS Data Recovery", "easy", "https://ccleaner.com/recuva", 0, True, 51.50, -0.12, "Free but not OSS. Alternative: PhotoRec."),
    ("PhotoRec", "utility", "Data Recovery Software.", "GPL", "EaseUS, Recuva", "hard", "https://cgsecurity.org", 0, False, 48.85, 2.35, ""),
    ("BalenaEtcher", "utility", "Flash OS images to USB.", "Apache", "Rufus (Proprietary build)", "easy", "https://balena.io/etcher", 0, True, 51.50, -0.12, ""),
    ("Rufus", "utility", "Bootable USB Creator.", "GPL", "UltraISO", "easy", "https://rufus.ie", 0, True, 37.77, -122.41, ""),
    ("VirtualBox", "utility", "Virtualization Software.", "GPL", "VMware Workstation", "medium", "https://virtualbox.org", 0, True, 37.77, -122.41, ""),
    ("QEMU", "utility", "Generic Machine Emulator.", "GPL", "VMware ESXi", "hard", "https://qemu.org", 0, True, 48.85, 2.35, ""),
    ("LibreCAD", "utility", "2D CAD Application.", "GPL", "AutoCAD", "hard", "https://librecad.org", 0, True, 37.77, -122.41, ""),
    ("FreeCAD", "utility", "Parametric 3D CAD Modeler.", "LGPL", "SolidWorks, CATIA", "hard", "https://freecad.org", 0, True, 50.85, 4.35, ""),

    # --- SPECIALIZED / UNIVERSITY SPECIFIC ---
    ("LaTeX (TeX Live)", "academic", "Document Preparation System.", "LPPL", "Microsoft Word (for thesis)", "hard", "https://tug.org", 0, True, 37.77, -122.41, ""),
    ("Overleaf (Self-Host)", "academic", "Collaborative LaTeX Editor.", "LPPL", "ShareLaTeX (Merged)", "medium", "https://overleaf.com", 0, True, 51.50, -0.12, ""),
    ("Zotero", "academic", "Reference Management.", "AGPL", "EndNote, Mendeley", "easy", "https://zotero.org", 0, True, 38.90, -77.03, ""),
    ("JabRef", "academic", "BibTeX Reference Manager.", "MIT", "EndNote", "medium", "https://jabref.org", 0, True, 50.85, 4.35, ""),
    ("Moodle", "academic", "Learning Management System (LMS).", "GPL", "Blackboard, Canvas", "medium", "https://moodle.org", 0, True, 37.77, -122.41, ""),
    ("OpenEdX", "academic", "Online Course Platform.", "AGPL", "Coursera Infrastructure", "hard", "https://openedx.org", 0, True, 37.77, -122.41, ""),
    # BigBlueButton REMOVED FROM HERE (Duplicate - already in Communication section)
    
    # --- EXCUSE ONLY ENTRIES (No Viable OSS) ---
    # These will trigger the "Excuse" logic in the frontend
    ("NO_ALTERNATIVE_CAD", "design", "Industry Standard 3D CAD.", "Proprietary", "SolidWorks (Complex Assemblies)", "impossible", "", 0, False, 0, 0, "Excuse: Proprietary file formats (.SLDPRT) and complex assembly engines have no direct OSS equivalent yet. FreeCAD is improving but not production-ready for enterprise aerospace/auto."),
    ("NO_ALTERNATIVE_ADOBE_PDF", "office", "Advanced PDF Editing.", "Proprietary", "Adobe Acrobat Pro", "hard", "", 0, False, 0, 0, "Excuse: While viewing is solved (SumatraPDF), advanced form creation, redaction, and pre-press validation remain proprietary to Adobe's closed ecosystem."),
    ("NO_ALTERNATIVE_MATLAB_TOOLBOX", "dev", "Specialized Engineering Toolboxes.", "Proprietary", "MATLAB (Specific Toolboxes)", "hard", "", 0, False, 0, 0, "Excuse: Core math is solved (Octave/Scilab), but specialized toolboxes (e.g., Simulink for specific hardware) lack certified OSS equivalents for safety-critical industries."),
    ("NO_ALTERNATIVE_MS_PROJECT", "office", "Enterprise Project Management.", "Proprietary", "Microsoft Project", "medium", "", 0, False, 0, 0, "Excuse: OpenProject exists, but deep integration with the wider MS Enterprise ecosystem (Teams, SharePoint, AD) creates a lock-in that is difficult to break without operational friction."),
]

def seed_database():
    print("🔄 Starting MASSIVE database seeding...")
    try:
        # 1. Create Tables
        print("🏗️  Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        db_session = sessionmaker(bind=engine)
        db = db_session()
        
        # 2. Clear old data
        print("🧹 Clearing existing data (this may take a moment)...")
        db.query(HistoricalAttack).delete()
        db.query(Command).delete()
        db.query(Alternative).delete()
        db.query(Tool).delete()
        db.commit()
        print("✅ Database cleared.")

        # 3. Process Master Data
        print(f"🌱 Seeding {len(MASTER_DATA)} tools...")
        tools_to_add = []
        
        for item in MASTER_DATA:
            name, cat, desc, lic, prop, diff, link, cve, signed, lat, lng, excuse = item
            
            # Skip placeholder entries used for excuses
            if name.startswith("NO_ALTERNATIVE_"):
                continue

            tools_to_add.append(Tool(
                name=name,
                category=cat,
                description=desc,
                license_type=lic,
                proprietary_alternative=prop,
                migration_difficulty=diff,
                official_link=link,
                cve_count=cve,
                signed_releases=signed,
                lat=lat,
                lng=lng
            ))
            
        db.add_all(tools_to_add)
        db.commit()
        print(f"✅ Added {len(tools_to_add)} Open Source Tools.")

        # 4. Add Commands
        cmds = [
            Command(name="DNS Lookup", command_key="dns_lookup", command_template=["python", "-c", "import socket, sys; print(socket.gethostbyname(sys.argv[1]))", "{domain}"], description="Resolve domain to IP"),
            Command(name="SSL Check", command_key="ssl_check", command_template=["python", "-c", "import ssl, socket, sys; ctx=ssl.create_default_context(); s=socket.create_connection((sys.argv[1], 443), timeout=5); with ctx.wrap_socket(s, server_hostname=sys.argv[1]) as ss: print(f'Protocol: {ss.version()}')", "{domain}"], description="Check SSL Protocol"),
        ]
        db.add_all(cmds)
        db.commit()

        # 5. Historical Attacks
        print("🕰️  Seeding Historical Cyber Attacks...")
        cities = {
            "USA": {"lat": 38.9072, "lng": -77.0369}, "China": {"lat": 39.9042, "lng": 116.4074},
            "Russia": {"lat": 55.7558, "lng": 37.6173}, "India": {"lat": 12.9716, "lng": 77.5946},
            "UK": {"lat": 51.5074, "lng": -0.1278}, "Brazil": {"lat": -23.5505, "lng": -46.6333},
            "Germany": {"lat": 52.5200, "lng": 13.4050}, "Iran": {"lat": 35.6892, "lng": 51.3890}
        }
        historical_events = [
            {"src": "China", "tgt": "USA", "type": "Supply Chain Attack", "sev": "Critical", "days_ago": 45},
            {"src": "Russia", "tgt": "UK", "type": "DDoS", "sev": "High", "days_ago": 12},
            {"src": "Iran", "tgt": "India", "type": "Phishing Campaign", "sev": "Medium", "days_ago": 5},
            {"src": "USA", "tgt": "Brazil", "type": "Ransomware", "sev": "Critical", "days_ago": 30},
            {"src": "China", "tgt": "Germany", "type": "Espionage", "sev": "High", "days_ago": 60},
        ]
        attacks_to_add = []
        for event in historical_events:
            s_coords = cities[event["src"]]
            t_coords = cities[event["tgt"]]
            time_obj = datetime.now() - timedelta(days=event["days_ago"])
            attacks_to_add.append(HistoricalAttack(
                source_country=event["src"], target_country=event["tgt"],
                source_lat=s_coords["lat"], source_lng=s_coords["lng"],
                target_lat=t_coords["lat"], target_lng=t_coords["lng"],
                attack_type=event["type"], severity=event["sev"], timestamp=time_obj
            ))
        db.add_all(attacks_to_add)
        db.commit()
        print(f"✅ Added {len(attacks_to_add)} historical attacks.")
        
        print("\n🎉 SUCCESS! Database seeded with clean tool list.")
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        if 'db' in locals(): db.rollback()
    finally:
        if 'db' in locals(): db.close()

if __name__ == "__main__":
    seed_database()