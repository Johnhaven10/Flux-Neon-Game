import React, { useState } from 'react';
import { Theme, GameState } from '../types';
import { generateTheme } from '../services/gemini';
import { getAudioContext } from '../services/audio';

interface GameUIProps {
  theme: Theme;
  gameState: GameState;
  score: number;
  combo: number;
  commentary: string;
  isProcessing: boolean;
  onStart: () => void;
  onThemeChange: (newTheme: Theme) => void;
  onSetProcessing: (state: boolean) => void;
}

const GameUI: React.FC<GameUIProps> = ({ 
  theme, gameState, score, combo, commentary, isProcessing, onStart, onThemeChange, onSetProcessing 
}) => {
  const [themeInput, setThemeInput] = useState('');

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    getAudioContext(); // Initialize audio context on user interaction
    onStart();
  };

  const handleThemeSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!themeInput.trim()) return;

    onSetProcessing(true);
    const newTheme = await generateTheme(themeInput);
    if (newTheme) {
        onThemeChange(newTheme);
    }
    onSetProcessing(false);
  };

  // Dynamic Button Style based on current theme
  const buttonStyle = {
    background: `linear-gradient(45deg, ${theme.cyan}, ${theme.magenta})`,
    clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)',
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center text-center font-['Orbitron'] z-10 p-4">
      
      {/* Title / Main Menu */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <div className="pointer-events-auto animate-fadeIn">
          <h1 className="text-6xl md:text-8xl text-white mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">NEON FLUX</h1>
          <p className="text-gray-400 text-lg tracking-widest animate-pulse mb-8 cursor-pointer hover:text-white transition-colors" onClick={handleStart}>
            CLICK TO START
          </p>
          <div className="text-xs text-gray-600 mb-12">MOUSE to Move • CLICK/SPACE to Shift Color</div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div className="pointer-events-auto bg-black/80 p-8 rounded-xl border border-gray-800 backdrop-blur-sm animate-fadeIn">
          <h1 className="text-5xl text-red-500 mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">GAME OVER</h1>
          <div className="text-2xl text-white mb-2">SCORE: {score}</div>
          <div className="text-sm mb-6" style={{ color: theme.cyan }}>MAX COMBO: {combo}</div>
          
          <div className="h-16 flex items-center justify-center mb-6 max-w-md mx-auto">
             {isProcessing ? (
                 <span className="text-cyan-400 animate-pulse">CORE ANALYZING...</span>
             ) : (
                 <p className="text-cyan-400 italic text-sm">"{commentary}"</p>
             )}
          </div>

          <button 
            onClick={handleStart}
            style={buttonStyle}
            className="px-8 py-3 text-black font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
          >
            RETRY
          </button>
        </div>
      )}

      {/* HUD (In Game) */}
      {gameState.isPlaying && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
           <div className="text-left">
              <div className="text-2xl text-white drop-shadow-md">SCORE: {score}</div>
              {combo > 1 && (
                  <div 
                    className={`text-xl font-bold transition-all duration-100 ${combo > 10 ? 'text-yellow-300 scale-110' : 'text-cyan-300'}`}
                  >
                      COMBO x{combo}
                  </div>
              )}
           </div>
        </div>
      )}

      {/* Theme Controls (Menu Only) */}
      {!gameState.isPlaying && (
        <div className="pointer-events-auto absolute bottom-10 flex flex-col md:flex-row gap-3 items-center bg-black/50 p-4 rounded-lg backdrop-blur-sm border border-gray-800/50">
            <input 
                type="text" 
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="Enter a theme (e.g. 'Volcano')"
                className="bg-white/10 border border-gray-700 text-white px-4 py-2 rounded focus:border-cyan-400 outline-none text-center w-64 placeholder-gray-500 transition-colors"
            />
            <button 
                onClick={handleThemeSubmit}
                disabled={isProcessing}
                style={isProcessing ? { ...buttonStyle, filter: 'grayscale(1)' } : buttonStyle}
                className="px-6 py-2 text-black font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed min-w-[140px]"
            >
                {isProcessing ? 'GENERATING...' : 'FLUX SHIFT ✨'}
            </button>
        </div>
      )}
      
    </div>
  );
};

export default GameUI;
