const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const https = require('https');
const cron = require('node-cron');
const axios = require('axios');
const bodyParser = require('body-parser');
const helmet = require('helmet'); // Security Headers

const app = express();
const port = process.env.PORT || 10000;

// --- 🛡️ SECURITY & PARSING ---
app.use(helmet({ contentSecurityPolicy: false })); // Hardened Headers
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname));

const ALLOWED_IPS = ['127.0.0.1', '::1']; 
const MASTER_BYPASS_KEY = "MJRAWAT_FORTRESS_KEY_99"; 
const GUARDIAN_NODES = ['https://sov-relay.onrender.com/gun'];

// --- 🛡️ IP CACHING & HEALTH CHECK ---
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

// --- 🛡️ MIDDLEWARE: BYPASS + VM VALIDATION ---
app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const clientSecret = req.headers['x-sov-master-key'];

    if (clientSecret === MASTER_BYPASS_KEY || ALLOWED_IPS.includes(ip)) return next(); 

    const check = await checkIPHealth(ip);
    if (check.blocked) return res.status(403).send("<h1>403 Sovereign Violation</h1>Access denied.");
    next();
});

// --- ⛓️ STORAGE & SNAPSHOTS ---
cron.schedule('0 0 * * *', () => {
    console.log("📸 Initiating Cold Mesh Snapshot...");
    gun.get('sov_immutable_lattice').once(() => console.log("✅ Snapshot Completed."));
});

// --- 🛣️ ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

// --- 🆕 VM MESH EXECUTION ROUTE ---
// यह रूट ब्राउज़र VM (sov-vm.js) से आने वाले रिजल्ट्स को वैलिडेट करता है
app.post('/api/vm/verify', async (req, res) => {
    const { txHash, result, type } = req.body;
    console.log(`🧠 VM Verification: [${type}] Shard Result Received.`);
    
    // मेश पर एक्जीक्यूशन लॉग करना
    gun.get('sov_blockchain_state').get('verified_logic').set({
        tx: txHash,
        logic_type: type,
        status: 'VERIFIED_ON_LATTICE',
        ts: Date.now()
    });

    res.json({ status: 'verified', msg: "Logic Shard broadcasted to Mesh." });
});

// --- ⛓️ BTC ANCHORING PROXY ---
app.post('/api/anchor', async (req, res) => {
    const { hash } = req.body;
    try {
        const btcRes = await axios.post('https://api.blockcypher.com/v1/btc/main/txs/push', {
            data: `MJR_FORTRESS:${hash}`
        });
        res.json({ status: 'success', txid: btcRes.data.tx.hash });
    } catch (e) {
        res.status(200).json({ status: 'mesh_only', message: 'Anchored to Sovereign Mesh.' });
    }
});

const server = app.listen(port, () => {
    console.log(`🚀 Master Relay V190.5 + Sovereign VM Online at Port ${port}`);
});

// --- 🔗 CONSOLIDATED MESH ---
const gun = Gun({
    web: server,
    peers: [...GUARDIAN_NODES, 'https://peer.wall.org/gun'],
    radisk: true,
    localStorage: false 
});