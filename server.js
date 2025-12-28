const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const geoip = require('geoip-lite'); // 🛡️ देश पहचानने के लिए

const app = express();
const port = process.env.PORT || 10000;

// --- 🚫 SECURITY CONFIG: BLACKLISTED COUNTRIES ---
// उदाहरण के लिए: 'CN' (China), 'RU' (Russia), 'KP' (North Korea)
const BANNED_COUNTRIES = ['CN', 'RU', 'KP']; 

// --- 🛡️ MIDDLEWARE: COUNTRY BLOCKER ---
// 
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(ip);

    if (geo && BANNED_COUNTRIES.includes(geo.country)) {
        console.warn(`🚨 Blocked access attempt from Banned Country: ${geo.country} (IP: ${ip})`);
        return res.status(403).send("<h1>403 Forbidden</h1>Access from your region is restricted by Sovereign Protocol.");
    }
    next();
});

// --- 🛡️ SECURITY LAYER: IP-BASED RATE LIMITER ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    message: "Too many requests from this IP. Sovereign Shield active.",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.static(__dirname));

// 🛡️ Explicit Routing
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

const server = app.listen(port, () => {
    console.log(`🚀 Sovereign Relay Hardened & Online at Port ${port}`);
});

// ⛓️ Gun Mesh Configuration
const gun = Gun({
    web: server,
    peers: [
        'https://peer.wall.org/gun',
        'https://gun-manhattan.herokuapp.com/gun'
    ],
    radisk: true
});