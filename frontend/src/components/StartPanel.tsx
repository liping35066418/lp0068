import { Play, Keyboard, MousePointer, Smartphone, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface StartPanelProps {
  onStart: () => void;
}

export default function StartPanel({ onStart }: StartPanelProps) {
  const connectionStatus = useGameStore((s) => s.connectionStatus);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm" />

      <div className="relative glass-panel p-8 md:p-12 rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 max-w-lg w-11/12">
        <div className="mb-2 flex justify-center">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
              }`}
            />
            {connectionStatus === 'connected'
              ? '服务器已连接'
              : connectionStatus === 'connecting'
                ? '连接中...'
                : connectionStatus === 'reconnecting'
                  ? '重连中...'
                  : '未连接'}
          </span>
        </div>

        <h1 className="neon-title text-center mb-8 mt-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 font-display font-black text-5xl md:text-6xl tracking-tight">
            CYBER
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 font-display font-black text-5xl md:text-6xl tracking-tight">
            RUNNER
          </span>
        </h1>

        <p className="text-center text-slate-400 mb-8 text-sm md:text-base">
          穿越霓虹都市的赛博空间<br />
          <span className="text-cyan-400/70">躲避障碍 · 收集道具 · 挑战高分</span>
        </p>

        <button
          onClick={onStart}
          className="neon-button w-full mb-8 py-4 rounded-xl font-display font-bold text-lg uppercase tracking-wider transition-all duration-200"
        >
          <div className="flex items-center justify-center gap-3">
            <Play className="w-5 h-5" fill="currentColor" />
            开始游戏
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3 text-cyan-400 text-sm font-semibold">
              <Keyboard className="w-4 h-4" />
              <span>键盘</span>
            </div>
            <div className="space-y-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600">←</kbd>
                  <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600">→</kbd>
                </div>
                <span>移动</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px]">Space</kbd>
                <span>跳跃</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600">ESC</kbd>
                <span>暂停</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3 text-orange-400 text-sm font-semibold">
              <MousePointer className="w-4 h-4" />
              <span>触屏 / 鼠标</span>
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <ArrowLeft className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
                <span>移动</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center">
                  <ArrowUp className="w-3 h-3 text-cyan-400" />
                </div>
                <span>跳跃</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400/50" />
                <span>移动端自动显示</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          按 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 font-mono">Enter</kbd> 快速开始
        </div>
      </div>
    </div>
  );
}
