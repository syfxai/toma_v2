import { GoogleGenAI } from '@google/genai';

export interface ApiCallLog {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  status: number;
  durationMs: number;
  error?: string;
}

export interface ServiceHealth {
  name: string;
  provider: 'Groq' | 'Google Gemini';
  model: string;
  status: 'healthy' | 'degraded' | 'down' | 'untested';
  latencyMs?: number;
  lastChecked?: string;
  message?: string;
}

interface ApiMetrics {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgLatencyMs: number;
  endpointStats: Record<string, { calls: number; errors: number; avgLatency: number }>;
}

const callLogs: ApiCallLog[] = [];
const MAX_LOGS = 50;

let metrics: ApiMetrics = {
  totalCalls: 0,
  successCalls: 0,
  failedCalls: 0,
  avgLatencyMs: 0,
  endpointStats: {},
};

export function recordApiCall(
  endpoint: string,
  model: string,
  status: number,
  durationMs: number,
  error?: string
) {
  metrics.totalCalls += 1;
  if (status >= 200 && status < 400) {
    metrics.successCalls += 1;
  } else {
    metrics.failedCalls += 1;
  }

  // Rolling average latency
  metrics.avgLatencyMs = Math.round(
    ((metrics.avgLatencyMs * (metrics.totalCalls - 1)) + durationMs) / metrics.totalCalls
  );

  if (!metrics.endpointStats[endpoint]) {
    metrics.endpointStats[endpoint] = { calls: 0, errors: 0, avgLatency: 0 };
  }
  const ep = metrics.endpointStats[endpoint];
  ep.calls += 1;
  if (status >= 400) ep.errors += 1;
  ep.avgLatency = Math.round(((ep.avgLatency * (ep.calls - 1)) + durationMs) / ep.calls);

  const log: ApiCallLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    endpoint,
    model,
    status,
    durationMs,
    error: error ? error.substring(0, 200) : undefined,
  };

  callLogs.unshift(log);
  if (callLogs.length > MAX_LOGS) {
    callLogs.pop();
  }
}

export function getApiMetrics() {
  return {
    metrics,
    logs: callLogs,
  };
}

export async function checkAllApiHealth(): Promise<ServiceHealth[]> {
  const results: ServiceHealth[] = [];

  // 1. Check Groq Chat
  const groqKey = process.env.GROQ_API_KEY;
  const groqChatModel = process.env.GROQ_CHAT_MODEL || 'qwen/qwen3.8-27b';

  if (!groqKey) {
    results.push({
      name: 'Chef Toma Chat',
      provider: 'Groq',
      model: groqChatModel,
      status: 'down',
      message: 'GROQ_API_KEY tidak dijumpai',
    });
  } else {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqChatModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_completion_tokens: 5,
        }),
      });

      const t1 = Date.now();
      const latency = t1 - t0;
      if (res.ok) {
        results.push({
          name: 'Chef Toma Chat',
          provider: 'Groq',
          model: groqChatModel,
          status: 'healthy',
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          message: 'Berfungsi dengan lancar',
        });
      } else {
        const errData = await res.json().catch(() => null);
        results.push({
          name: 'Chef Toma Chat',
          provider: 'Groq',
          model: groqChatModel,
          status: 'down',
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          message: errData?.error?.message || `HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Chef Toma Chat',
        provider: 'Groq',
        model: groqChatModel,
        status: 'down',
        lastChecked: new Date().toISOString(),
        message: err?.message || 'Gagal menghubungi Groq',
      });
    }
  }

  // 2. Check Groq Whisper (Voice Transcription)
  if (!groqKey) {
    results.push({
      name: 'Transkripsi Suara (Whisper)',
      provider: 'Groq',
      model: 'whisper-large-v3-turbo',
      status: 'down',
      message: 'GROQ_API_KEY tidak dijumpai',
    });
  } else {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models/whisper-large-v3-turbo', {
        headers: { Authorization: `Bearer ${groqKey}` },
      });
      const latency = Date.now() - t0;
      if (res.ok) {
        results.push({
          name: 'Transkripsi Suara (Whisper)',
          provider: 'Groq',
          model: 'whisper-large-v3-turbo',
          status: 'healthy',
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          message: 'Model tersedia & sedia digunakan',
        });
      } else {
        results.push({
          name: 'Transkripsi Suara (Whisper)',
          provider: 'Groq',
          model: 'whisper-large-v3-turbo',
          status: 'degraded',
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          message: `Model status HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Transkripsi Suara (Whisper)',
        provider: 'Groq',
        model: 'whisper-large-v3-turbo',
        status: 'down',
        lastChecked: new Date().toISOString(),
        message: err?.message || 'Gagal menghubungi model audio',
      });
    }
  }

  // 3. Check Gemini Recipe Generator
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (!geminiKey) {
    results.push({
      name: 'Penjana Resepi AI',
      provider: 'Google Gemini',
      model: geminiModel,
      status: 'down',
      message: 'GEMINI_API_KEY tidak dijumpai',
    });
  } else {
    const t0 = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const resp = await ai.models.generateContent({
        model: geminiModel,
        contents: 'ping',
      });
      const latency = Date.now() - t0;
      if (resp.text) {
        results.push({
          name: 'Penjana Resepi AI',
          provider: 'Google Gemini',
          model: geminiModel,
          status: 'healthy',
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          message: 'Berfungsi dengan pantas',
        });
      } else {
        results.push({
          name: 'Penjana Resepi AI',
          provider: 'Google Gemini',
          model: geminiModel,
          status: 'degraded',
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          message: 'Respons kosong diterima',
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Penjana Resepi AI',
        provider: 'Google Gemini',
        model: geminiModel,
        status: 'down',
        lastChecked: new Date().toISOString(),
        message: err?.message || 'Gagal menghubungi Gemini',
      });
    }
  }

  // 4. Check Gemini Translator
  const translateKey = process.env.GEMINI_API_KEY_TRANSLATE || geminiKey;
  if (!translateKey) {
    results.push({
      name: 'Penterjemah Bahasa',
      provider: 'Google Gemini',
      model: geminiModel,
      status: 'down',
      message: 'Kunci API terjemahan tidak dijumpai',
    });
  } else {
    results.push({
      name: 'Penterjemah Bahasa',
      provider: 'Google Gemini',
      model: geminiModel,
      status: results.find((r) => r.name === 'Penjana Resepi AI')?.status === 'healthy' ? 'healthy' : 'degraded',
      latencyMs: results.find((r) => r.name === 'Penjana Resepi AI')?.latencyMs,
      lastChecked: new Date().toISOString(),
      message: 'Berkongsi enjin Gemini 2.5 Flash',
    });
  }

  return results;
}
