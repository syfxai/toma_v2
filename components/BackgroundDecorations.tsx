
import React from 'react';

const BackgroundDecorations: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gray-50">
      {/* 
         BASE LAYER: 
         We use a stronger gradient to create depth so it's not just white.
      */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-white to-teal-100/50"></div>

      {/* Noise Texture is applied in index.html with class .bg-noise */}
      <div className="bg-noise mix-blend-overlay fixed inset-0 z-0"></div>
      
      {/* 
         MESH GRADIENT BLOBS: 
         Using significantly stronger colors (500/600 scale) and higher opacity (0.5 - 0.7)
         so they are clearly visible moving behind the glass cards.
      */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-5]">
        {/* Top Left - Vibrant Purple */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/60 rounded-full mix-blend-multiply filter blur-[90px] animate-blob"></div>
        
        {/* Top Right - Vibrant Orange/Amber */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400/60 rounded-full mix-blend-multiply filter blur-[90px] animate-blob animation-delay-2000"></div>
        
        {/* Bottom Left - Strong Emerald */}
        <div className="absolute bottom-[-20%] left-[10%] w-[700px] h-[700px] bg-emerald-500/60 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        
         {/* Bottom Right - Deep Cyan/Blue */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/60 rounded-full mix-blend-multiply filter blur-[90px] animate-blob"></div>

        {/* Center Accent - Bright Pinkish Red (To add contrast) */}
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-pink-400/50 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
};

export default BackgroundDecorations;