import React from 'react';
import type { UiText } from '../types';

interface GenerationCounterProps {
  count: number;
  uiText: Pick<UiText, 'generationCounterText' | 'generationCounterTextSingle'>;
}

const GenerationCounter: React.FC<GenerationCounterProps> = ({ count, uiText }) => {
  const counterText = count === 1 ? uiText.generationCounterTextSingle : uiText.generationCounterText;
  
  // Format with commas
  const formattedCount = new Intl.NumberFormat().format(count);

  return (
    <div className="w-full py-6 text-center animate-fadeInUp">
      <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
        <span className="text-lg" role="img" aria-label="Tomato">🍅</span>
        <p>
          <span className="font-bold text-gray-800">{formattedCount}</span> {counterText}
        </p>
      </div>
    </div>
  );
};

export default GenerationCounter;