# Kabaddi Real-Time Scoring System

Real-time Kabaddi scoring with separate Control panel and OBS Overlay graphic.

## Features
- Team A vs Team B scores
- Logos (upload or URL)
- Scores in right corner style graphic
- Real-time updates via WebSockets
- Control from phone/browser
- Overlay link for OBS Browser Source (transparent)

## Setup & Run

1. Node.js installed hona chahiye (https://nodejs.org)

2. Is folder mein terminal open karo aur run karo:

```bash
npm install
npm start
```

3. Server start hone ke baad:

- **Control Panel** (phone se scoring ke liye):  
  `http://YOUR_IP:3000/control`  
  Ya `http://localhost:3000/control`

- **Overlay Graphic** (OBS ke liye):  
  `http://YOUR_IP:3000/overlay`  
  Ya `http://localhost:3000/overlay`

### Phone se Control
- Computer aur phone same WiFi pe hone chahiye
- Computer ka IP pata karo (Windows: `ipconfig`, Mac/Linux: `ifconfig` ya `ip addr`)
- Phone browser mein `http://192.168.x.x:3000/control` open karo

### OBS Setup
1. OBS mein **Browser Source** add karo
2. URL: `http://localhost:3000/overlay` (ya IP)
3. Width: 1920, Height: 1080 (ya aapke canvas ke according)
4. **Shutdown source when not visible** off rakho
5. **Refresh browser when scene becomes active** on
6. Custom CSS (optional): `body { background: transparent !important; }`
7. Background transparent rahega, graphic right side top mein dikhega

## Usage
- Team names daalo
- Logos upload karo ya URL paste karo, phir **Update Teams & Logos**
- +1, +2, +3, -1 buttons se score badhao/ghatao
- Overlay instantly update hoga
- Reset se scores 0 ho jayenge

Enjoy Kabaddi scoring! 🏆
