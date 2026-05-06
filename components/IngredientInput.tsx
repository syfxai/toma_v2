
import React, { useState, useEffect } from 'react';
import type { UiText, LanguageCode } from '../types';
import VoiceInput from './VoiceInput';

interface IngredientInputProps {
  ingredients: string;
  onIngredientsChange: (value: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  isLoading: boolean;
  loadingType: 'generate' | 'search';
  cooldown: number;
  uiText: UiText;
  currentLanguage: LanguageCode;
}

const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onIngredientsChange,
  onGenerate,
  onReset,
  isLoading,
  loadingType,
  cooldown,
  uiText,
  currentLanguage
}) => {
  const [progress, setProgress] = useState(0);

  const hasIngredients = ingredients && ingredients.trim().length > 0;

  // Simulate progress when loading starts
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const timers: ReturnType<typeof setTimeout>[] = [];
      
      // Fast initial jump
      timers.push(setTimeout(() => setProgress(15), 100));
      // Steady increase
      timers.push(setTimeout(() => setProgress(45), 800));
      timers.push(setTimeout(() => setProgress(70), 1800));
      timers.push(setTimeout(() => setProgress(90), 2800));
      // Hang at 95 until done
      timers.push(setTimeout(() => setProgress(95), 4500));

      return () => timers.forEach(clearTimeout);
    } else {
      // Reset or complete
      setProgress(0);
    }
  }, [isLoading]);

  const handleVoiceResult = (text: string) => {
    const trimmed = text.trim();
    if (!ingredients.trim()) {
      onIngredientsChange(trimmed);
    } else {
      // Append nicely with comma
      const separator = ingredients.trim().endsWith(',') ? ' ' : ', ';
      onIngredientsChange(`${ingredients.trim()}${separator}${trimmed}`);
    }
  };

  const isButtonDisabled = isLoading || !hasIngredients || cooldown > 0;

  return (
    <div className="w-full">
      <label htmlFor="ingredients" className="block text-base md:text-lg font-semibold text-gray-800 mb-2">
        {uiText.inputLabel}
      </label>
      
      <div className="relative">
        <textarea
          id="ingredients"
          value={ingredients}
          onChange={(e) => onIngredientsChange(e.target.value)}
          placeholder={uiText.inputPlaceholder}
          // Adjusted height h-32 (128px) for mobile, md:h-36
          className="w-full h-32 md:h-36 p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow duration-200 resize-none text-gray-800 bg-white text-base"
          disabled={isLoading}
        />
        
        {/* Standard Mic for Dictation */}
        <div className="absolute bottom-3 right-3 z-10">
           <VoiceInput 
              onResult={handleVoiceResult}
              languageCode={currentLanguage}
              disabled={isLoading}
           />
        </div>
      </div>

      <div className="mt-4 md:mt-5 w-full flex items-center gap-3">
        <button
          onClick={onReset}
          disabled={isLoading || !ingredients}
          // h-14 for mobile touch targets, h-16 for desktop
          className="w-auto px-4 md:px-6 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed h-14 md:h-16 text-sm md:text-base"
        >
          {uiText.resetButton}
        </button>
        
        {/* PROGRESSION BUTTON */}
        <button
          onClick={onGenerate}
          disabled={isButtonDisabled}
          className={`
            group relative flex-grow h-14 md:h-16 rounded-xl font-bold text-sm md:text-lg overflow-hidden transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
            ${isButtonDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60 border border-gray-200' : 'cursor-pointer shadow-lg hover:shadow-emerald-500/30 border border-emerald-500/20'}
            bg-white/80
          `}
        >
          {/* Ready State Background */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-opacity duration-300 ${!isButtonDisabled ? 'opacity-100' : 'opacity-0'}`}
          ></div>
          
          {/* Loading Progress Track */}
          <div 
            className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
          ></div>

          {/* Loading Progress Bar */}
          <div 
             className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-700 ease-out"
             style={{ 
               width: isLoading ? `${progress}%` : '0%', 
               opacity: isLoading ? 1 : 0 
             }}
          ></div>

          {/* Text Layer */}
          <span className={`relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${isButtonDisabled ? 'text-gray-400' : 'text-white'}`}>
             {isLoading ? (
               <>
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 {loadingType === 'search' ? uiText.searchButtonLoading : uiText.generateButtonLoading}
               </>
             ) : cooldown > 0 ? (
                <>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {uiText.cooldownMessage.replace('{time}', cooldown.toString())}
                </>
             ) : (
                <>
                  <span className="text-lg md:text-xl">✨</span>
                  {loadingType === 'search' ? uiText.searchButton : uiText.generateButton}
                </>
             )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default IngredientInput;
