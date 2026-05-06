import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import pako from 'pako';
import type { Recipe, UiText, LanguageCode, ShortenedRecipe } from '../types';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';

interface ShareModalProps {
  originalRecipe: Recipe | null;
  language: LanguageCode;
  uiText: UiText;
  onClose: () => void;
}

const shortenRecipe = (recipe: Recipe): ShortenedRecipe => ({
  n: recipe.recipeName,
  d: recipe.description,
  pt: recipe.prepTime,
  ct: recipe.cookTime,
  tt: recipe.totalTime,
  s: recipe.servings,
  i: recipe.ingredients,
  x: recipe.instructions,
});

const ShareModal: React.FC<ShareModalProps> = ({ originalRecipe, language, uiText, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateShareUrl = () => {
      if (!originalRecipe) return;

      try {
        const dataToEncode = {
          r: shortenRecipe(originalRecipe),
          l: language,
        };
        const jsonString = JSON.stringify(dataToEncode);
        const compressed = pako.deflate(jsonString);
        const encoded = btoa(String.fromCharCode.apply(null, Array.from(compressed)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_'); // URL-safe base64

        const url = `${window.location.origin}${window.location.pathname}#recipe=${encoded}`;
        setShareUrl(url);
      } catch (error) {
        console.error("Error generating share URL:", error);
      }
    };
    generateShareUrl();
  }, [originalRecipe, language]);

  useEffect(() => {
    if (shareUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'low',
        color: {
          dark: '#047857', // emerald-700
          light: '#F0FFF4' // emerald-50
        }
      }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [shareUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center relative border border-gray-200">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-2xl font-bold text-emerald-700">{uiText.shareTitle}</h3>
        <p className="mt-2 text-sm text-gray-500">{uiText.shareInstructions}</p>
        
        <div className="my-6 p-4 bg-emerald-50 rounded-lg inline-block border border-emerald-200">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="w-full text-xs bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
            <button
                onClick={handleCopy}
                className="flex-shrink-0 bg-emerald-600 text-white font-bold p-2.5 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 w-32"
            >
              {copied ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckIcon className="w-5 h-5" /> {uiText.linkCopiedButton}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CopyIcon className="w-5 h-5" /> {uiText.copyLinkButton}
                </span>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;