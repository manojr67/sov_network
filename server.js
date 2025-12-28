const express = require('express');
const Gun = require('gun');
const path = require('path');
const app = express();
const port = process.env.PORT || 10000;

app.use(express.static(__dirname)); 

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

const server = app.listen(port, () => {
    console.log(`🚀 Master Relay Online at Port ${port}`);
});

const gun = Gun({
    web: server,
    peers: ['https://gun-manhattan.herokuapp.com/gun'],
    radisk: true
});