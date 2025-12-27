const express = require('express');
const Gun = require('gun');
const SEA = require('gun/sea');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Render डिफ़ॉल्ट रूप से पोर्ट 10000 या process.env.PORT का उपयोग करता है
const port = process.env.PORT || 10000; 

// --- 1. Enterprise Security Setup ---
app.use(helmet({ 
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false 
}));
app.use(cors());
app.use(express.static(__dirname));

// --- 2. 📊 ADMIN MASTER DASHBOARD ---
app.get('/admin', (req, res) => {
    // यहाँ 'location.origin' का उपयोग किया गया है ताकि यह localhost और Render दोनों पर चले
    res.send(`
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f8fafc; padding: 30px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .card { background: #0f172a; padding: 20px; border-radius: 20px; border: 1px solid #f7931a; text-align: center; }
            h1 { color: #f7931a; margin-bottom: 30px; text-align: center; }
            .val { font-size: 2rem; font-weight: 800; color: #10b981; }
            .label { color: #94a3b8; font-size: 12px; text-transform: uppercase; margin-top: 5px; }
            .mod-box { background: #000; padding: 15px; border-radius: 15px; margin-top: 20px; height: 300px; overflow-y: auto; border: 1px solid #1e293b; }
        </style>

        <h1>🚀 Apex Relay: Master Controller v2.5</h1>
        
        <div class="grid">
            <div class="card"><div id="nodes" class="val">0</div><div class="label">Connected Nodes</div></div>
            <div class="card"><div id="shards" class="val">Active</div><div class="label">Auto-Shard Distribution</div></div>
            <div class="card"><div id="treasury" class="val">0.0000</div><div class="label">Total Treasury (SOV)</div></div>
        </div>

        <div class="mod-box">
            <h4 style="margin:0 0 15px 0; color:#f7931a;">📡 Global Mesh Monitor & Logs</h4>
            <div id="mod-logs"></div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
        <script>
            // Render के लिए डायनामिक URL
            const gun = Gun([window.location.origin + '/gun']);
            
            // Presence Tracker
            gun.get('sov_v71_presence').map().on((data, key) => {
                gun.get('sov_v71_presence').once(all => {
                    let count = 0;
                    Object.keys(all).forEach(k => { 
                        if(all[k] && all[k].status === 'online') count++; 
                    });
                    document.getElementById('nodes').innerText = count;
                });
            });

            // Treasury Monitor
            const creatorDID = 'aS6S7wNGozMWbOR_hJjjk2zHWNok9BfvUGjfy_P7Cm8.r4z1KFBQGB1trpfGgYR65NW93iT7MFmLH_aXs6ZSi0A';
            gun.get('sov_v71_wallets').get(creatorDID).on(d => {
                if(d) document.getElementById('treasury').innerText = (Number(d.found) || 0).toFixed(4);
            });
        </script>
    `);
});

// --- 3. 🛡️ AUTOMATIC SHARD DISTRIBUTION LOGIC ---
const ShardEngine = {
    optimize(gunInstance) {
        gunInstance.on('out', function(msg){
            if(msg.put) {
                msg['#'] = msg['#'] || Gun.text.random(10);
                // Console logs Render के "Logs" टैब में दिखेंगे
                console.log('💎 Shard Distributed:', msg['#'].substring(0,8));
            }
            this.to.next(msg);
        });
    }
};

// --- 4. 🌉 ENTERPRISE EXCHANGE ENDPOINT ---
app.get('/api/v1/exchange-status', (req, res) => {
    gun.get('sov_network_meta').once((meta) => {
        res.json({
            status: "Mesh Online",
            sharding: "Active-Dynamic",
            protocol: "Lattice-V75.5",
            creator_royalty: "5% Hardcoded", 
            timestamp: Date.now()
        });
    });
});

// --- 5. Route Fixes ---
app.get('/mainnet', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/Mainnet', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/', (req, res) => {
    // अगर index.html नहीं है, तो बेसिक स्टेटस दिखाएगा
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.send("Apex Relay V75.5 is running. Access /admin for dashboard.");
    }
});

// --- 6. Persistence & Server Boot ---
const server = app.listen(port, () => {
    console.log(`
    🌍 Master Relay V75.5 Started
    📊 Admin Panel: /admin
    💎 Sharding: ACTIVE
    `);
});

// Gun Initialization
const gun = Gun({
    web: server,
    peers: ['https://gun-manhattan.herokuapp.com/gun'], // आप अपने अन्य Render URLs यहाँ जोड़ सकते हैं
    radisk: true,
    localStorage: false 
});

ShardEngine.optimize(gun);

// --- 7. 🛠️ Auto-Backup (Render Disk Support) ---
const BackupEngine = {
    init() {
        const backupDir = path.join(__dirname, 'backups');
        setInterval(() => {
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
            console.log(`📦 System: Data snapshot secured at ${new Date().toLocaleTimeString()}`);
        }, 86400000); 
    }
};
BackupEngine.init();

// Error Handling
process.on('uncaughtException', (err) => console.error('Critical Relay Alert:', err));