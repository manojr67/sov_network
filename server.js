const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const https = require('https');
const cron = require('node-cron');

const app = express();
const port = process.env.PORT || 10000;

// --- 🛡️ SECURITY CONFIG ---
const ALLOWED_IPS = ['127.0.0.1', '::1']; 
const MASTER_BYPASS_KEY = "MJRAWAT_FORTRESS_KEY_99"; // आपकी गुप्त चाबी
const GUARDIAN_NODES = ['https://sov-relay.onrender.com/gun'];

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

// --- ⛓️ STORAGE PERSISTENCE ---
const takeMeshSnapshot = () => {
    console.log("📸 Initiating Cold Mesh Snapshot...");
    gun.get('sov_immutable_lattice').once((data) => {
        if (!data) return;
        console.log("✅ Snapshot Completed: Local Mesh Data is Consistent.");
    });
};
cron.schedule('0 0 * * *', takeMeshSnapshot);

// --- 🛡️ MERGED MIDDLEWARE: BYPASS + IP FILTER ---
app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const clientSecret = req.headers['x-sov-master-key'];

    // 1. सबसे पहले 'Bypass Key' या 'Allow-List' चेक करें
    if (clientSecret === MASTER_BYPASS_KEY || ALLOWED_IPS.includes(ip)) {
        return next(); 
    }

    // 2. अगर आप 'Bypass' नहीं कर रहे, तो VPN/Proxy चेक करें
    const check = await checkIPHealth(ip);
    if (check.blocked) {
        console.warn(`🚨 ACCESS DENIED: ${ip} (${check.reason})`);
        return res.status(403).send("<h1>403 Sovereign Violation</h1>Access denied by Mesh Security.");
    }
    next();
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
    console.log(`🚀 Master Relay V190.5 Merged Online at Port ${port}`);
});

// --- 🔗 CONSOLIDATED MESH ---
const gun = Gun({
    web: server,
    peers: [...GUARDIAN_NODES, 'https://peer.wall.org/gun'],
    radisk: true,
    localStorage: false 
});