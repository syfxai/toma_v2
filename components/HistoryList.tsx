
import React, { useState } from 'react';
import type { Recipe, UiText } from '../types';
import ClockIcon from './icons/ClockIcon';
import XMarkIcon from './icons/XMarkIcon';

interface HistoryListProps {
  history: Recipe[];
  uiText: UiText;
  onSelect: (recipe: Recipe) => void;
  onClear: () => void;
  onDelete: (recipeName: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, uiText, onSelect, onClear, onDelete, isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-emerald-50/50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {uiText.historyTitle}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-gray-500 hover:text-emerald-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p>No history yet.</p>
            </div>
          ) : (
            history.map((item, index) => (
              <div 
                key={`${item.recipeName}-${index}`}
                className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex justify-between items-start gap-2"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <p className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-2 text-sm">{item.recipeName}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <ClockIcon className="w-3 h-3 text-emerald-500" />
                    <span>{item.totalTime}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.recipeName);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
            <button 
              onClick={onClear} 
              className="w-full py-2.5 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {uiText.clearHistory}
            </button>
            <p className="text-xs text-center text-gray-400">
              {uiText.historyStorageNote}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default HistoryList;
