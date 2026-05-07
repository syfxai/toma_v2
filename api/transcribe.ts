import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioBase64 } = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    const apiKey = process.env.GROQ_API_KEY || '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';
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
    }

    // Convert base64 back to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'ms'); // Default bias towards Malay to help with manglish

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Note: fetch will automatically set the correct Content-Type with boundary for FormData
      },
      body: formData as any,
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API error:", errText);
      throw new Error("Failed to transcribe audio");
    }

    const data = await groqResponse.json();
    
    res.status(200).json({ text: data.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Voice transcription failed." });
  }
}
