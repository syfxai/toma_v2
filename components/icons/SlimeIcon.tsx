import React from 'react';

const SlimeIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div 
      // Using a DIV based construction with Tailwind for maximum stability (no SVG XML parsing errors)
      className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-purple-600 shadow-[inset_0_2px_8px_rgba(255,255,255,0.6)] overflow-hidden select-none ${className}`}
      {...props}
    >
      {/* Top Gloss/Reflection */}
      <div className="absolute top-[-5%] left-[15%] w-[70%] h-[45%] bg-gradient-to-b from-white/80 to-transparent rounded-full blur-[2px] z-10"></div>

      {/* Face Container with subtle float animation */}
      <div className="relative z-20 flex flex-col items-center mt-1 animate-[bounce_3s_infinite]">
        
        {/* Eyes Container */}
        <div className="flex gap-[5px] mb-[2px]">
           {/* Left Eye */}
          <div className="w-[5px] h-[7px] bg-slate-900 rounded-full relative overflow-hidden animate-[pulse_3s_infinite]">
             <div className="absolute top-[1px] right-[1px] w-[2px] h-[2px] bg-white rounded-full"></div>
          </div>
           {/* Right Eye */}
          <div className="w-[5px] h-[7px] bg-slate-900 rounded-full relative overflow-hidden animate-[pulse_3s_infinite]">
             <div className="absolute top-[1px] right-[1px] w-[2px] h-[2px] bg-white rounded-full"></div>
          </div>
        </div>

        {/* Mouth (Cute Smile) */}
        <div className="w-[10px] h-[4px] border-b-[1.5px] border-slate-900/70 rounded-b-full"></div>
      </div>

      {/* Inner Glow (Bottom) */}
      <div className="absolute bottom-[-20%] left-0 w-full h-[50%] bg-purple-400/50 blur-md z-0"></div>
    </div>
  );
};

export default SlimeIcon;