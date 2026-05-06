import React from 'react';
import type { Language, LanguageCode } from '../types';
import TranslateIcon from './icons/TranslateIcon';

interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  languages: Language[];
  onChange: (languageCode: LanguageCode) => void;
  isDisabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, languages, onChange, isDisabled }) => {
  return (
    <div className="relative flex items-center bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-full shadow-md transition-colors">
      <TranslateIcon className="w-5 h-5 text-gray-500 absolute left-3 pointer-events-none" />
      <select
        value={currentLanguage}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className="pl-10 pr-4 py-2 appearance-none bg-transparent rounded-full text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;