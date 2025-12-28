const express = require('express');
const Gun = require('gun');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
// Static files को सबसे पहले रखें ताकि HTML को JS मिल सके
app.use(express.static(__dirname));

// 🛡️ Explicit Routing
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

const server = app.listen(port, () => {
    console.log(`🚀 Sovereign Relay Live at Port ${port}`);
});

// ⛓️ Gun Mesh: पीयर्स का क्रम सही किया
const gun = Gun({
    web: server,
    peers: [
        'https://peer.wall.org/gun', // सबसे रिलायबल ग्लोबल पीयर पहले रखें
        'https://gun-manhattan.herokuapp.com/gun'
    ],
    radisk: true
});