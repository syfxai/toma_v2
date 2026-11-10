import { checkAllApiHealth, getApiMetrics } from '../lib/apiTracker';

export default async function handler(req: any, res: any) {
  // Allow GET or POST
  const pin = req.headers['x-admin-pin'] || req.body?.pin || req.query?.pin;
  const expectedPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN || '2024';

  if (!pin || String(pin).trim() !== String(expectedPin).trim()) {
    return res.status(401).json({ error: 'PIN Pentadbir tidak sah.' });
  }

  try {
    const action = req.body?.action || req.query?.action;
    const shouldRunPing = action === 'ping';

    let health = null;
    if (shouldRunPing) {
      health = await checkAllApiHealth();
    }

    const { metrics, logs } = getApiMetrics();

    return res.status(200).json({
      health,
      metrics,
      logs,
      models: {
        geminiActive: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
        groqActive: process.env.GROQ_CHAT_MODEL || 'qwen/qwen3.8-27b',
        whisperActive: 'whisper-large-v3-turbo'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('API Status error:', err);
    return res.status(500).json({ error: 'Gagal mengambil status API.', details: err.message });
  }
}
