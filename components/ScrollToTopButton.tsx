
import React, { useState, useEffect } from 'react';
import ArrowUpIcon from './icons/ArrowUpIcon';

interface ScrollToTopButtonProps {
  isChatOpen?: boolean;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isChatOpen }) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      // Position logic:
      // Mobile (<768px): bottom-24 (Raised high to avoid chat button area)
      // Desktop (>=768px): bottom-6 (Lowered, as chat button moves to right-24)
      // If Chat is OPEN: opacity-0 and pointer-events-none (Hides completely)
      className={`fixed right-6 bottom-24 md:bottom-6 bg-emerald-600 text-white rounded-full p-3 shadow-lg hover:bg-emerald-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:scale-110 active:scale-100 transition-[opacity,transform] duration-500 ease-in-out ${
        isVisible && !isChatOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
      aria-label="Go to top"
      style={{ zIndex: 30 }}
    >
      <ArrowUpIcon className="h-6 w-6" />
    </button>
  );
};

export default ScrollToTopButton;
