const express = require('express');
const Gun = require('gun');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// 🛡️ Middleware Configuration
app.use(cors());
// Content Security Policy को व्यवस्थित किया ताकि मेश कनेक्शन न टूटे
app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false 
}));

// 📁 Static File Serving (Root directory)
app.use(express.static(__dirname));

// 🛡️ Explicit Robust Routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Citadel Route: .html के साथ और बिना .html के दोनों काम करेंगे
app.get('/citadel', (req, res) => {
    const filePath = path.join(__dirname, 'citadel.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("Citadel Shard Not Found in Local Mesh");
    }
});

app.get('/explorer', (req, res) => {
    res.sendFile(path.join(__dirname, 'explorer.html'));
});

// 🚀 Server Startup
const server = app.listen(port, () => {
    console.log(`🚀 Sovereign Master Relay Online at Port ${port}`);
});

// ⛓️ Gun Mesh Engine (Updated Peers)
// 
const gun = Gun({
    web: server,
    // Manhattan के साथ-साथ एक और रिलायबल पीयर जोड़ा
    peers: [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://peer.wall.org/gun'
    ],
    radisk: true, // डेटा को परमानेंट स्टोर करने के लिए
    localStorage: false // सर्वर साइड पर LocalStorage की जगह Radisk इस्तेमाल करें
});

// Error Handling for WebSocket
server.on('error', (err) => {
    console.error("Relay Connection Error:", err);
});