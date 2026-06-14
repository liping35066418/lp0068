import { create } from 'zustand';
import type { GameState, GameEvent, ConnectionStatus, ActiveEffect } from '@/types';

interface GameStore {
  connectionStatus: ConnectionStatus;
  gameState: GameState | null;
  eventQueue: GameEvent[];
  setConnectionStatus: (status: ConnectionStatus) => void;
  setGameState: (state: GameState) => void;
  pushEvent: (event: GameEvent) => void;
  clearEvents: () => void;
}

const createDefaultState = (): GameState => ({
  status: 'idle',
  level: 1,
  score: 0,
  lives: 3,
  maxLives: 3,
  cameraX: 0,
  player: {
    id: 'player-1',
    x: 100,
    y: 400,
    width: 40,
    height: 50,
    vx: 0,
    vy: 0,
    onGround: false,
    facingRight: true,
    invincible: false,
    invincibleTimer: 0,
  },
  platforms: [],
  obstacles: [],
  powerups: [],
  activeEffects: [] as ActiveEffect[],
  levelEndX: 3000,
  worldWidth: 3200,
  worldHeight: 720,
  timestamp: 0,
});

export const useGameStore = create<GameStore>((set) => ({
  connectionStatus: 'disconnected',
  gameState: createDefaultState(),
  eventQueue: [],
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setGameState: (state) => set({ gameState: state }),
  pushEvent: (event) =>
    set((prev) => ({ eventQueue: [...prev.eventQueue, event] })),
  clearEvents: () => set({ eventQueue: [] }),
}));
