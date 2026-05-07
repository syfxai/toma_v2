import fs from 'fs';
import fetch from 'node-fetch';

async function testGroq() {
    const audioBlob = fs.readFileSync('test_chat.js'); // Just any file to test if it hits the endpoint properly
    const base64 = audioBlob.toString('base64');
    
    try {
        const response = await fetch('http://localhost:3000/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64 })
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testGroq();
