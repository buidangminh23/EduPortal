import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import aiRouter from './routes/ai.js';
import { attachSignaling } from './signaling.js';

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' })); // audioBase64 có thể lớn

app.get('/health', (_req, res) => res.json({ ok: true, service: 'eduportal-server' }));
app.use('/api', aiRouter);

const server = http.createServer(app);

// WebRTC signaling qua WebSocket tại đường /rtc?room=<id>
const wss = new WebSocketServer({ server, path: '/rtc' });
attachSignaling(wss);

server.listen(PORT, () => {
  console.log(`EduPortal server đang chạy: http://localhost:${PORT}`);
  console.log(`  • AI REST:   POST /api/transcribe · POST /api/summarize`);
  console.log(`  • Signaling: ws://localhost:${PORT}/rtc?room=<id>`);
});
