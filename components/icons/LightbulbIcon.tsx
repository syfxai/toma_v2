import React from 'react';

const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-1.835l2.33-3.039a2.25 2.25 0 0 0 .205-1.118V5.75a2.25 2.25 0 0 0-2.25-2.25h-3.75a2.25 2.25 0 0 0-2.25 2.25v.172c0 .426.07.843.205 1.238l2.33 3.038a6.01 6.01 0 0 0 1.5 1.835M12 21a.75.75 0 0 1-.75-.75v-2.25a.75.75 0 0 1 1.5 0v2.25a.75.75 0 0 1-.75.75Z" />
  </svg>
);

export default LightbulbIcon;
