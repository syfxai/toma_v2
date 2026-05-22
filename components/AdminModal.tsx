import React, { useState, useEffect, useRef } from 'react';
import { getFeedbackList, getSurveyList } from '../services/firebaseService';
import type { FeedbackItem, SurveyItem } from '../types';
import StarIcon from './icons/StarIcon';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AdminModalProps {
  onClose: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'feedback' | 'survey'>('feedback');
  
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [surveyList, setSurveyList] = useState<SurveyItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded card state for raw survey responses
  const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  // PIN from environment variable
  const SECRET_PIN = import.meta.env.VITE_ADMIN_PIN || "2024";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === SECRET_PIN) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError("PIN Salah!");
      setPin('');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fData, sData] = await Promise.all([
        getFeedbackList(),
        getSurveyList()
      ]);
      setFeedbackList(fData);
      setSurveyList(sData);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data. Sila pastikan anda telah menetapkan Rules di Firebase Console.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STATS COMPUTATIONS ---
  const totalSurveys = surveyList.length;

  const getPercentage = (count: number) => {
    if (totalSurveys === 0) return 0;
    return Math.round((count / totalSurveys) * 100);
  };

  // 0. Gender Ratio
  const genderCounts = { 'Lelaki': 0, 'Perempuan': 0 };
  surveyList.forEach(item => {
    if (item.gender in genderCounts) {
      genderCounts[item.gender as keyof typeof genderCounts]++;
    }
  });

  // 0.1. Occupation Breakdown
  const occupationCounts = {
    'Pelajar': 0,
    'Bekerja (Sektor Swasta / Awam)': 0,
    'Bekerja Sendiri / Usahawan': 0,
    'Suri Rumah': 0,
    'Tidak Bekerja / Lain-lain': 0
  };
  surveyList.forEach(item => {
    if (item.occupation in occupationCounts) {
      occupationCounts[item.occupation as keyof typeof occupationCounts]++;
    }
  });

  // 1. Cooking Frequency
  const freqCounts = { 'Setiap hari': 0, '3-4 kali seminggu': 0, 'Jarang-jarang': 0, 'Hanya hujung minggu': 0 };
  surveyList.forEach(item => {
    if (item.cookingFrequency in freqCounts) {
      freqCounts[item.cookingFrequency as keyof typeof freqCounts]++;
    }
  });

  // 2. Cooking Challenge
  const challengeCounts = {
    "Tiada idea (masak apa hari ni)": 0,
    "Bahan dapur terhad": 0,
    "Kekangan masa": 0,
    "Tak pandai padankan bahan": 0,
    "Bimbang status Halal resipi": 0
  };
  surveyList.forEach(item => {
    if (item.cookingChallenge in challengeCounts) {
      challengeCounts[item.cookingChallenge as keyof typeof challengeCounts]++;
    }
  });

  // 3. Food Waste
  const wasteCounts = { "Ya, kerap berlaku": 0, "Kadang-kadang": 0, "Tidak pernah": 0 };
  surveyList.forEach(item => {
    if (item.foodWaste in wasteCounts) {
      wasteCounts[item.foodWaste as keyof typeof wasteCounts]++;
    }
  });

  // 4, 5, 6. Average ratings
  const avgAccuracy = totalSurveys ? (surveyList.reduce((sum, item) => sum + item.recipeAccuracy, 0) / totalSurveys).toFixed(1) : "0.0";
  const avgClarity = totalSurveys ? (surveyList.reduce((sum, item) => sum + item.stepClarity, 0) / totalSurveys).toFixed(1) : "0.0";
  const avgHalal = totalSurveys ? (surveyList.reduce((sum, item) => sum + item.halalImportance, 0) / totalSurveys).toFixed(1) : "0.0";

  // 7. Voice Search Utility
  const voiceCounts = {
    "Sangat membantu (mudah cakap sahaja)": 0,
    "Biasa sahaja": 0,
    "Lebih selesa menaip secara manual": 0
  };
  surveyList.forEach(item => {
    if (item.voiceSearchUtility in voiceCounts) {
      voiceCounts[item.voiceSearchUtility as keyof typeof voiceCounts]++;
    }
  });

  // 8. Time Saved
  const timeCounts = {
    "Ya, menjimatkan masa": 0,
    "Sedikit sebanyak membantu": 0,
    "Tidak memberi kesan": 0
  };
  surveyList.forEach(item => {
    if (item.timeSaved in timeCounts) {
      timeCounts[item.timeSaved as keyof typeof timeCounts]++;
    }
  });

  // 9. PMF Feeling (Sean Ellis score)
  const pmfCounts = { "Sangat kecewa": 0, "Sedikit kecewa": 0, "Tidak kisah": 0 };
  surveyList.forEach(item => {
    if (item.pmfFeeling in pmfCounts) {
      pmfCounts[item.pmfFeeling as keyof typeof pmfCounts]++;
    }
  });
  const pmfScore = getPercentage(pmfCounts["Sangat kecewa"]);

  // 10. Desired Features
  const featureCounts: Record<string, number> = {
    "Anggaran kos/harga bahan": 0,
    "Senarai beli-belah (grocery list)": 0,
    "Menu diet khas (Keto, sihat, dll)": 0,
    "Cadangan resipi chef terkenal": 0
  };
  surveyList.forEach(item => {
    if (Array.isArray(item.desiredFeatures)) {
      item.desiredFeatures.forEach(feat => {
        if (feat in featureCounts) {
          featureCounts[feat]++;
        }
      });
    }
  });

  // Sort features by score
  const sortedFeatures = Object.entries(featureCounts).sort((a, b) => b[1] - a[1]);

  // 11. Willing to Pay
  const payCounts = { "Ya, pasti": 0, "Mungkin ya": 0, "Tidak, mahu percuma": 0 };
  surveyList.forEach(item => {
    if (item.willingToPay in payCounts) {
      payCounts[item.willingToPay as keyof typeof payCounts]++;
    }
  });

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Exact dimensions matching
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Toma_Survey_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal mengeksport laporan PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeInUp">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null); }}
              placeholder="Enter PIN"
              className="w-full text-center text-2xl tracking-widest px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeInUp">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Toma Admin Workspace</h2>
            <p className="text-sm text-gray-500">Urus maklum balas pengguna dan analisis produk</p>
          </div>
          <div className="flex gap-3">
            {activeAdminTab === 'survey' && totalSurveys > 0 && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {isExportingPdf ? "Mengeksport PDF..." : "Export Analisis (PDF)"}
              </button>
            )}
            <button 
              onClick={fetchData}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Refresh
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setActiveAdminTab('feedback')}
            className={`py-3.5 text-sm font-semibold border-b-2 mr-8 transition-colors ${
              activeAdminTab === 'feedback'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Maklum Balas Am ({feedbackList.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('survey')}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-colors ${
              activeAdminTab === 'survey'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Analisis Kajian/Survey ({surveyList.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-gray-500 font-medium">Memuatkan data dari Firebase...</div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-full text-red-500 text-center px-4">
              <p className="font-bold mb-2">Ralat</p>
              <p>{error}</p>
            </div>
          ) : activeAdminTab === 'feedback' ? (
            /* --- GENERAL FEEDBACK INBOX --- */
            feedbackList.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">Tiada maklum balas diterima buat masa ini.</div>
            ) : (
              <div className="grid gap-4 max-w-4xl mx-auto">
                {feedbackList.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              className={`w-4 h-4 ${i < item.rating ? 'text-amber-400' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                        <span className="font-bold text-gray-800 text-base ml-1">{item.rating}/5</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(item.created_at).toLocaleString('en-MY')}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 text-base mb-4 whitespace-pre-wrap leading-relaxed">
                      "{item.comment}"
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 gap-y-1 gap-x-4 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">Daripada:</span> {item.name}
                      </div>
                      {item.email && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-700">Emel:</span> 
                          <a href={`mailto:${item.email}`} className="text-emerald-600 hover:underline">{item.email}</a>
                        </div>
                      )}
                      <div className="flex items-center gap-1 ml-auto text-[10px] text-gray-400 font-mono">
                        User ID: {item.user_id?.substring(0, 8)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* --- SURVEY ANALYTICS TAB --- */
            totalSurveys === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">Tiada responden survey buat masa ini.</div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Executive Scorecard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Responden</span>
                    <span className="text-3xl font-extrabold text-gray-800 mt-2 block">{totalSurveys}</span>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Skor PMF</span>
                    <span className="text-3xl font-extrabold text-gray-800 mt-2 block">{pmfScore}%</span>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                      pmfScore >= 40 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {pmfScore >= 40 ? "PMF Kuat (>40%)" : "Perlu Usaha"}
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Ketepatan AI (Purata)</span>
                    <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">{avgAccuracy}/5.0</span>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sanggup Bayar</span>
                    <span className="text-3xl font-extrabold text-gray-800 mt-2 block">{getPercentage(payCounts["Ya, pasti"] + payCounts["Mungkin ya"])}%</span>
                  </div>
                </div>

                {/* Demografi Responden */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Demografi Responden</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gender */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-600 block">Jantina</span>
                      {Object.entries(genderCounts).map(([label, count]) => (
                        <div key={label} className="text-xs">
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}% ({count})</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Occupation */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-600 block">Kategori Pekerjaan / Status</span>
                      {Object.entries(occupationCounts).map(([label, count]) => (
                        <div key={label} className="text-xs">
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}% ({count})</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Charts / Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fasa 1: Tabiat Memasak */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">1. Tabiat Memasak & Pembaziran</h3>
                    
                    {/* Cooking Freq */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-600 block">Kekerapan Memasak</span>
                      {Object.entries(freqCounts).map(([label, count]) => (
                        <div key={label} className="text-xs">
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}% ({count})</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Food Waste */}
                    <div className="space-y-2 pt-3 border-t border-gray-50">
                      <span className="text-xs font-bold text-gray-600 block">Kadar Membuang Bahan Mentah</span>
                      {Object.entries(wasteCounts).map(([label, count]) => (
                        <div key={label} className="text-xs">
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}% ({count})</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Cabaran Memasak */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">2. Cabaran Terbesar Memasak</h3>
                    <div className="space-y-3">
                      {Object.entries(challengeCounts).map(([label, count]) => (
                        <div key={label} className="text-xs">
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span className="truncate max-w-[200px]" title={label}>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}% ({count})</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fasa 2: Pengalaman Toma */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">3. Maklum Balas Pengalaman AI</h3>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/30">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Ketepatan AI</span>
                        <span className="text-xl font-bold text-emerald-700 block mt-1">{avgAccuracy}/5</span>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/30">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Kekompleksan</span>
                        <span className="text-xl font-bold text-emerald-700 block mt-1">{avgClarity}/5</span>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/30">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Status Halal</span>
                        <span className="text-xl font-bold text-emerald-700 block mt-1">{avgHalal}/5</span>
                      </div>
                    </div>

                    {/* Voice Utility */}
                    <div className="space-y-2 pt-2 text-xs">
                      <span className="font-bold text-gray-600 block">Kebaikan Carian Suara (Voice)</span>
                      {Object.entries(voiceCounts).map(([label, count]) => (
                        <div key={label}>
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fasa 3: Impak & Masa Depan */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">4. Analisis Hala Tuju</h3>

                    {/* Willingness to Pay */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-gray-600 block">Kesediaan Membayar</span>
                      {Object.entries(payCounts).map(([label, count]) => (
                        <div key={label}>
                          <div className="flex justify-between text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-semibold">{getPercentage(count)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${getPercentage(count)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Feature Ranking */}
                    <div className="space-y-2 pt-2 border-t border-gray-50 text-xs">
                      <span className="font-bold text-gray-600 block">Ciri Tambahan Paling Diminta</span>
                      {sortedFeatures.map(([feat, count]) => (
                        <div key={feat} className="flex justify-between items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded border border-gray-100">
                          <span className="truncate pr-2">{feat}</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            {count} Undian ({getPercentage(count)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Raw Survey Responses List */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Senarai Respon Kajian</h3>
                  <div className="space-y-3">
                    {surveyList.map((item) => {
                      const isExpanded = expandedSurveyId === item.id;
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                          <div 
                            onClick={() => setExpandedSurveyId(isExpanded ? null : item.id)}
                            className="p-4 flex justify-between items-center bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div>
                              <span className="font-bold text-gray-800 text-sm">{item.name || "Responden Tanpa Nama"}</span>
                              <span className="text-xs text-gray-400 block mt-0.5">{item.email || "Tiada emel disediakan"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 font-mono">{new Date(item.created_at).toLocaleString('en-MY')}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <p className="text-gray-500 font-medium">1. Jantina: <span className="text-gray-800 font-bold">{item.gender || "Tidak Dinyatakan"}</span></p>
                                <p className="text-gray-500 font-medium">2. Pekerjaan / Status: <span className="text-gray-800 font-bold">{item.occupation || "Tidak Dinyatakan"}</span></p>
                                <p className="text-gray-500 font-medium">3. Kekerapan Memasak: <span className="text-gray-800 font-bold">{item.cookingFrequency}</span></p>
                                <p className="text-gray-500 font-medium">4. Cabaran Terbesar: <span className="text-gray-800 font-bold">{item.cookingChallenge}</span></p>
                                <p className="text-gray-500 font-medium">5. Pembaziran Bahan: <span className="text-gray-800 font-bold">{item.foodWaste}</span></p>
                                <p className="text-gray-500 font-medium">6. Ketepatan Resipi: <span className="text-gray-800 font-bold">{item.recipeAccuracy}/5</span></p>
                                <p className="text-gray-500 font-medium">7. Kekompleksan Resipi: <span className="text-gray-800 font-bold">{item.stepClarity}/5</span></p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-gray-500 font-medium">8. Kepentingan Halal: <span className="text-gray-800 font-bold">{item.halalImportance}/5</span></p>
                                <p className="text-gray-500 font-medium">9. Carian Suara: <span className="text-gray-800 font-bold">{item.voiceSearchUtility}</span></p>
                                <p className="text-gray-500 font-medium">10. Masa Dijimatkan: <span className="text-gray-800 font-bold">{item.timeSaved}</span></p>
                                <p className="text-gray-500 font-medium">11. PMF Sean Ellis: <span className="text-gray-800 font-bold">{item.pmfFeeling}</span></p>
                                <p className="text-gray-500 font-medium">13. Sanggup Membayar: <span className="text-gray-800 font-bold">{item.willingToPay}</span></p>
                              </div>
                              <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <p className="text-gray-500 font-medium mb-1">12. Ciri Yang Diminta:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.desiredFeatures && item.desiredFeatures.length > 0 ? (
                                    item.desiredFeatures.map((feat, idx) => (
                                      <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                                        {feat}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400 italic">Tiada ciri dipilih</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Hidden printable A4 report component container */}
      <div className="absolute -left-[9999px] -top-[9999px]">
        <div 
          ref={reportRef} 
          className="bg-white p-12 text-gray-800 flex flex-col justify-between"
          style={{ width: '794px', height: '1123px', fontFamily: "'Poppins', sans-serif" }}
        >
          {/* Document Header */}
          <div className="border-b-4 border-emerald-600 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-800 tracking-tight">TOMA AI RECIPE GENERATOR</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase font-semibold tracking-wider">Laporan Analisis Kajian Produk & PMF</p>
            </div>
            <div className="text-right text-[10px] text-gray-400 font-mono">
              Tarikh: {new Date().toLocaleDateString('en-MY')}
            </div>
          </div>

          {/* Executive Overview */}
          <div className="grid grid-cols-4 gap-4 my-6 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Responden</span>
              <span className="text-2xl font-extrabold text-emerald-800 block mt-1">{totalSurveys}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Product-Market Fit</span>
              <span className="text-2xl font-extrabold text-emerald-800 block mt-1">{pmfScore}%</span>
              <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">{pmfScore >= 40 ? "PMF Kuat (>40%)" : "Perlu Penambahbaikan"}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Purata Ketepatan AI</span>
              <span className="text-2xl font-extrabold text-emerald-800 block mt-1">{avgAccuracy}/5</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Kesediaan Membayar</span>
              <span className="text-2xl font-extrabold text-emerald-800 block mt-1">
                {getPercentage(payCounts["Ya, pasti"] + payCounts["Mungkin ya"])}%
              </span>
            </div>
          </div>

          {/* Core Analytics Details */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Section 1 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">1. Demografi Responden</h3>
                <div className="grid grid-cols-2 gap-3 text-[9px]">
                  <div>
                    <span className="font-semibold text-gray-500 block mb-0.5">Jantina</span>
                    {Object.entries(genderCounts).map(([label, count]) => (
                      <div key={label} className="mb-1">
                        <div className="flex justify-between mb-0.5">
                          <span>{label}</span>
                          <span className="font-bold">{getPercentage(count)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: `${getPercentage(count)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block mb-0.5">Status/Pekerjaan</span>
                    {Object.entries(occupationCounts).map(([label, count]) => (
                      <div key={label} className="mb-0.5">
                        <div className="flex justify-between text-[7px] mb-0.5">
                          <span className="truncate max-w-[80px]" title={label}>{label}</span>
                          <span className="font-bold">{getPercentage(count)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-0.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: `${getPercentage(count)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">2. Tabiat Memasak & Pembaziran</h3>
                <div className="space-y-2 text-[10px]">
                  {Object.entries(freqCounts).map(([label, count]) => (
                    <div key={label}>
                      <div className="flex justify-between mb-0.5">
                        <span>{label}</span>
                        <span className="font-semibold">{getPercentage(count)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: `${getPercentage(count)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">3. Kadar Pembuangan Makanan</h3>
                <div className="space-y-2 text-[10px]">
                  {Object.entries(wasteCounts).map(([label, count]) => (
                    <div key={label}>
                      <div className="flex justify-between mb-0.5">
                        <span>{label}</span>
                        <span className="font-semibold">{getPercentage(count)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: `${getPercentage(count)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">4. Cabaran Terbesar</h3>
                <div className="space-y-2 text-[10px]">
                  {Object.entries(challengeCounts).map(([label, count]) => (
                    <div key={label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="truncate pr-1">{label}</span>
                        <span className="font-semibold">{getPercentage(count)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: `${getPercentage(count)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">5. Nilai Kepuasan Produk (1-5)</h3>
                <div className="grid grid-cols-3 gap-2 text-center my-1 bg-gray-50 p-2.5 rounded border border-gray-100">
                  <div>
                    <span className="text-[8px] text-gray-400 block font-semibold">Ketepatan Resipi</span>
                    <span className="text-sm font-extrabold text-emerald-800 block">{avgAccuracy}/5</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 block font-semibold">Kekompleksan</span>
                    <span className="text-sm font-extrabold text-emerald-800 block">{avgClarity}/5</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 block font-semibold">Keperluan Halal</span>
                    <span className="text-sm font-extrabold text-emerald-800 block">{avgHalal}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">6. Kesediaan Membayar Bulanan</h3>
                <div className="space-y-2 text-[10px]">
                  {Object.entries(payCounts).map(([label, count]) => (
                    <div key={label}>
                      <div className="flex justify-between mb-0.5">
                        <span>{label}</span>
                        <span className="font-semibold">{getPercentage(count)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: `${getPercentage(count)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">7. Ciri Tambahan Paling Popular</h3>
                <div className="space-y-1.5">
                  {sortedFeatures.map(([feat, count]) => (
                    <div key={feat} className="flex justify-between items-center text-[10px] bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      <span>{feat}</span>
                      <span className="font-bold text-emerald-800">{count} Undian ({getPercentage(count)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3 text-center text-[8px] text-gray-400 mt-6 flex justify-between items-center font-mono">
            <span>Generated dynamically from Firestore Database</span>
            <span>Toma AI © {new Date().getFullYear()} by Syafiq Haron</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
