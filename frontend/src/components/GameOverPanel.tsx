import { RefreshCw, Trophy, Target } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface GameOverPanelProps {
  onRestart: () => void;
}

function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

export default function GameOverPanel({ onRestart }: GameOverPanelProps) {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState || gameState.status !== 'gameover') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto animate-fadeIn">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />

      <div className="relative glass-panel p-8 md:p-10 rounded-3xl border border-red-500/30 shadow-2xl shadow-red-500/10 max-w-md w-11/12 animate-scaleIn">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 mb-4">
            <span className="text-3xl">💀</span>
          </div>
          <h2 className="font-display font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2">
            GAME OVER
          </h2>
          <p className="text-slate-400 text-sm">赛博战士已倒下...</p>
        </div>

        <div className="bg-slate-900/70 rounded-2xl p-6 mb-6 border border-slate-700/50">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-slate-400 text-sm uppercase tracking-wider">最终分数</span>
            </div>
            <div
              className="font-display font-black text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 tabular-nums"
              style={{ textShadow: '0 0 30px rgba(34, 211, 238, 0.6)' }}
            >
              {formatScore(gameState.score)}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-slate-800/60 rounded-xl p-4 text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-1 mb-1 text-orange-400">
                <Target className="w-4 h-4" />
              </div>
              <div className="font-display font-bold text-2xl text-white tabular-nums">
                {gameState.level}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">到达关卡</div>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="neon-button w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-wider transition-all duration-200"
        >
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5" />
            重新开始
          </div>
        </button>

        <div className="mt-4 text-center text-xs text-slate-500">
          按 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono">Enter</kbd> 快速重开
        </div>
      </div>
    </div>
  );
}
