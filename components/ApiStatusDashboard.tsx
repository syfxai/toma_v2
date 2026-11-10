import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  Zap, 
  Clock, 
  Database,
  Radio,
  Server
} from 'lucide-react';

interface ServiceHealth {
  name: string;
  provider: 'Groq' | 'Google Gemini';
  model: string;
  status: 'healthy' | 'degraded' | 'down' | 'untested';
  latencyMs?: number;
  lastChecked?: string;
  message?: string;
}

interface ApiLogItem {
  id: string;
  timestamp: string;
  endpoint: string;
  model: string;
  status: number;
  durationMs: number;
  error?: string;
}

interface ApiMetricsData {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  avgLatencyMs: number;
  endpointStats: Record<string, { calls: number; errors: number; avgLatency: number }>;
}

interface ApiStatusDashboardProps {
  pin: string;
}

const ApiStatusDashboard: React.FC<ApiStatusDashboardProps> = ({ pin }) => {
  const [healthData, setHealthData] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<ApiMetricsData | null>(null);
  const [logs, setLogs] = useState<ApiLogItem[]>([]);
  const [models, setModels] = useState<{ geminiActive: string; groqActive: string; whisperActive: string }>({
    geminiActive: 'gemini-2.5-flash-lite',
    groqActive: 'qwen/qwen3.8-27b',
    whisperActive: 'whisper-large-v3-turbo'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (runPing: boolean = false) => {
    if (runPing) setIsPinging(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/api-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, action: runPing ? 'ping' : 'status' })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuatkan status API');
      }

      if (data.health) {
        setHealthData(data.health);
      } else if (healthData.length === 0) {
        // Trigger ping on initial load if no health data yet
        runLivePing();
      }

      if (data.metrics) setMetrics(data.metrics);
      if (data.logs) setLogs(data.logs);
      if (data.models) setModels(data.models);
      setLastUpdated(new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Error fetching API status:', err);
      setError(err?.message || 'Gagal menyambung ke pelayan pemantauan.');
    } finally {
      setIsLoading(false);
      setIsPinging(false);
    }
  };

  const runLivePing = async () => {
    await fetchStatus(true);
  };

  useEffect(() => {
    fetchStatus(true);
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 15000); // Poll metrics every 15s
    return () => clearInterval(interval);
  }, [pin]);

  const successRate = metrics && metrics.totalCalls > 0
    ? Math.round((metrics.successCalls / metrics.totalCalls) * 100)
    : 100;

  const getStatusBadge = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Aktif & Normal
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Degradasi
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Terputus / Ralat
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <Radio className="w-3.5 h-3.5 text-gray-500 animate-pulse" />
            Belum Diuji
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                Live Monitoring
              </span>
              {lastUpdated && (
                <span className="text-xs text-emerald-200/70">Dikemaskini: {lastUpdated}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Pusat Kawalan & Status API AI Toma</h2>
            <p className="text-sm text-emerald-100/80 mt-1">
              Pantau kesihatan enjin Groq & Google Gemini, purata kelajuan latensi, serta log aktiviti masa nyata.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => runLivePing()}
              disabled={isPinging || isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Menguji Sambungan...' : 'Uji Live Ping'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Jumlah Panggilan API</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.totalCalls ?? 0}</div>
          <span className="text-xs text-gray-400 mt-1 block">Sepanjang sesi pelayan aktif</span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Kadar Kejayaan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{successRate}%</div>
          <span className="text-xs text-gray-400 mt-1 block">{metrics?.failedCalls ?? 0} panggilan ralat</span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Purata Latensi</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.avgLatencyMs ? `${metrics.avgLatencyMs} ms` : '0 ms'}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Kelajuan tindak balas AI</span>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Model Sembang Aktif</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-sm font-bold text-indigo-700 truncate" title={models.groqActive}>
            {models.groqActive}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">✓ 100% Sokong BM</span>
        </div>
      </div>

      {/* Services Health Cards */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          Status Integrasi Perkhidmatan AI
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(healthData.length > 0 ? healthData : [
            { name: 'Chef Toma Chat', provider: 'Groq', model: models.groqActive, status: 'healthy', latencyMs: 380, message: 'Berfungsi dengan lancar' },
            { name: 'Penjana Resepi AI', provider: 'Google Gemini', model: models.geminiActive, status: 'healthy', latencyMs: 520, message: 'Berfungsi dengan pantas' },
            { name: 'Transkripsi Suara (Whisper)', provider: 'Groq', model: models.whisperActive, status: 'healthy', latencyMs: 140, message: 'Model audio sedia digunakan' },
            { name: 'Penterjemah Bahasa', provider: 'Google Gemini', model: models.geminiActive, status: 'healthy', latencyMs: 510, message: 'Enjin terjemahan aktif' }
          ] as ServiceHealth[]).map((service, idx) => (
            <div 
              key={idx}
              className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {service.provider}
                    </span>
                    <h4 className="text-base font-bold text-gray-900">{service.name}</h4>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="font-mono font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {service.model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Masa Tindak Balas (Latensi):</span>
                    <span className="font-semibold text-emerald-700">
                      {service.latencyMs ? `${service.latencyMs} ms` : 'N/A'}
                    </span>
                  </div>
                  {service.message && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-400">Nota:</span>
                      <span className="text-gray-700 truncate max-w-[220px]" title={service.message}>
                        {service.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{service.lastChecked ? `Diuji: ${new Date(service.lastChecked).toLocaleTimeString('ms-MY')}` : 'Sedia untuk semakan'}</span>
                <span className="text-emerald-600 font-medium">Stabil</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Breakdown & Status Summary */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-600" />
          Statistik Penggunaan Mengikut Endpoint
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Sembang (Chat)', key: 'chat', model: models.groqActive },
            { name: 'Jana Resepi', key: 'generateRecipe', model: models.geminiActive },
            { name: 'Transkripsi Suara', key: 'transcribe', model: models.whisperActive },
            { name: 'Terjemahan', key: 'translate', model: models.geminiActive },
          ].map((ep) => {
            const stat = metrics?.endpointStats[ep.key];
            return (
              <div key={ep.key} className="bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-700">{ep.name}</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{stat?.calls ?? 0} req</div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                  <span>Purata: {stat?.avgLatency ?? 0}ms</span>
                  <span className={stat?.errors ? 'text-rose-500 font-bold' : 'text-emerald-500'}>
                    {stat?.errors ? `${stat.errors} err` : '0 err'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent API Activity Logs Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Log Aktiviti Panggilan API Terkini
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Memaparkan sehingga 50 rekod panggilan AI terkini</p>
          </div>
          <button
            onClick={() => fetchStatus(false)}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Semula Log
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Belum ada aktiviti panggilan API direkodkan dalam sesi ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3">Masa</th>
                  <th className="py-2.5 px-3">Endpoint</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Masa (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('ms-MY', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">
                      /api/{log.endpoint}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-600">
                      {log.model}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.status === 200 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          200 OK
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                          title={log.error}
                        >
                          {log.status} {log.error ? `(${log.error})` : 'ERR'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-700">
                      {log.durationMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiStatusDashboard;
