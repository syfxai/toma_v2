import fetch from 'node-fetch';
import 'dotenv/config';

async function testGroqKey() {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error("GROQ_API_KEY is not set in .env");
            return;
        }
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        const data = await response.json();
        console.log("Status:", response.status);
        if (data.data) {
             console.log("Key is VALID. Models:", data.data.length);
        } else {
             console.log("Error:", data);
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}
testGroqKey();
