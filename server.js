const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // 🛡️ नई लाइब्रेरी

const app = express();
const port = process.env.PORT || 10000;

// --- 🛡️ SECURITY LAYER: IP-BASED RATE LIMITER ---
// 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 मिनट का समय
    max: 100, // हर IP को 15 मिनट में अधिकतम 100 रिक्वेस्ट की अनुमति
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true, // `RateLimit-*` हेडर्स वापस भेजें
    legacyHeaders: false, // `X-RateLimit-*` हेडर्स बंद करें
});

// इसे सभी रूट्स पर लागू करें
app.use(limiter);
app.use(cors());

// Static files (HTML, CSS, JS) को सर्व करें
app.use(express.static(__dirname));

// 🛡️ Explicit Routing
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

const server = app.listen(port, () => {
    console.log(`🚀 Sovereign Relay Live at Port ${port}`);
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