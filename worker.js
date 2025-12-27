// worker.js - Background calculation & Mining engine
importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');

self.onmessage = async function(e) {
    const { task, data } = e.data;
    
    // --- मौजूदा हैवी वेरिफिकेशन टास्क ---
    if (task === 'heavy_verify') {
        const startTime = performance.now();
        const hash = CryptoJS.SHA256(JSON.stringify(data)).toString();
        for(let i = 0; i < 500000; i++) { } // Computation simulation
        self.postMessage({ 
            task: 'verify_done', 
            result: hash, 
            time: performance.now() - startTime,
            shard: data.shard 
        });
    }

    // --- नया माइनिंग टास्क (Scalability 10/10) ---
    if (task === 'mine_block') {
        const { pub, difficulty, lastTS } = data;
        let nonce = 0;
        let hash = "";
        
        while (true) {
            // असली Proof-of-Work हैश गणना
            hash = CryptoJS.SHA256(pub + nonce + lastTS).toString();
            
            if (hash.startsWith(difficulty)) {
                self.postMessage({ 
                    task: 'block_found', 
                    data: { hash, nonce, ts: Date.now() } 
                });
                break;
            }
            nonce++;
            
            // ब्राउज़र क्रैश सुरक्षा: हर 1000 हैश पर प्रोग्रेस भेजें
            if (nonce % 1000 === 0) {
                self.postMessage({ task: 'mining_progress', nonce });
            }
        }
    }
};