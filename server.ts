import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

interface PlayerState {
  id: string;
  name: string;
  walletAddress: string | null;
  isHunter: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  isLocked: boolean;
  propRotationOffset: number;
  activePropType: string;
  hp: number;
  score: number;
  isDead: boolean;
}

interface Room {
  code: string;
  phase: 'WAITING' | 'HIDING' | 'HUNTING' | 'GAME_OVER';
  timeLeft: number;
  gameOverMessage: string;
  players: { [id: string]: PlayerState };
}

const rooms: { [code: string]: Room } = {};

// Keep track of which room and ID a WebSocket connection belongs to
const wsRooms = new Map<WebSocket, { roomCode: string; playerId: string }>();

// Broadcast helper
function broadcastToRoom(roomCode: string, message: any, excludeWs?: WebSocket) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const info = wsRooms.get(client);
      if (info && info.roomCode === roomCode && client !== excludeWs) {
        client.send(JSON.stringify(message));
      }
    }
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (messageStr) => {
    try {
      const data = JSON.parse(messageStr.toString());
      const { type, roomCode, playerId } = data;

      if (type === 'join-room') {
        const { playerState } = data;
        let room = rooms[roomCode];
        if (!room) {
          room = {
            code: roomCode,
            phase: 'WAITING',
            timeLeft: 30,
            gameOverMessage: '',
            players: {},
          };
          rooms[roomCode] = room;
        }

        room.players[playerId] = playerState;
        wsRooms.set(ws, { roomCode, playerId });

        // Broadcast join
        broadcastToRoom(roomCode, {
          type: 'player-joined',
          playerId,
          playerState,
          roomState: {
            phase: room.phase,
            timeLeft: room.timeLeft,
            gameOverMessage: room.gameOverMessage,
          },
        });

        // Send existing players list to the new joiner
        ws.send(JSON.stringify({
          type: 'room-sync',
          players: room.players,
          roomState: {
            phase: room.phase,
            timeLeft: room.timeLeft,
            gameOverMessage: room.gameOverMessage,
          },
        }));
      }

      else if (type === 'update-state') {
        const info = wsRooms.get(ws);
        if (info) {
          const room = rooms[info.roomCode];
          if (room && room.players[info.playerId]) {
            room.players[info.playerId] = {
              ...room.players[info.playerId],
              ...data.state,
            };
            // Broadcast update to everyone else in the room
            broadcastToRoom(info.roomCode, {
              type: 'player-updated',
              playerId: info.playerId,
              state: data.state,
            }, ws);
          }
        }
      }

      else if (type === 'shoot') {
        const info = wsRooms.get(ws);
        if (info) {
          broadcastToRoom(info.roomCode, {
            type: 'player-shot',
            playerId: info.playerId,
            origin: data.origin,
            direction: data.direction,
          }, ws);
        }
      }

      else if (type === 'chat-message') {
        const info = wsRooms.get(ws);
        if (info) {
          broadcastToRoom(info.roomCode, {
            type: 'chat-message',
            sender: data.sender,
            text: data.text,
            role: data.role,
            channel: data.channel,
          });
        }
      }

      else if (type === 'phase-change') {
        const info = wsRooms.get(ws);
        if (info) {
          const room = rooms[info.roomCode];
          if (room) {
            room.phase = data.phase;
            room.timeLeft = data.timeLeft;
            if (data.gameOverMessage !== undefined) {
              room.gameOverMessage = data.gameOverMessage;
            }
            broadcastToRoom(info.roomCode, {
              type: 'phase-changed',
              phase: data.phase,
              timeLeft: data.timeLeft,
              gameOverMessage: data.gameOverMessage,
            }, ws);
          }
        }
      }

      else if (type === 'hit') {
        const info = wsRooms.get(ws);
        if (info) {
          broadcastToRoom(info.roomCode, {
            type: 'player-hit',
            targetId: data.targetId,
            damage: data.damage,
            shooterId: info.playerId,
          });
        }
      }

    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const info = wsRooms.get(ws);
    if (info) {
      const { roomCode, playerId } = info;
      const room = rooms[roomCode];
      if (room) {
        delete room.players[playerId];
        wsRooms.delete(ws);

        // If room is empty, clean it up
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomCode];
        } else {
          broadcastToRoom(roomCode, {
            type: 'player-left',
            playerId,
          });
        }
      }
    }
  });
});

// Serve static build or delegate to Vite in development
async function init() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Express WebSocket Server running on http://localhost:${PORT}`);
  });
}

init();
