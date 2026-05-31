/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Landscape, { landscapeState } from './components/Landscape';
import Moominpappa from './components/Moominpappa';
import React, { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

export default function App() {
  const [text, setText] = useState("In a quiet sea of lonely words,\nI drift along the empty space,\nNo destination, no harbor near,\nJust solitary waves to trace.\n\nEach letter falling from the mind,\nBecomes a ripple in the deep,\nA stream of ink that starts to wind,\nWhere silent constellations sleep.\n\nThe boat is light, the water cold,\nAcross the night we sail alone,\nA hundred stories left untold,\nBy winds of paper and of stone.\n\n");
  const [isPanelVisible, setIsPanelVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024; // Default open on large screens, closed on mobile/tablet to showcase the art first
    }
    return true;
  });

  useEffect(() => {
    // Slight delay to ensure canvas is ready before sending initial text
    const timeout = setTimeout(() => {
      landscapeState.addText(text);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsPanelVisible(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (newVal.length > text.length && newVal.startsWith(text)) {
      landscapeState.addText(newVal.slice(text.length));
    } else if (newVal.length > text.length) {
      landscapeState.addText(newVal);
    }
    setText(newVal);
  };

  return (
    <main className="w-full h-screen bg-[#080808] relative overflow-hidden select-none flex">
      {/* Subtle organic noise overlay across the entire application interface */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-screen z-50"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
      
      {/* Journey Title - Highly optimized sizes and paddings for small mobile displays */}
      <div className="absolute top-6 sm:top-10 left-6 sm:left-12 z-40 pointer-events-none flex flex-col">
        {/* Beautiful, atmospheric soft background shield so title is ALWAYS readable even with passing cloud text */}
        <div className="absolute -inset-x-12 -inset-y-10 bg-gradient-to-r from-[#080808]/95 via-[#080808]/80 to-transparent blur-2xl pointer-events-none -z-10" />
        <h1 className="text-[#f6f6f2] font-serif italic text-4xl sm:text-5xl md:text-7xl font-light tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] opacity-95">
          The Lonely
        </h1>
        <h2 className="text-[#ffad33] font-mono text-xs sm:text-sm md:text-xl tracking-[0.3em] uppercase font-semibold pl-1 sm:pl-2 md:pl-3 mt-1" style={{ textShadow: "0 0 16px rgba(255, 130, 0, 0.7), 0 2px 4px rgba(0,0,0,0.9)" }}>
          TEXT JOURNEY
        </h2>
      </div>

      {/* Footer / Concept By */}
      <div className="absolute bottom-6 left-6 sm:left-10 z-30 pointer-events-none">
        <p className="text-[#f6f6f2]/50 font-sans tracking-widest text-[9px] sm:text-xs uppercase">Concept by Shahnab</p>
      </div>

      {/* Floating Toggle Button — bottom-center on mobile for thumb reach, top-right on desktop */}
      {!isPanelVisible && (
        <button
          onClick={() => setIsPanelVisible(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:absolute lg:bottom-auto lg:left-auto lg:translate-x-0 lg:top-10 lg:right-12 z-40 flex items-center gap-2.5 bg-[#080808]/90 hover:bg-[#0c0c0c] border border-[#f6f6f2]/10 backdrop-blur-md px-5 py-3 lg:px-4 lg:py-2.5 rounded-full text-[#f6f6f2]/80 hover:text-[#ffad33] transition-all duration-300 pointer-events-auto cursor-pointer shadow-lg active:scale-95 min-h-[44px]"
          style={{ boxShadow: "0 4px 24px rgba(0, 0, 0, 0.6)", paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
          aria-label="Open composing panel"
        >
          <Keyboard className="w-4 h-4 text-[#ffad33]" style={{ filter: "drop-shadow(0 0 6px rgba(255, 173, 51, 0.5))" }} />
          <span className="font-mono text-xs tracking-wider uppercase font-medium">Write</span>
        </button>
      )}

      {/* Backdrop — tapping outside closes the panel on all screen sizes */}
      {isPanelVisible && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-[3px] z-30 transition-opacity duration-300 lg:hidden cursor-pointer pointer-events-auto"
          onClick={() => setIsPanelVisible(false)}
        />
      )}

      {/* Generative Stippled Canvas Environment */}
      <div className="flex-1 relative h-full">
        <Landscape />
        <Moominpappa />
      </div>

      {/* Composing panel — bottom sheet on mobile, sidebar on desktop */}
      <div 
        className={`fixed lg:relative
          bottom-0 left-0 right-0 lg:bottom-auto lg:left-auto lg:right-0 lg:top-0
          h-[62vh] lg:h-full
          w-full lg:w-[360px]
          rounded-t-2xl lg:rounded-none
          bg-[#080808] flex flex-col z-40 text-[#f6f6f2]
          shadow-[0_-8px_40px_rgba(0,0,0,0.9)] lg:shadow-[-15px_0_35px_rgba(0,0,0,0.9)]
          border-t border-[#f6f6f2]/8 lg:border-t-0 lg:border-l lg:border-[#f6f6f2]/5
          transition-transform duration-300 ease-out flex-shrink-0
          ${isPanelVisible ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full lg:hidden'}`}
      >
        {/* Drag handle indicator — mobile only */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-[#f6f6f2]/20 rounded-full" />
        </div>

        {/* Panel inner content */}
        <div className="flex flex-col gap-4 lg:gap-6 flex-1 min-h-0 px-6 sm:px-8 pt-2 lg:pt-0 pb-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between pt-3 pb-2 lg:mt-8">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-[#ffad33]" style={{ filter: "drop-shadow(0 0 8px rgba(255, 173, 51, 0.5))" }} />
              <h2 className="font-mono text-xs sm:text-sm tracking-widest text-[#f6f6f2]/80 uppercase">Composing Panel</h2>
            </div>
            
            <button 
              onClick={() => setIsPanelVisible(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#f6f6f2]/40 hover:text-[#ffad33] font-mono text-[11px] tracking-wider uppercase border border-[#f6f6f2]/10 hover:border-[#ffad33]/20 px-3 py-2 rounded-lg transition-colors duration-200 pointer-events-auto cursor-pointer"
              aria-label="Close composing panel"
            >
              Close
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <textarea
              value={text}
              onChange={handleChange}
              autoFocus={false}
              className="flex-1 bg-transparent border-0 outline-none resize-none font-mono text-[16px] leading-relaxed text-[#ffad33] placeholder-[#f6f6f2]/20 custom-scrollbar pointer-events-auto"
              style={{ textShadow: "0 0 12px rgba(255, 173, 51, 0.4)" }}
              placeholder="Compose the ocean..."
              spellCheck="false"
            />
            <div className="text-[10px] font-mono text-[#f6f6f2]/20 text-right select-none flex-shrink-0">
              {text.length} characters in universe
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
