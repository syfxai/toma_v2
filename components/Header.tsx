
import React, { useState, useEffect } from 'react';

interface HeaderProps {
    title: string;
    subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    
    // Mix 'o' into the cycle naturally rather than strictly alternating
    const displayItems = ['🍅', '🍳', 'o', '🥗', '🥘', 'o', '🍱', '🍲', 'o'];

    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Start exit animation (Fade out, blur, shrink)
            setIsVisible(false);

            // 2. Wait for exit animation to finish (300ms), then swap content and enter
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % displayItems.length);
                setIsVisible(true);
            }, 300); // Matches the CSS transition duration
            
        }, 3000); // Cycle duration
        
        return () => clearInterval(interval);
    }, [displayItems.length]);

    const currentItem = displayItems[currentIndex];
    const isText = currentItem === 'o';

    return (
        <header className="text-center relative z-10 px-2">
            {title === 'Toma' ? (
                 <div className="flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-bold pb-2 select-none leading-tight">
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">T</span>
                    
                    {/* 
                        Fixed width container to prevent layout shift.
                    */}
                    <span className="inline-flex justify-center items-center w-[1.3em] h-[1.1em] overflow-visible">
                        <span 
                            className={`
                                inline-block transition-all duration-500 ease-in-out transform
                                ${isVisible 
                                    ? 'opacity-100 scale-100 blur-0 translate-y-0' 
                                    : 'opacity-0 scale-50 blur-sm translate-y-2'
                                }
                                ${isText ? 'bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent pb-2' : ''}
                            `}
                        >
                            {currentItem}
                        </span>
                    </span>

                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">ma</span>
                </div>
            ) : (
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent pb-2">
                    {title}
                </h1>
            )}
            <p className="mt-2 text-base md:text-xl text-gray-600 font-medium px-4">
                {subtitle}
            </p>
        </header>
    );
};

export default Header;
