import fetch from 'node-fetch';

async function testGroqKey() {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer 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`
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
