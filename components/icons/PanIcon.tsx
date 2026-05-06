
import React from 'react';

const PanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
     {/* Handle - Thicker and longer */}
     <path d="M22 11h-4.2c-.4-1.2-1.5-2-2.8-2h-9C3.3 9 1 11.3 1 14s2.3 5 5 5h9c2.8 0 5-2.2 5-5 0-.7-.1-1.4-.4-2H22c.6 0 1-.4 1-1s-.4-1-1-1z" fill="#374151" />
     {/* Inner Pan Surface */}
     <path d="M6 11c-1.7 0-3 1.3-3 3s1.3 3 3 3h9c1.7 0 3-1.3 3-3s-1.3-3-3-3H6z" fill="#1F2937" />
  </svg>
);

export default PanIcon;
