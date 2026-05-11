
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

const getAudioFileName = (mimeType = '') => {
  if (mimeType.includes('mp4')) return 'audio.mp4';
  if (mimeType.includes('mpeg')) return 'audio.mp3';
  if (mimeType.includes('wav')) return 'audio.wav';
  if (mimeType.includes('ogg')) return 'audio.ogg';
  if (mimeType.includes('webm')) return 'audio.webm';
  return 'audio.webm';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioBase64, mimeType } = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
    }

    // Convert base64 back to buffer/blob using native Web APIs
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    if (audioBuffer.length < 1024) {
      return res.status(400).json({ error: 'Audio is too short to transcribe' });
    }

    const audioMimeType = mimeType || 'audio/webm';
    const audioBlob = new Blob([audioBuffer], { type: audioMimeType });

    const formData = new FormData();
    formData.append('file', audioBlob, getAudioFileName(audioMimeType));
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'ms');
    formData.append('response_format', 'json');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API error:", errText);
      return res.status(groqResponse.status).json({ error: errText || "Failed to transcribe audio" });
    }

    const data = await groqResponse.json();
    if (!data.text) {
      return res.status(422).json({ error: 'No speech detected' });
    }
    
    res.status(200).json({ text: data.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: error?.message || "Voice transcription failed." });
  }
}
