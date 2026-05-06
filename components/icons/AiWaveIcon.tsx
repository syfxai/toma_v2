
import React from 'react';

const AiWaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {/* Chef Hat - Represents the Culinary Expert */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25a4.5 4.5 0 0 0-4.32 3.16l-.28.84H6a3 3 0 0 0-3 3v2.25a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V12.25a3 3 0 0 0-3-3h-1.4l-.28-.84A4.5 4.5 0 0 0 12 5.25Z" />
    
    {/* Sparkle (AI) - Top Right */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l.75 1.5 1.5.75-1.5.75-.75 1.5-.75-1.5-1.5-.75 1.5-.75.75-1.5Z" fill="currentColor" stroke="none" />
    
    {/* Voice Wave - Subtle curves on the right, implying listening/speaking */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12c.5.5.5 1.5 0 2" opacity="0.6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 11c1 1 1 3 0 4" opacity="0.4" />
  </svg>
);

export default AiWaveIcon;
