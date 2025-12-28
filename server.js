const express = require('express');
const Gun = require('gun');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(__dirname));

// 🛡️ Explicit Routing to prevent 404
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

const server = app.listen(port, () => {
    console.log(`🚀 Master Relay Online at Port ${port}`);
});

// Gun Mesh Engine
const gun = Gun({
    web: server,
    peers: ['https://gun-manhattan.herokuapp.com/gun'],
    radisk: true
});