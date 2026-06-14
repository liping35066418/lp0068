import type { GameState, GameEvent, InputFrame, ConnectionStatus } from '@/types';

type StateCallback = (state: GameState) => void;
type EventCallback = (event: GameEvent) => void;
type ConnectionCallback = (status: ConnectionStatus) => void;

const WS_URL = 'ws://localhost:9758';
const RECONNECT_DELAY_BASE = 1000;
const RECONNECT_DELAY_MAX = 10000;
const INPUT_INTERVAL = 16;

export class NetworkClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private connectionStatus: ConnectionStatus = 'disconnected';

  private onStateCallback: StateCallback | null = null;
  private onEventCallback: EventCallback | null = null;
  private onConnectionCallback: ConnectionCallback | null = null;

  private inputFrame: InputFrame = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    timestamp: 0,
  };

  private inputInterval: ReturnType<typeof setInterval> | null = null;
  private prevJump = false;

  connect(): void {
    this.shouldReconnect = true;
    this.establishConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopInputLoop();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionStatus('disconnected');
  }

  onState(callback: StateCallback): void {
    this.onStateCallback = callback;
  }

  onEvent(callback: EventCallback): void {
    this.onEventCallback = callback;
  }

  onConnectionChange(callback: ConnectionCallback): void {
    this.onConnectionCallback = callback;
  }

  setInput(left: boolean, right: boolean, jump: boolean): void {
    const jumpPressed = jump && !this.prevJump;
    this.prevJump = jump;
    this.inputFrame = {
      left,
      right,
      jump,
      jumpPressed,
      timestamp: Date.now(),
    };
  }

  sendStart(): void {
    this.sendMessage({ type: 'start' });
  }

  sendRestart(): void {
    this.sendMessage({ type: 'restart' });
  }

  sendPause(): void {
    this.sendMessage({ type: 'pause' });
  }

  sendResume(): void {
    this.sendMessage({ type: 'resume' });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private establishConnection(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setConnectionStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(WS_URL);
    } catch (e) {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionStatus('connected');
      this.startInputLoop();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = () => {
      this.scheduleReconnect();
    };

    this.ws.onclose = () => {
      this.stopInputLoop();
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      } else {
        this.setConnectionStatus('disconnected');
      }
    };
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'state' && msg.payload) {
        this.onStateCallback?.(msg.payload as GameState);
      } else if (msg.type === 'event' && msg.payload) {
        this.onEventCallback?.(msg.payload as GameEvent);
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }

  private sendMessage(msg: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startInputLoop(): void {
    this.stopInputLoop();
    this.inputInterval = setInterval(() => {
      this.sendMessage({
        type: 'input',
        payload: { ...this.inputFrame },
      });
      this.inputFrame.jumpPressed = false;
    }, INPUT_INTERVAL);
  }

  private stopInputLoop(): void {
    if (this.inputInterval) {
      clearInterval(this.inputInterval);
      this.inputInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;

    this.stopInputLoop();
    this.setConnectionStatus('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      RECONNECT_DELAY_BASE * Math.pow(2, this.reconnectAttempts - 1),
      RECONNECT_DELAY_MAX,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.establishConnection();
    }, delay);
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.onConnectionCallback?.(status);
  }
}
