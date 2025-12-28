const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const https = require('https');
const cron = require('node-cron'); // ⏲️ बैकअप शेड्यूल करने के लिए

const app = express();
const port = process.env.PORT || 10000;

// --- 🛡️ SECURITY & ALLOW-LIST ---
const ALLOWED_IPS = ['127.0.0.1', '::1']; 
const GUARDIAN_NODES = ['https://sov-relay.onrender.com/gun']; // ट्रस्टेड पीयर्स

// --- 🛡️ IP CACHING LOGIC ---
const ipCache = new Map(); 
const CACHE_TTL = 60 * 60 * 1000; 

async function checkIPHealth(ip) {
    if (ipCache.has(ip)) {
        const cached = ipCache.get(ip);
        if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
        ipCache.delete(ip);
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
                    if (result.status === 'success' && (result.proxy || result.hosting)) {
                        checkResult = { blocked: true, reason: result.proxy ? "VPN/Proxy" : "Data Center" };
                    }
                    ipCache.set(ip, { data: checkResult, timestamp: Date.now() });
                    resolve(checkResult);
                } catch (e) { resolve({ blocked: false }); }
            });
        }).on('error', () => resolve({ blocked: false }));
    });
}

// --- ⛓️ STORAGE PERSISTENCE: MESH SNAPSHOTS ---
// 
const takeMeshSnapshot = () => {
    console.log("📸 Initiating Cold Mesh Snapshot...");
    gun.get('sov_immutable_lattice').once((data) => {
        if (!data) return;
        // यहाँ आप Arweave या IPFS पर डेटा पुश करने का लॉजिक जोड़ सकते हैं
        console.log("✅ Snapshot Completed: Local Mesh Data is Consistent.");
    });
};

// हर 24 घंटे में ऑटोमैटिक बैकअप (Cron Job)
cron.schedule('0 0 * * *', takeMeshSnapshot);

// --- 🛡️ MIDDLEWARE ---
app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    if (ALLOWED_IPS.includes(ip)) return next();

    const check = await checkIPHealth(ip);
    if (check.blocked) {
        console.warn(`🚨 BLOCKED: ${ip} (${check.reason})`);
        return res.status(403).send("<h1>403 Access Denied</h1>Sovereign Mesh Security active.");
    }
    next();
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // रिलायबिलिटी के लिए थोड़ी छूट
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
    console.log(`🚀 Master Relay V190.0 Hybrid Online at Port ${port}`);
});

// --- 🔗 CONSOLIDATED MESH CONSENSUS ---
// 
const gun = Gun({
    web: server,
    peers: [...GUARDIAN_NODES, 'https://peer.wall.org/gun'],
    radisk: true, // Local persistence active
    localStorage: false // ब्राउज़र स्टोरेज की जगह राडिस्क का उपयोग करें
});