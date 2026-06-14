import { Play, RefreshCw, Pause } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface PausePanelProps {
  onResume: () => void;
  onRestart: () => void;
}

export default function PausePanel({ onResume, onRestart }: PausePanelProps) {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState || gameState.status !== 'paused') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto animate-fadeIn">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative glass-panel p-8 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 max-w-sm w-11/12 animate-scaleIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 mb-4">
            <Pause className="w-8 h-8 text-cyan-400" strokeWidth={2.5} />
          </div>
          <h2 className="font-display font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-2">
            已暂停
          </h2>
          <p className="text-slate-400 text-sm">深呼吸，准备好了吗？</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="neon-button w-full py-3.5 rounded-xl font-display font-bold text-base uppercase tracking-wider transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" fill="currentColor" />
              继续游戏
            </div>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-xl font-display font-semibold text-base uppercase tracking-wider bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-600/50 hover:border-slate-500 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" />
              重新开始
            </div>
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          按 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono">ESC</kbd> 继续
        </div>
      </div>
    </div>
  );
}
