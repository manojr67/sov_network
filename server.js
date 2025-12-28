const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const https = require('https');

const app = express();
const port = process.env.PORT || 10000;

// --- 🛡️ सुधार 2: ALLOW-LIST (अपनी IP यहाँ डालें) ---
const ALLOWED_IPS = ['127.0.0.1', '::1']; // अपनी फिक्स्ड IP यहाँ जोड़ सकते हैं

// --- 🛡️ सुधार 1: LOCAL IP CACHE (स्पीड बढ़ाने के लिए) ---
const ipCache = new Map(); 
const CACHE_TTL = 60 * 60 * 1000; // 1 घंटा (Milliseconds में)

async function checkIPHealth(ip) {
    // 1. सबसे पहले Cache चेक करें
    if (ipCache.has(ip)) {
        const cached = ipCache.get(ip);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        } else {
            ipCache.delete(ip); // पुराना डेटा हटाएँ
        }
    }

    return new Promise((resolve) => {
        const url = `https://demo.ip-api.com/json/${ip}?fields=1703936`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    let checkResult = { blocked: false };

                    if (result.status === 'success') {
                        if (result.proxy === true || result.hosting === true) {
                            checkResult = { 
                                blocked: true, 
                                reason: result.proxy ? "VPN/Proxy" : "Data Center" 
                            };
                        }
                    }
                    
                    // 2. रिजल्ट को Cache में सेव करें
                    ipCache.set(ip, { data: checkResult, timestamp: Date.now() });
                    resolve(checkResult);
                } catch (e) { resolve({ blocked: false }); }
            });
        }).on('error', () => resolve({ blocked: false }));
    });
}

// --- 🛡️ MIDDLEWARE: ADVANCED ACCESS CONTROL ---
app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // 🛡️ Allow-List चेक: अगर IP अलाउड है तो तुरंत आगे बढ़ें
    if (ALLOWED_IPS.includes(ip)) return next();

    const check = await checkIPHealth(ip);
    if (check.blocked) {
        console.warn(`🚨 ACCESS DENIED: ${ip} identified as ${check.reason}`);
        return res.status(403).send(`<h1>Security Violation</h1>Access denied. Sovereign Mesh forbids ${check.reason} connections.`);
    }
    next();
});

// --- 🛡️ RATE LIMITER ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Sovereign Shield: Rate limit exceeded."
});

app.use(limiter);
app.use(cors());
app.use(express.static(__dirname));

// --- 🛣️ ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

const server = app.listen(port, () => {
    console.log(`🚀 Master Relay V189.0 Hardened Online at Port ${port}`);
});

// ⛓️ Gun Mesh
const gun = Gun({
    web: server,
    peers: ['https://peer.wall.org/gun', 'https://gun-manhattan.herokuapp.com/gun'],
    radisk: true
});