import { useEffect, useRef, useState } from 'react';
import { NetworkClient } from '@/game/NetworkClient';
import { InputManager } from '@/game/InputManager';
import { GameRenderer } from '@/game/GameRenderer';
import { useGameStore } from '@/store/gameStore';
import HUD from '@/components/HUD';
import StartPanel from '@/components/StartPanel';
import GameOverPanel from '@/components/GameOverPanel';
import PausePanel from '@/components/PausePanel';
import TouchControls from '@/components/TouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const networkRef = useRef<NetworkClient | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const processedEventIdsRef = useRef<Set<number>>(new Set());
  const eventCounterRef = useRef(0);

  const [isMobile, setIsMobile] = useState(false);

  const setConnectionStatus = useGameStore((s) => s.setConnectionStatus);
  const setGameState = useGameStore((s) => s.setGameState);
  const pushEvent = useGameStore((s) => s.pushEvent);
  const eventQueue = useGameStore((s) => s.eventQueue);
  const gameState = useGameStore((s) => s.gameState);
  const currentStatus = gameState?.status || 'idle';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const network = new NetworkClient();
    const input = new InputManager();
    const renderer = new GameRenderer(canvasRef.current);

    networkRef.current = network;
    inputRef.current = input;
    rendererRef.current = renderer;

    network.onConnectionChange((status) => {
      setConnectionStatus(status);
    });

    network.onState((state) => {
      setGameState(state);
      input.setGameStatus(state.status);
    });

    network.onEvent((event) => {
      const eventWithId = { ...event, _id: eventCounterRef.current++ };
      pushEvent(eventWithId);
    });

    input.onChange((state) => {
      network.setInput(state.left, state.right, state.jump);
    });

    input.onStart(() => {
      network.sendStart();
    });

    input.onRestart(() => {
      network.sendRestart();
    });

    input.onPause(() => {
      network.sendPause();
    });

    input.onResume(() => {
      network.sendResume();
    });

    input.attach();
    network.connect();

    const handleResize = () => {
      renderer.resize();
    };
    window.addEventListener('resize', handleResize);

    const renderLoop = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      const deltaTime = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = timestamp;

      const currentState = useGameStore.getState().gameState;
      const events = useGameStore.getState().eventQueue;

      for (const event of events) {
        const ev = event as { _id?: number };
        const id = ev._id ?? event.timestamp;
        if (!processedEventIdsRef.current.has(id)) {
          processedEventIdsRef.current.add(id);
          renderer.handleEvent(event);
        }
      }

      if (processedEventIdsRef.current.size > 500) {
        processedEventIdsRef.current.clear();
      }

      if (currentState) {
        renderer.render(currentState, deltaTime);
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    };

    rafRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('resize', handleResize);
      input.detach();
      network.disconnect();
    };
  }, [setConnectionStatus, setGameState, pushEvent]);

  useEffect(() => {
    for (const event of eventQueue) {
      rendererRef.current?.handleEvent(event);
    }
  }, [eventQueue]);

  const handleStart = () => {
    networkRef.current?.sendStart();
  };

  const handleRestart = () => {
    networkRef.current?.sendRestart();
  };

  const handlePause = () => {
    networkRef.current?.sendPause();
  };

  const handleResume = () => {
    networkRef.current?.sendResume();
  };

  const handleTouchInput = (input: { left: boolean; right: boolean; jump: boolean }) => {
    networkRef.current?.setInput(input.left, input.right, input.jump);
    inputRef.current?.setTouchInput(input);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />

      <HUD />

      {currentStatus === 'playing' && (
        <button
          onClick={handlePause}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-600/50 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all text-slate-300 hover:text-cyan-400 pointer-events-auto"
          aria-label="暂停"
          style={{ transform: 'translate(calc(-50% + 180px), 0)' }}
        >
          <span className="sr-only">暂停</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </button>
      )}

      {currentStatus === 'idle' && <StartPanel onStart={handleStart} />}
      {currentStatus === 'gameover' && <GameOverPanel onRestart={handleRestart} />}
      {currentStatus === 'paused' && <PausePanel onResume={handleResume} onRestart={handleRestart} />}

      <TouchControls onInputChange={handleTouchInput} visible={isMobile && currentStatus !== 'idle'} />
    </div>
  );
}
