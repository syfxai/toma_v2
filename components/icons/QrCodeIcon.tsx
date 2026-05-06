import React from 'react';

const QrCodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5v15h15V4.5h-15zm9 3.75h.008v.008H12.75v-.008zm0 3h.008v.008H12.75v-.008zm0 3h.008v.008H12.75v-.008zm-3-3h.008v.008H9.75v-.008zm0 3h.008v.008H9.75v-.008zm-3-3h.008v.008H6.75v-.008zm0 3h.008v.008H6.75v-.008zM6 6.75h.008v.008H6v-.008zm3.75 0h.008v.008H9.75v-.008zm3.75 0h.008v.008H13.5v-.008zm-3.75 9h.008v.008H9.75v-.008zm3.75 0h.008v.008H13.5v-.008z" />
  </svg>
);

export default QrCodeIcon;
