import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import { Theme, GameState } from './types';
import { generateCommentary, generateSpeech } from './services/gemini';
import { playTtsAudio, getAudioContext } from './services/audio';

// Default Theme
const DEFAULT_THEME: Theme = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  bg: '#050505'
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    maxCombo: 0,
    isGameOver: false,
    isPlaying: false
  });
  
  // HUD State (separate to avoid full re-renders of canvas if possible, but passed down)
  const [currentScore, setCurrentScore] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [commentary, setCommentary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startGame = useCallback(() => {
    setGameState({
      score: 0,
      maxCombo: 0,
      isGameOver: false,
      isPlaying: true
    });
    setCurrentScore(0);
    setCurrentCombo(0);
    setCommentary('');
  }, []);

  const handleGameOver = useCallback(async (finalScore: number, finalMaxCombo: number) => {
    setGameState(prev => ({
      ...prev,
      score: finalScore,
      maxCombo: finalMaxCombo,
      isPlaying: false,
      isGameOver: true
    }));

    setIsProcessing(true);
    
    // 1. Generate Text
    const text = await generateCommentary(finalScore, finalMaxCombo);
    setCommentary(text);
    setIsProcessing(false);

    // 2. Generate and Play Audio (Fire and forget)
    // We check if context is valid (user interacted)
    try {
        getAudioContext(); 
        const audioBase64 = await generateSpeech(text);
        if (audioBase64) {
            await playTtsAudio(audioBase64);
        }
    } catch (e) {
        console.error("Audio playback error", e);
    }

  }, []);

  const handleScoreUpdate = useCallback((s: number, c: number) => {
    setCurrentScore(s);
    setCurrentCombo(c);
  }, []);

  return (
    <div 
        className="relative w-full h-screen overflow-hidden transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: theme.bg }}
    >
      <GameCanvas 
        theme={theme}
        gameState={gameState}
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />
      
      <GameUI 
        theme={theme}
        gameState={gameState}
        score={gameState.isGameOver ? gameState.score : currentScore}
        combo={gameState.isGameOver ? gameState.maxCombo : currentCombo}
        commentary={commentary}
        isProcessing={isProcessing}
        onStart={startGame}
        onThemeChange={setTheme}
        onSetProcessing={setIsProcessing}
      />
    </div>
  );
};

export default App;
