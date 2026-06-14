export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

type InputChangeCallback = (state: InputState) => void;
type ActionCallback = () => void;

export class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    jump: false,
  };

  private onChangeCallback: InputChangeCallback | null = null;
  private onStartCallback: ActionCallback | null = null;
  private onRestartCallback: ActionCallback | null = null;
  private onPauseCallback: ActionCallback | null = null;
  private onResumeCallback: ActionCallback | null = null;

  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;

  private isPaused = false;
  private isGameOver = false;
  private isIdle = true;

  constructor() {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
  }

  setGameStatus(status: 'idle' | 'playing' | 'paused' | 'gameover'): void {
    this.isIdle = status === 'idle';
    this.isPaused = status === 'paused';
    this.isGameOver = status === 'gameover';
  }

  onChange(callback: InputChangeCallback): void {
    this.onChangeCallback = callback;
  }

  onStart(callback: ActionCallback): void {
    this.onStartCallback = callback;
  }

  onRestart(callback: ActionCallback): void {
    this.onRestartCallback = callback;
  }

  onPause(callback: ActionCallback): void {
    this.onPauseCallback = callback;
  }

  onResume(callback: ActionCallback): void {
    this.onResumeCallback = callback;
  }

  setTouchInput(state: Partial<InputState>): void {
    const newState = { ...this.state, ...state };
    if (this.stateChanged(newState)) {
      this.state = newState;
      this.notifyChange();
    }
  }

  private stateChanged(newState: InputState): boolean {
    return (
      newState.left !== this.state.left ||
      newState.right !== this.state.right ||
      newState.jump !== this.state.jump
    );
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        this.updateState({ left: true });
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        this.updateState({ right: true });
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault();
        if (this.isIdle) {
          this.onStartCallback?.();
        } else {
          this.updateState({ jump: true });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this.isIdle || this.isGameOver) {
          this.onRestartCallback?.();
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (this.isPaused) {
          this.onResumeCallback?.();
        } else if (!this.isIdle && !this.isGameOver) {
          this.onPauseCallback?.();
        }
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        this.updateState({ left: false });
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        this.updateState({ right: false });
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault();
        this.updateState({ jump: false });
        break;
    }
  }

  private updateState(partial: Partial<InputState>): void {
    const newState = { ...this.state, ...partial };
    if (this.stateChanged(newState)) {
      this.state = newState;
      this.notifyChange();
    }
  }

  private notifyChange(): void {
    this.onChangeCallback?.({ ...this.state });
  }
}
