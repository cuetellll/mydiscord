/**
 * PulseCord — Production Node.js + TypeScript + Express + Socket.IO + LiveKit SFU Server
 * Optimized for Railway deployment (`process.env.PORT`, `/api/health`, Prisma PostgreSQL)
 */

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AccessToken } from 'livekit-server-sdk';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

// API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Railway Production Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      service: 'pulsecord-api',
      dbLatencyMs: Date.now() - start,
      connectedSockets: io.engine.clientsCount,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: 'Database connectivity check failed' });
  }
});

// LiveKit WebRTC SFU Room Token Endpoint for Multi-User Voice, Video & Screen Sharing
app.post('/api/voice/token', async (req, res) => {
  const { userId, username, channelId } = req.body;
  if (!userId || !channelId) {
    return res.status(400).json({ error: 'userId and channelId are required' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return res.status(503).json({
      error: 'LiveKit SFU credentials not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.'
    });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(userId),
    name: String(username || userId),
    ttl: '4h'
  });

  at.addGrant({
    roomJoin: true,
    room: String(channelId),
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  const token = await at.toJwt();
  return res.json({ token, url: livekitUrl });
});

// Real-Time WebSocket Gateway (Socket.IO)
io.on('connection', (socket) => {
  socket.on('server:join', (serverId: string) => {
    socket.join(`server:${serverId}`);
  });

  socket.on('channel:join', (channelId: string) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('message:send', (payload) => {
    io.to(`channel:${payload.channel_id}`).emit('message:new', payload);
  });

  socket.on('typing:start', ({ channelId, user }) => {
    socket.to(`channel:${channelId}`).emit('typing:update', { channelId, user, isTyping: true });
  });

  socket.on('voice:state', (voicePayload) => {
    io.to(`server:${voicePayload.server_id}`).emit('voice:updated', voicePayload);
  });
});

// Serve Static Frontend Assets
const rootDir = path.resolve(__dirname, '../../');
app.use(express.static(rootDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Railway Dynamic PORT Binding
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[PulseCord] Production server listening on 0.0.0.0:${PORT}`);
});
