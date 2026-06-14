import { useMemo } from 'react';
import { Heart, Zap, Shield, Sparkles, Trophy } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { ActiveEffect, EffectType } from '@/types';

const effectIcons: Record<EffectType, typeof Heart> = {
  health: Heart,
  speed: Zap,
  shield: Shield,
  double: Sparkles,
};

const effectColors: Record<EffectType, string> = {
  health: 'from-red-500 to-red-400',
  speed: 'from-yellow-400 to-amber-300',
  shield: 'from-yellow-500 to-amber-400',
  double: 'from-pink-500 to-pink-400',
};

const effectBarBg: Record<EffectType, string> = {
  health: 'bg-red-500',
  speed: 'bg-yellow-400',
  shield: 'bg-yellow-500',
  double: 'bg-pink-500',
};

function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

export default function HUD() {
  const gameState = useGameStore((s) => s.gameState);

  const hearts = useMemo(() => {
    if (!gameState) return [];
    const result: { filled: boolean; key: number }[] = [];
    for (let i = 0; i < gameState.maxLives; i++) {
      result.push({ filled: i < gameState.lives, key: i });
    }
    return result;
  }, [gameState]);

  const activeEffectsWithProgress = useMemo<(ActiveEffect & { progress: number })[]>(() => {
    if (!gameState) return [];
    return gameState.activeEffects.map((e) => ({
      ...e,
      progress: Math.max(0, Math.min(1, e.remaining / e.duration)),
    }));
  }, [gameState]);

  if (!gameState || gameState.status === 'idle') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">
      <div className="absolute top-4 left-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30">
          {hearts.map((heart) => (
            <div key={heart.key} className={heart.filled ? 'heart-beat' : ''}>
              <Heart
                className={`w-6 h-6 transition-all duration-200 ${
                  heart.filled
                    ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    : 'text-slate-700'
                }`}
                fill={heart.filled ? 'currentColor' : 'transparent'}
                strokeWidth={2}
              />
            </div>
          ))}
          <div className="ml-2 pl-2 border-l border-slate-700">
            <span className="font-mono text-sm text-slate-300">
              {gameState.lives} / {gameState.maxLives}
            </span>
          </div>
        </div>

        {activeEffectsWithProgress.length > 0 && (
          <div className="flex flex-col gap-2">
            {activeEffectsWithProgress.map((effect, idx) => {
              const Icon = effectIcons[effect.type];
              return (
                <div
                  key={`${effect.type}-${idx}`}
                  className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  <div className={`bg-gradient-to-br ${effectColors[effect.type]} p-1 rounded-md`}>
                    <Icon className="w-4 h-4 text-slate-900" />
                  </div>
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${effectBarBg[effect.type]} rounded-full transition-all`}
                      style={{ width: `${effect.progress * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="bg-slate-900/70 backdrop-blur-md px-5 py-2 rounded-xl border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span
              className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 tabular-nums"
              style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}
            >
              {formatScore(gameState.score)}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-orange-500/40 shadow-lg shadow-orange-500/10">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-display text-sm font-semibold uppercase tracking-wider">
              Level
            </span>
            <span
              className="font-display text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300"
              style={{ textShadow: '0 0 15px rgba(249, 115, 22, 0.5)' }}
            >
              {gameState.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
