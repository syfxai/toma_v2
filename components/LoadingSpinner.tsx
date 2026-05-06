import React, { useState, useEffect } from 'react';

const foodEmojis = ['🍳', '🥕', '🧅', '🌶️', '🍲', '🔥', '✨'];

interface LoadingSpinnerProps {
  messages: string[];
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);

  useEffect(() => {
    let messageInterval: number;
    if (messages.length > 1) {
      messageInterval = window.setInterval(() => {
        setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
      }, 2500);
    }
    
    return () => {
        if (messageInterval) clearInterval(messageInterval);
    }
  }, [messages]);

  useEffect(() => {
    const emojiInterval = window.setInterval(() => {
      setCurrentEmojiIndex(prevIndex => (prevIndex + 1) % foodEmojis.length);
    }, 400);

    return () => clearInterval(emojiInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center my-12 animate-fadeInUp">
      <div className="text-6xl h-20 w-20 flex items-center justify-center relative">
        {foodEmojis.map((emoji, index) => (
          <span
            key={index}
            className={`absolute transition-all duration-300 ease-in-out ${index === currentEmojiIndex ? 'opacity-100 scale-125' : 'opacity-0 scale-100'}`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="mt-4 text-gray-600 font-medium text-center px-4 h-12 flex items-center justify-center">
         <p key={currentMessageIndex} className="animate-fadeInUp text-center">
           {messages[currentMessageIndex]}
         </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
