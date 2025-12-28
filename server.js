const express = require('express');
const Gun = require('gun');
const path = require('path');
const app = express();
const port = process.env.PORT || 10000;

app.use(express.static(__dirname)); 

aapp.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/citadel', (req, res) => res.sendFile(path.join(__dirname, 'citadel.html')));
app.get('/explorer', (req, res) => res.sendFile(path.join(__dirname, 'explorer.html')));

app.get('/:page', (req, res) => {
    const page = req.params.page.toLowerCase();
    const filePath = path.join(__dirname, `${page}.html`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("Page Not Found in Mesh");
    }
});

const gun = Gun({
    web: server,
    peers: ['https://gun-manhattan.herokuapp.com/gun', 'https://sov-relay.onrender.com/gun'],
    radisk: true
});