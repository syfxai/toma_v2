
import React, { useState, useEffect } from 'react';
import { getFeedbackList } from '../services/supabaseService';
import type { FeedbackItem } from '../types';
import StarIcon from './icons/StarIcon';

interface AdminModalProps {
  onClose: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HARDCODED PIN - Tukar ini jika mahu password lain
  const SECRET_PIN = "2024";

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
      const data = await getFeedbackList();
      setFeedbackList(data);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data. Sila pastikan anda telah menetapkan 'Select Policy' di Supabase SQL Editor.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fadeInUp">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null); }}
              placeholder="Enter PIN"
              className="w-full text-center text-2xl tracking-widest px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Feedback Inbox</h2>
            <p className="text-sm text-gray-500">Total: {feedbackList.length} submissions</p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={fetchData}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Refresh
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading data...</div>
          ) : error ? (
             <div className="flex flex-col justify-center items-center h-full text-red-500 text-center px-4">
               <p className="font-bold mb-2">Error</p>
               <p>{error}</p>
             </div>
          ) : feedbackList.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">No feedback yet.</div>
          ) : (
            <div className="grid gap-4">
              {feedbackList.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                      <span className="font-bold text-gray-800 text-lg ml-2">{item.rating}/5</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(item.created_at).toLocaleString('en-MY')}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 text-base mb-4 whitespace-pre-wrap leading-relaxed">
                    "{item.comment}"
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-y-1 gap-x-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-700">From:</span> {item.name}
                    </div>
                    {item.email && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">Email:</span> 
                        <a href={`mailto:${item.email}`} className="text-emerald-600 hover:underline">{item.email}</a>
                      </div>
                    )}
                     <div className="flex items-center gap-1 ml-auto text-xs text-gray-400">
                      ID: {item.user_id?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
