
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, Info, Sparkles, Zap, Activity, Droplets } from 'lucide-react';
import type { NutritionFacts, UiText } from '../types';

interface NutritionDisplayProps {
  nutrition?: NutritionFacts;
  uiText: UiText;
}

const NutritionDisplay: React.FC<NutritionDisplayProps> = ({ nutrition, uiText }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!nutrition) return null;

  const macroColors = [
    { label: uiText.caloriesLabel, value: nutrition.calories, color: 'from-orange-50 to-orange-100/50', textColor: 'text-orange-700', icon: <Zap className="w-4 h-4" /> },
    { label: uiText.proteinLabel, value: nutrition.protein, color: 'from-red-50 to-red-100/50', textColor: 'text-red-700', icon: <Activity className="w-4 h-4" /> },
    { label: uiText.fatLabel, value: nutrition.fat, color: 'from-yellow-50 to-yellow-100/50', textColor: 'text-yellow-700', icon: <Droplets className="w-4 h-4" /> },
    { label: uiText.carbsLabel, value: nutrition.carbohydrates, color: 'from-blue-50 to-blue-100/50', textColor: 'text-blue-700', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="mt-8 border-t border-gray-200/60 pt-6">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:bg-emerald-100/50 transition-all group shadow-sm"
      >
        <span className="text-lg font-bold text-emerald-900 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          {uiText.nutritionTitle}
        </span>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="p-1.5 rounded-full bg-white/80 text-emerald-600 shadow-sm"
        >
           <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-1 mt-4">
              <div className="p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg ring-1 ring-black/5">
                
                {/* Health Tip */}
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`mb-8 p-4 rounded-xl flex items-start gap-4 ${
                    nutrition.healthScore === 'healthy' 
                      ? 'bg-emerald-50/80 text-emerald-900 border border-emerald-200' 
                      : 'bg-amber-50/80 text-amber-900 border border-amber-200'
                  } shadow-sm`}
                >
                  <div className={`p-2 rounded-lg ${
                    nutrition.healthScore === 'healthy' ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
                  }`}>
                    {nutrition.healthScore === 'healthy' ? <Sparkles className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <p className="font-semibold text-sm md:text-base leading-snug pt-1">
                      {nutrition.healthScore === 'healthy' ? uiText.healthyTip : uiText.unhealthyTip}
                  </p>
                </motion.div>

                {/* Macros Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {macroColors.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + (idx * 0.05) }}
                      whileHover={{ y: -4 }}
                      className={`p-4 rounded-xl border border-white bg-gradient-to-br ${item.color} shadow-sm text-center flex flex-col items-center justify-center gap-1 group`}
                    >
                      <div className={`mb-1 p-1.5 rounded-md bg-white/50 ${item.textColor} group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <span className="block text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">{item.label}</span>
                      <span className={`text-lg md:text-xl font-black ${item.textColor} tracking-tight`}>{item.value}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Micronutrients */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm px-2">
                  {[
                    { label: uiText.vitaminsLabel, items: nutrition.vitamins, color: 'bg-purple-100 text-purple-700' },
                    { label: uiText.mineralsLabel, items: nutrition.minerals, color: 'bg-blue-100 text-blue-700' },
                    { label: uiText.othersLabel, items: nutrition.others, color: 'bg-pink-100 text-pink-700' }
                  ].map((section, sIdx) => section.items.length > 0 && (
                    <motion.div 
                      key={sIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + (sIdx * 0.1) }}
                    >
                      <h4 className="font-extrabold text-emerald-900 mb-4 flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg ${section.color} flex items-center justify-center text-[10px]`}>
                          {sIdx === 0 ? 'V' : sIdx === 1 ? 'M' : 'Z'}
                        </div>
                        {section.label}
                      </h4>
                      <ul className="space-y-3">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-700 group cursor-default">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 group-hover:bg-emerald-500 group-hover:scale-150 transition-all"></div>
                            <span className="font-medium group-hover:text-emerald-900 transition-colors">
                              {item.includes('(') ? (
                                <>
                                  {item.split('(')[0]}
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ml-1 inline-block">
                                    {item.split('(')[1].replace(')', '')}
                                  </span>
                                </>
                              ) : item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                {/* Disclaimer */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] md:text-xs text-gray-400 italic text-center"
                >
                  <Info className="w-3 h-3" />
                  {uiText.nutritionDisclaimer}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NutritionDisplay;
