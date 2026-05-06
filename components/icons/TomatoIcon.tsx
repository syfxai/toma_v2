
import React from 'react';

const TomatoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
    {/* Tomato Body - Nice round distinct shape */}
    <path 
      d="M12 21.5C16.9706 21.5 21 17.4706 21 12.5C21 8.5 18 5 12 5C6 5 3 8.5 3 12.5C3 17.4706 7.02944 21.5 12 21.5Z" 
      fill="#EF4444" 
    />
    
    {/* Shadow/Highlight for depth (Subtle) */}
    <path 
      d="M15 8C17 9 18 11 18 13" 
      stroke="white" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      opacity="0.3" 
    />

    {/* Leaves (Calyx) - Green Star Shape */}
    <path 
      d="M12 5L13.5 7L16 6L14.5 8.5L17 10L14 10.5L12 13L10 10.5L7 10L9.5 8.5L8 6L10.5 7L12 5Z" 
      fill="#22C55E" 
      stroke="#15803D" 
      strokeWidth="0.5" 
      strokeLinejoin="round"
    />
  </svg>
);

export default TomatoIcon;
