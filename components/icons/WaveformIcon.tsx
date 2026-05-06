
import React from 'react';

const WaveformIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    {/* 5 Vertical Bars simulating a voice wave */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M16.5 6.75v10.5M7.5 6.75v10.5M21 10.5v3M3 10.5v3" />
  </svg>
);

export default WaveformIcon;
