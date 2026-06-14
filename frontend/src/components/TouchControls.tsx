import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';

interface TouchControlsProps {
  onInputChange: (input: { left: boolean; right: boolean; jump: boolean }) => void;
  visible?: boolean;
}

export default function TouchControls({ onInputChange, visible = true }: TouchControlsProps) {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [jumpPressed, setJumpPressed] = useState(false);

  const prevInputRef = useRef<{ left: boolean; right: boolean; jump: boolean } | null>(null);

  const notifyChange = useCallback(
    (left: boolean, right: boolean, jump: boolean) => {
      const prev = prevInputRef.current;
      if (!prev || prev.left !== left || prev.right !== right || prev.jump !== jump) {
        prevInputRef.current = { left, right, jump };
        onInputChange({ left, right, jump });
      }
    },
    [onInputChange],
  );

  useEffect(() => {
    notifyChange(leftPressed, rightPressed, jumpPressed);
  }, [leftPressed, rightPressed, jumpPressed, notifyChange]);

  if (!visible) return null;

  const createHandlers = (setter: (v: boolean) => void) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      setter(true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      setter(false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      setter(false);
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      setter(true);
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      setter(false);
    },
    onMouseLeave: () => {
      setter(false);
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
    },
  });

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none pb-6 md:hidden">
      <div className="flex justify-between items-end px-6 pointer-events-auto select-none">
        <div className="flex gap-3">
          <button
            className={`touch-btn w-16 h-16 rounded-full flex items-center justify-center transition-all duration-100 ${
              leftPressed
                ? 'bg-cyan-500/50 border-cyan-400 scale-95 shadow-lg shadow-cyan-500/40'
                : 'bg-slate-900/60 border-slate-600/50 backdrop-blur-md'
            }`}
            aria-label="向左移动"
            {...createHandlers(setLeftPressed)}
          >
            <ArrowLeft
              className={`w-7 h-7 transition-colors ${leftPressed ? 'text-white' : 'text-slate-300'}`}
              strokeWidth={2.5}
            />
          </button>

          <button
            className={`touch-btn w-16 h-16 rounded-full flex items-center justify-center transition-all duration-100 ${
              rightPressed
                ? 'bg-cyan-500/50 border-cyan-400 scale-95 shadow-lg shadow-cyan-500/40'
                : 'bg-slate-900/60 border-slate-600/50 backdrop-blur-md'
            }`}
            aria-label="向右移动"
            {...createHandlers(setRightPressed)}
          >
            <ArrowRight
              className={`w-7 h-7 transition-colors ${rightPressed ? 'text-white' : 'text-slate-300'}`}
              strokeWidth={2.5}
            />
          </button>
        </div>

        <button
          className={`touch-btn w-20 h-20 rounded-full flex items-center justify-center transition-all duration-100 ${
            jumpPressed
              ? 'bg-orange-500/60 border-orange-400 scale-95 shadow-lg shadow-orange-500/50'
              : 'bg-slate-900/60 border-orange-500/40 backdrop-blur-md'
          }`}
          aria-label="跳跃"
          {...createHandlers(setJumpPressed)}
        >
          <ArrowUp
            className={`w-9 h-9 transition-colors ${jumpPressed ? 'text-white' : 'text-orange-400'}`}
            strokeWidth={2.5}
          />
        </button>
      </div>
    </div>
  );
}
