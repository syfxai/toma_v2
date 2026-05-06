import React, { useState, useEffect } from 'react';
import LightbulbIcon from './icons/LightbulbIcon';

interface UsageTipsProps {
  isVisible: boolean;
  tips: string[];
}

const UsageTips: React.FC<UsageTipsProps> = ({ isVisible, tips }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isVisible || !tips || tips.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % tips.length);
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(interval);
  }, [tips, isVisible]);

  if (!isVisible || !tips || tips.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 text-center h-10 flex items-center justify-center">
      <div key={currentIndex} className="animate-fadeInUp flex items-center justify-center gap-2 text-sm text-gray-600">
        <LightbulbIcon className="w-5 h-5 text-amber-400" />
        <p>{tips[currentIndex]}</p>
      </div>
    </div>
  );
};

export default UsageTips;
