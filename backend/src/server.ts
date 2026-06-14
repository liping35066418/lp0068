import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import cors from 'cors';
import { GameEngine } from './game/GameEngine';
import type {
  GameConfig,
  InputMessage,
  OutputMessage,
  GameState,
  Rect,
} from './types/shared';

const PORT = 9758;

const gameConfig: GameConfig = {
  gravity: 1800,
  jumpVelocity: -750,
  moveSpeed: 320,
  initialLives: 3,
  baseLevelLength: 4000,
  levelLengthIncrement: 1500,
  baseObstacleDensity: 0.001,
  obstacleDensityIncrement: 0.25,
  invincibleDuration: 1.2,
  speedMultiplier: 1.6,
  viewportWidth: 1280,
  viewportHeight: 720,
  worldHeight: 800,
};

interface ClientConnection {
  ws: WebSocket;
  engine: GameEngine;
  broadcastInterval: NodeJS.Timeout | null;
}

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map<WebSocket, ClientConnection>();

wss.on('connection', (ws) => {
  console.log('Client connected');

  const connection = createClientConnection(ws);
  clients.set(ws, connection);

  ws.on('message', (data) => {
    handleMessage(ws, data);
  });

  ws.on('close', () => {
    cleanupClient(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    cleanupClient(ws);
  });
});

function createClientConnection(ws: WebSocket): ClientConnection {
  const engine = new GameEngine(gameConfig, {
    onMessage: (message) => {
      sendMessage(ws, message);
    },
  });

  return {
    ws,
    engine,
    broadcastInterval: setInterval(() => {
      broadcastState(ws, engine);
    }, 16),
  };
}

function handleMessage(ws: WebSocket, data: RawData): void {
  try {
    const message: InputMessage = JSON.parse(data.toString());
    const connection = clients.get(ws);
    if (!connection) return;

    switch (message.type) {
      case 'start':
        connection.engine.start();
        break;
      case 'restart':
        connection.engine.restart();
        break;
      case 'pause':
        connection.engine.pause();
        break;
      case 'resume':
        connection.engine.resume();
        break;
      case 'input':
        connection.engine.setInput({
          left: message.payload.left,
          right: message.payload.right,
          jump: message.payload.jump,
          jumpPressed: message.payload.jumpPressed,
        });
        break;
      default:
        console.warn('Unknown message type:', message);
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
}

function broadcastState(ws: WebSocket, engine: GameEngine): void {
  if (ws.readyState !== WebSocket.OPEN) return;

  const state = engine.getState();
  const culledState = cullStateForViewport(state);

  sendMessage(ws, {
    type: 'state',
    payload: culledState,
  });
}

function cullStateForViewport(state: GameState): GameState {
  const viewportMargin = 300;
  const viewLeft = state.cameraX - viewportMargin;
  const viewRight = state.cameraX + gameConfig.viewportWidth + viewportMargin;
  const viewTop = -viewportMargin;
  const viewBottom = gameConfig.worldHeight + viewportMargin;

  const isInView = (rect: Rect): boolean => {
    return (
      rect.x + rect.width >= viewLeft &&
      rect.x <= viewRight &&
      rect.y + rect.height >= viewTop &&
      rect.y <= viewBottom
    );
  };

  return {
    ...state,
    platforms: state.platforms.filter(isInView),
    obstacles: state.obstacles.filter(isInView),
    powerups: state.powerups.filter((p) => !p.collected && isInView(p)),
  };
}

function sendMessage(ws: WebSocket, message: OutputMessage): void {
  if (ws.readyState !== WebSocket.OPEN) return;

  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

function cleanupClient(ws: WebSocket): void {
  const connection = clients.get(ws);
  if (connection) {
    if (connection.broadcastInterval) {
      clearInterval(connection.broadcastInterval);
    }
    connection.engine.destroy();
    clients.delete(ws);
  }
}

server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
