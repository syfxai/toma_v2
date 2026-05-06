
import React, { useState } from 'react';
import type { NutritionFacts, UiText } from '../types';

interface NutritionDisplayProps {
  nutrition?: NutritionFacts;
  uiText: UiText;
}

const NutritionDisplay: React.FC<NutritionDisplayProps> = ({ nutrition, uiText }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!nutrition) return null;

  return (
    <div className="mt-8 border-t border-gray-200/60 pt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 hover:bg-emerald-100/50 transition-all group"
      >
        <span className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          {uiText.nutritionTitle}
        </span>
        <div className={`p-1 rounded-full bg-emerald-200/50 group-hover:bg-emerald-200 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
           </svg>
        </div>
      </button>

      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 bg-white/40 backdrop-blur-sm rounded-xl border border-emerald-100/30 shadow-inner">
          
          {/* Health Tip */}
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${nutrition.healthScore === 'healthy' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
            <span className="text-2xl">{nutrition.healthScore === 'healthy' ? '✨' : '💡'}</span>
            <p className="font-medium text-sm md:text-base">
                {nutrition.healthScore === 'healthy' ? uiText.healthyTip : uiText.unhealthyTip}
            </p>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: uiText.caloriesLabel, value: nutrition.calories, color: 'bg-orange-50 text-orange-700 border-orange-100' },
              { label: uiText.proteinLabel, value: nutrition.protein, color: 'bg-red-50 text-red-700 border-red-100' },
              { label: uiText.fatLabel, value: nutrition.fat, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
              { label: uiText.carbsLabel, value: nutrition.carbohydrates, color: 'bg-blue-50 text-blue-700 border-blue-100' },
            ].map((item, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${item.color} text-center`}>
                <span className="block text-[10px] uppercase font-bold tracking-wider opacity-70 mb-1">{item.label}</span>
                <span className="text-base md:text-lg font-bold">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Micronutrients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {nutrition.vitamins.length > 0 && (
              <div>
                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {uiText.vitaminsLabel}
                </h4>
                <ul className="space-y-1 text-gray-600">
                  {nutrition.vitamins.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            )}
            {nutrition.minerals.length > 0 && (
              <div>
                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {uiText.mineralsLabel}
                </h4>
                <ul className="space-y-1 text-gray-600">
                  {nutrition.minerals.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
            {nutrition.others.length > 0 && (
              <div>
                <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {uiText.othersLabel}
                </h4>
                <ul className="space-y-1 text-gray-600">
                  {nutrition.others.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] md:text-xs text-gray-400 italic text-center">
            {uiText.nutritionDisclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionDisplay;
