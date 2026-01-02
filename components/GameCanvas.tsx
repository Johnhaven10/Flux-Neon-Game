import React, { useEffect, useRef, useCallback } from 'react';
import { Theme, GameState, PlayerEntity, OrbEntity, ParticleEntity } from '../types';
import { playSound } from '../services/audio';

interface GameCanvasProps {
  theme: Theme;
  gameState: GameState;
  onGameOver: (score: number, maxCombo: number) => void;
  onScoreUpdate: (score: number, combo: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ theme, gameState, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game Logic State (Refs for performance)
  const playerRef = useRef<PlayerEntity>({
    x: 0,
    y: 0,
    width: 100,
    height: 15,
    type: 'cyan',
    color: theme.cyan,
    targetX: 0
  });
  
  const orbsRef = useRef<OrbEntity[]>([]);
  const particlesRef = useRef<ParticleEntity[]>([]);
  const framesRef = useRef<number>(0);
  const difficultyRef = useRef<number>(1);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const mouseXRef = useRef<number>(0);

  // Initialize/Reset
  useEffect(() => {
    if (gameState.isPlaying) {
      // Reset game internals
      framesRef.current = 0;
      difficultyRef.current = 1;
      scoreRef.current = 0;
      comboRef.current = 0;
      maxComboRef.current = 0;
      orbsRef.current = [];
      particlesRef.current = [];
      
      const canvas = canvasRef.current;
      if (canvas) {
        playerRef.current = {
            ...playerRef.current,
            x: canvas.width / 2 - 50,
            y: canvas.height - 50,
            color: theme.cyan,
            type: 'cyan'
        };
      }
      onScoreUpdate(0, 0);
    }
  }, [gameState.isPlaying, onScoreUpdate]); // Only reset when game starts

  // Update theme colors live if in menu (player preview)
  useEffect(() => {
    if (!gameState.isPlaying) {
        playerRef.current.color = playerRef.current.type === 'cyan' ? theme.cyan : theme.magenta;
    }
  }, [theme, gameState.isPlaying]);

  const spawnOrb = (canvasWidth: number) => {
    const type = Math.random() > 0.5 ? 'cyan' : 'magenta';
    orbsRef.current.push({
      x: Math.random() * (canvasWidth - 40) + 20,
      y: -20,
      type: type,
      color: type === 'cyan' ? theme.cyan : theme.magenta,
      radius: 10,
      speed: (3 + Math.random() * 2) * difficultyRef.current,
      wobble: Math.random() * Math.PI * 2
    });
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y, color,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 6 - 3,
        speedY: Math.random() * 6 - 3,
        life: 1,
        decay: Math.random() * 0.02 + 0.02
      });
    }
  };

  const switchPlayerColor = useCallback(() => {
    if (!gameState.isPlaying) return;
    const p = playerRef.current;
    p.type = p.type === 'cyan' ? 'magenta' : 'cyan';
    p.color = p.type === 'cyan' ? theme.cyan : theme.magenta;
    playSound('switch');
    createParticles(p.x + p.width / 2, p.y + p.height / 2, p.color, 10);
  }, [gameState.isPlaying, theme]);

  // Input Handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
    };

    const handleMouseDown = (e: MouseEvent) => {
       // Only switch if clicking on canvas or during game (UI layer might block)
       // We'll rely on global listener in App or explicit checks if needed.
       // Here we attach to window for robustness
       if(gameState.isPlaying) switchPlayerColor();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
          if(gameState.isPlaying) switchPlayerColor();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isPlaying, switchPlayerColor]);


  // Main Game Loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas Size Management (Simple resize check)
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    // Clear / Trail
    ctx.fillStyle = gameState.isPlaying ? `${theme.bg}50` : `${theme.bg}50`; // Use hex with opacity
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const p = playerRef.current;

    if (gameState.isPlaying) {
      framesRef.current++;
      
      // Difficulty
      if (framesRef.current % 600 === 0) difficultyRef.current += 0.1;

      // Spawn
      if (framesRef.current % Math.floor(60 / difficultyRef.current) === 0) {
        spawnOrb(canvas.width);
      }

      // Update Player
      p.targetX = mouseXRef.current - p.width / 2;
      // Clamp
      if (p.targetX < 0) p.targetX = 0;
      if (p.targetX > canvas.width - p.width) p.targetX = canvas.width - p.width;
      p.x += (p.targetX - p.x) * 0.2; // Lerp

      // Update Orbs
      for (let i = orbsRef.current.length - 1; i >= 0; i--) {
        const o = orbsRef.current[i];
        o.y += o.speed;
        o.wobble += 0.05;
        o.x += Math.sin(o.wobble) * 0.5;

        // Collision
        if (
          o.x > p.x &&
          o.x < p.x + p.width &&
          o.y + o.radius > p.y &&
          o.y - o.radius < p.y + p.height
        ) {
           if (o.type === p.type) {
             // Hit
             scoreRef.current += 10 + (comboRef.current * 5);
             comboRef.current++;
             if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
             createParticles(o.x, o.y, o.color, 8);
             playSound('catch', comboRef.current);
             orbsRef.current.splice(i, 1);
             onScoreUpdate(scoreRef.current, comboRef.current);
           } else {
             // Wrong color
             createParticles(p.x + p.width/2, p.y, '#ffffff', 50);
             playSound('crash');
             onGameOver(scoreRef.current, maxComboRef.current);
             return; // Stop loop immediately
           }
        } else if (o.y > canvas.height) {
          // Miss
          orbsRef.current.splice(i, 1);
          if (o.type === p.type) {
             if (comboRef.current > 0) playSound('switch'); 
             comboRef.current = 0;
             onScoreUpdate(scoreRef.current, comboRef.current);
          }
        }
      }
    } else {
       // Menu Mode: Just draw player stationary or follow mouse slightly
       p.targetX = mouseXRef.current - p.width / 2;
       if (p.targetX < 0) p.targetX = 0;
       if (p.targetX > canvas.width - p.width) p.targetX = canvas.width - p.width;
       p.x += (p.targetX - p.x) * 0.2;
    }

    // Draw Player
    ctx.shadowBlur = 20;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(p.x + 5, p.y + 5, p.width - 10, 2);
    ctx.shadowBlur = 0;

    // Draw Orbs
    if (gameState.isPlaying) {
        for (const o of orbsRef.current) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = o.color;
            ctx.fillStyle = o.color;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.speedX;
        pt.y += pt.speedY;
        pt.life -= pt.decay;
        
        if (pt.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Loop
    requestRef.current = requestAnimationFrame(animate);
  }, [theme, gameState.isPlaying, onGameOver, onScoreUpdate]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <canvas 
        ref={canvasRef} 
        className="block w-full h-full cursor-none touch-none"
        style={{ boxShadow: `0 0 50px ${theme.cyan}40` }}
    />
  );
};

export default GameCanvas;
