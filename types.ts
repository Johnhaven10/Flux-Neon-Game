export interface Theme {
  cyan: string;
  magenta: string;
  bg: string;
}

export interface GameState {
  score: number;
  maxCombo: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export type OrbType = 'cyan' | 'magenta';

export interface OrbEntity {
  x: number;
  y: number;
  type: OrbType;
  color: string;
  radius: number;
  speed: number;
  wobble: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  decay: number;
}

export interface PlayerEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: OrbType;
  color: string;
  targetX: number;
}
