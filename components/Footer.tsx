
import React, { useState, useEffect } from 'react';
import MailIcon from './icons/MailIcon';
import type { UiText } from '../types';

interface FooterProps {
  uiText: Pick<UiText, 'feedbackButton'>;
  onOpenFeedback: () => void;
  onOpenAdmin: () => void;
}

const Footer: React.FC<FooterProps> = ({ uiText, onOpenFeedback, onOpenAdmin }) => {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    let timer: number;
    if (clickCount > 0) {
      // Reset count if not clicked again within 1 second
      timer = window.setTimeout(() => setClickCount(0), 1000);
    }
    
    if (clickCount >= 5) {
      onOpenAdmin();
      setClickCount(0);
    }

    return () => clearTimeout(timer);
  }, [clickCount, onOpenAdmin]);

  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <footer className="w-full py-6 text-center">
      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <p 
          onClick={handleSecretClick}
          className="text-sm text-gray-500 select-none cursor-default active:text-emerald-500 transition-colors"
          title="© Toma AI"
        >
          Toma AI recipe generator by Syafiq Haron
        </p>
        <button
          onClick={onOpenFeedback}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-full shadow-sm text-xs font-medium text-gray-600 hover:bg-white hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all cursor-pointer"
        >
          <MailIcon className="w-4 h-4" />
          <span>{uiText.feedbackButton}</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
