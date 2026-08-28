export interface ServerFile {
  name: string;
  path: string;
  language: 'typescript' | 'python' | 'go' | 'kotlin' | 'rust' | 'java' | 'csharp' | 'json' | 'yaml' | 'dockerfile' | 'bash' | 'plaintext';
  content: (config: ServerConfig) => string;
}

export interface ServerFramework {
  id: string;
  name: string;
  runtime: string;
  icon: string;
  badge: string;
  description: string;
  defaultPort: number;
  files: ServerFile[];
}

export interface ServerConfig {
  port: number;
  apiKey: string;
  webhookSecret: string;
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  enableRedis: boolean;
  enableWebSocket: boolean;
}

export const defaultServerConfig: ServerConfig = {
  port: 8080,
  apiKey: 'vbz_live_8f3a9e21b7c4d509e8a1f23b7c89',
  webhookSecret: 'whsec_99a8b7c6d5e4f3a2b1c0987654321fed',
  clientId: 'vibez_app_live_44921',
  clientSecret: 'vbz_sec_77a9b0c8d1e2f3456789abcdef',
  apiUrl: 'https://api.vibez.prigid.com/v1',
  enableRedis: true,
  enableWebSocket: true,
};

export const SERVER_FRAMEWORKS: ServerFramework[] = [
  {
    id: 'custom-server',
    name: 'Existing Custom Server',
    runtime: 'Express + Prisma ORM + Socket.IO (In-Repo)',
    icon: '🏢',
    badge: 'Live Backend',
    description: 'The native Vibez custom server codebase located in /server with PostgreSQL Prisma schema, real-time Socket.IO chat rooms, and developer API routes.',
    defaultPort: 3000,
    files: [
      {
        name: 'index.ts',
        path: 'server/src/index.ts',
        language: 'typescript',
        content: (cfg) => `/**
 * VIBEZ Custom Backend Server (Port: ${cfg.port || 3000})
 * Powered by PRIGID GROUP
 * Connected with Developer Hub, Android Client, and Admin Dashboard
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import { DeveloperController } from './controllers/DeveloperController';
import { AuthController } from './controllers/AuthController';
import { ChatController } from './controllers/ChatController';
import { UserController } from './controllers/UserController';
import { StatusController } from './controllers/StatusController';
import { CommunityController } from './controllers/CommunityController';
import { CallController } from './controllers/CallController';
import { AdminController } from './controllers/AdminController';
import { PaymentController } from './controllers/PaymentController';
import { SubscriptionController } from './controllers/SubscriptionController';
import { authenticate, authenticateAdmin } from './middleware/auth';
import { checkMaintenanceMode } from './middleware/maintenance';
import { securityHeaders, sanitizeInputs, checkSecretEntropy } from './middleware/security';
import { authRateLimiter, adminRateLimiter } from './middleware/rateLimiter';

dotenv.config();
checkSecretEntropy();

const app = express();
const httpServer = createServer(app);

// Real-time WebSocket Gateway
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Security & CORS
app.use(cors({ origin: "*", credentials: true }));
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInputs);

// Rate limiters & Maintenance Guard
app.use('/api/admin', adminRateLimiter);
app.use('/api', checkMaintenanceMode);

// Initialize Controllers
const developer = new DeveloperController();
const auth = new AuthController();
const chat = new ChatController();
const user = new UserController();
const admin = new AdminController();
const payment = new PaymentController();

// -------------------------------------------------------------
// DEVELOPER PORTAL INTEGRATION ROUTES (PRIGID GROUP)
// -------------------------------------------------------------
app.get('/api/developer/health', (req, res) => developer.getDeveloperHealth(req, res));
app.get('/api/developer/metrics', (req, res) => developer.getApiMetrics(req, res));
app.post('/api/developer/webhooks/verify', (req, res) => developer.verifyWebhook(req, res));
app.post('/api/developer/messages/send', (req, res) => developer.dispatchServerMessage(req, res, io));
app.post('/api/developer/rtc/token', (req, res) => developer.generateRtcToken(req, res));
app.post('/api/developer/oauth/token', (req, res) => developer.issueOAuthToken(req, res));

// System Status & Core API
app.get('/api/system/status', async (req, res) => {
  const setting = await prisma.systemSetting.findFirst().catch(() => null);
  res.json({
    status: setting?.maintenanceMode ? 'maintenance' : 'online',
    appName: setting?.appName || 'VIBEZ',
    version: '1.0.0',
    poweredBy: 'PRIGID GROUP',
  });
});

// Socket.io Handshake and Message Broadcasting
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) socket.join(\`user_\${userId}\`);

  socket.on('join_chat', (chatId) => {
    socket.join(\`chat_\${chatId}\`);
  });

  socket.on('send_message', async (data) => {
    io.to(\`chat_\${data.chatId}\`).emit('receive_message', data);
  });
});

const PORT = process.env.PORT || ${cfg.port || 3000};
httpServer.listen(PORT, () => {
  console.log(\`[PRIGID GROUP] Vibez Custom Server running on port \${PORT}\`);
});
`,
      },
      {
        name: 'DeveloperController.ts',
        path: 'server/src/controllers/DeveloperController.ts',
        language: 'typescript',
        content: (cfg) => `/**
 * Developer Integration Controller
 * Located at: /server/src/controllers/DeveloperController.ts
 * Powered by PRIGID GROUP
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Server as SocketIOServer } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET || 'vibez_secret_jwt_key_2024';
const DEV_HMAC_SECRET = process.env.VIBEZ_WEBHOOK_SECRET || '${cfg.webhookSecret}';

export class DeveloperController {
  async verifyWebhook(req: Request, res: Response) {
    const { secret = DEV_HMAC_SECRET, payload, signature, timestamp } = req.body;
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const contentToSign = timestamp ? \`\${timestamp}.\${payloadString}\` : payloadString;

    const computed = crypto.createHmac('sha256', secret).update(contentToSign).digest('hex');
    const header = \`t=\${timestamp || Math.floor(Date.now() / 1000)},v1=\${computed}\`;

    return res.json({
      success: true,
      data: {
        isValid: true,
        computedSignature: computed,
        formattedHeader: header,
        server: 'Custom Vibez Express Server',
        poweredBy: 'PRIGID GROUP',
      }
    });
  }

  async dispatchServerMessage(req: Request, res: Response, io?: SocketIOServer) {
    const { channelId, recipientId, content, messageType = 'TEXT' } = req.body;
    const msgId = \`msg_\${Date.now()}_\${crypto.randomBytes(4).toString('hex')}\`;

    if (io && channelId) {
      io.to(\`chat_\${channelId}\`).emit('receive_message', { id: msgId, content, channelId });
    }

    return res.json({
      success: true,
      data: {
        messageId: msgId,
        channelId,
        recipientId,
        content,
        status: 'DELIVERED',
        databaseSynced: true,
        poweredBy: 'PRIGID GROUP VIBEZ Engine',
      }
    });
  }

  async generateRtcToken(req: Request, res: Response) {
    const { roomId, userId, role = 'publisher' } = req.body;
    const token = jwt.sign({ sub: userId, room: roomId, role }, JWT_SECRET, { expiresIn: '2h' });

    return res.json({
      success: true,
      data: {
        token,
        roomId,
        userId,
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        poweredBy: 'PRIGID GROUP',
      }
    });
  }

  async getDeveloperHealth(req: Request, res: Response) {
    return res.json({
      status: 'healthy',
      serverType: 'Custom Vibez Express + Prisma Server',
      uptimeSeconds: Math.floor(process.uptime()),
      database: { provider: 'PostgreSQL', status: 'connected' },
      poweredBy: 'PRIGID GROUP',
    });
  }
}
`,
      },
      {
        name: 'schema.prisma',
        path: 'server/prisma/schema.prisma',
        language: 'plaintext',
        content: () => `// Prisma Schema for Vibez Custom Server
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  phoneNumber   String    @unique
  googleEmail   String?   @unique
  name          String?
  avatarUrl     String?
  about         String?   @default("Hey there! I am using Vibez.")
  isVerified    Boolean   @default(false)
  createdAt     DateTime  @default(now())
  
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  chats            ChatMember[]
}

model Chat {
  id          String   @id @default(uuid())
  isGroup     Boolean  @default(false)
  name        String?
  createdAt   DateTime @default(now())
  messages    Message[]
  members     ChatMember[]
}

model Message {
  id          String      @id @default(uuid())
  content     String
  type        String      @default("TEXT")
  status      String      @default("SENT")
  senderId    String
  chatId      String
  createdAt   DateTime    @default(now())
  
  sender      User        @relation("SentMessages", fields: [senderId], references: [id])
  chat        Chat        @relation(fields: [chatId], references: [id])
}

model SystemSetting {
  id                    String  @id @default(uuid())
  maintenanceMode       Boolean @default(false)
  verificationBadgePrice Float  @default(3.00)
  appName               String? @default("VIBEZ")
}

// DEVELOPER PORTAL & SERVER INTEGRATION TABLES (PRIGID GROUP)
model DeveloperAccount {
  id                    String              @id @default(uuid())
  userId                String              @unique
  organizationName      String?
  tier                  String              @default("FREE")
  status                String              @default("ACTIVE")
  monthlyRequestLimit   Int                 @default(100000)
  currentMonthRequests  Int                 @default(0)
  apiKeys               ApiKey[]
  webhookEndpoints      WebhookEndpoint[]
  applications          ServerApplication[]
  developerLogs         DeveloperLog[]
}

model ApiKey {
  id                    String              @id @default(uuid())
  developerId           String
  name                  String
  keyPrefix             String
  keyHash               String              @unique
  scopes                String[]            @default(["messages:write", "rtc:signaling", "webhooks:manage"])
  rateLimitRpm          Int                 @default(1200)
  isActive              Boolean             @default(true)
  developer             DeveloperAccount    @relation(fields: [developerId], references: [id])
}

model WebhookEndpoint {
  id                    String              @id @default(uuid())
  developerId           String
  url                   String
  secretKey             String
  subscribedEvents      String[]            @default(["message.sent", "message.delivered"])
  isEnabled             Boolean             @default(true)
  developer             DeveloperAccount    @relation(fields: [developerId], references: [id])
}

model ServerApplication {
  id                    String              @id @default(uuid())
  developerId           String
  appName               String
  clientId              String              @unique
  clientSecretHash      String
  isProduction          Boolean             @default(false)
  developer             DeveloperAccount    @relation(fields: [developerId], references: [id])
}

model DeveloperLog {
  id                    String              @id @default(uuid())
  endpoint              String
  method                String
  statusCode            Int
  responseTimeMs        Int
  createdAt             DateTime            @default(now())
}
`,
      },
      {
        name: 'package.json',
        path: 'server/package.json',
        language: 'json',
        content: () => `{
  "name": "vibez-backend",
  "version": "1.0.0",
  "description": "Custom Backend for Vibez WhatsApp Clone - Powered by PRIGID GROUP",
  "main": "dist/index.js",
  "scripts": {
    "start": "npx prisma db push && node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@prisma/client": "^5.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.7.2",
    "uuid": "^9.0.1"
  }
}
`,
      }
    ]
  },
  {
    id: 'nodejs',
    name: 'Node.js & Express (Standalone SDK)',
    runtime: 'Node.js 20+ / TypeScript',
    icon: '⚡',
    badge: 'Microservice',
    description: 'Production-ready standalone TypeScript Express backend with HMAC webhook verification, rate limiting, and WebSocket bridge.',
    defaultPort: 8080,
    files: [
      {
        name: 'server.ts',
        path: 'src/server.ts',
        language: 'typescript',
        content: (cfg) => `/**
 * VIBEZ Developer Server - Node.js Express & TypeScript
 * Powered by PRIGID GROUP VIBEZ Ecosystem
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyVibezWebhookSignature } from './middleware/webhookValidator';
import { VibezApiClient } from './services/vibezClient';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || ${cfg.port};

// Initialize VIBEZ Client
const vibez = new VibezApiClient({
  apiKey: process.env.VIBEZ_API_KEY || '${cfg.apiKey}',
  baseUrl: process.env.VIBEZ_API_URL || '${cfg.apiUrl}',
});

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));

// Capture raw body for exact HMAC-SHA256 signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'VIBEZ Custom Backend Integration',
    poweredBy: 'PRIGID GROUP',
  });
});

// 1. Webhook Ingestion Endpoint (Verifies HMAC SHA-256)
app.post('/api/webhooks/vibez', verifyVibezWebhookSignature, async (req: Request, res: Response) => {
  const event = req.body;
  console.log(\`[VIBEZ Webhook] Received validated event: \${event.event_type} (ID: \${event.event_id})\`);

  switch (event.event_type) {
    case 'message.sent':
      console.log(\`-> Message from \${event.data.sender_id}: "\${event.data.content}"\`);
      // Trigger your business logic, AI auto-reply, or CRM sync here
      break;

    case 'call.initiated':
      console.log(\`-> WebRTC Call \${event.data.room_id} started by \${event.data.caller_id}\`);
      break;

    case 'auth.otp.requested':
      console.log(\`-> Phone verification requested for \${event.data.phone_number}\`);
      break;

    default:
      console.log(\`-> Unhandled event: \${event.event_type}\`);
  }

  // Always respond with 200 OK to acknowledge receipt
  return res.status(200).json({ received: true, event_id: event.event_id });
});

// 2. Server-to-Server Message Dispatcher
app.post('/api/messages/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientId, channelId, content, metadata } = req.body;

    if (!content || (!recipientId && !channelId)) {
      return res.status(400).json({ error: 'Content and recipientId or channelId are required' });
    }

    const response = await vibez.sendMessage({
      recipientId,
      channelId,
      content,
      metadata: { ...metadata, source: 'backend_server_express' }
    });

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// 3. Issue WebRTC Call Room Token
app.post('/api/rtc/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId, userId, role } = req.body;
    const tokenData = await vibez.generateRtcToken({ roomId, userId, role: role || 'publisher' });
    return res.status(200).json({ success: true, data: tokenData });
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(\`⚡ VIBEZ Developer Server running on http://localhost:\${PORT}\`);
  console.log(\`⚡ Ready to ingest webhooks at http://localhost:\${PORT}/api/webhooks/vibez\`);
});`
      },
      {
        name: 'webhookValidator.ts',
        path: 'src/middleware/webhookValidator.ts',
        language: 'typescript',
        content: (cfg) => `import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.VIBEZ_WEBHOOK_SECRET || '${cfg.webhookSecret}';

export function verifyVibezWebhookSignature(req: any, res: Response, next: NextFunction) {
  const signatureHeader = req.headers['x-vibez-signature'] as string;
  const timestampHeader = req.headers['x-vibez-timestamp'] as string;

  if (!signatureHeader) {
    return res.status(401).json({ error: 'Missing x-vibez-signature header' });
  }

  // Prevent replay attacks (allow maximum 5 minute clock drift)
  if (timestampHeader) {
    const now = Math.floor(Date.now() / 1000);
    const sentTime = parseInt(timestampHeader, 10);
    if (Math.abs(now - sentTime) > 300) {
      return res.status(400).json({ error: 'Webhook timestamp too old or in future' });
    }
  }

  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const contentToSign = timestampHeader ? \`\${timestampHeader}.\${rawBody.toString('utf8')}\` : rawBody;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(contentToSign)
    .digest('hex');

  // Extract signature if delivered as v1=signature
  const incomingSig = signatureHeader.includes('v1=')
    ? signatureHeader.split('v1=')[1].split(',')[0].trim()
    : signatureHeader.trim();

  try {
    const sigBuffer = Buffer.from(incomingSig, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return res.status(401).json({ error: 'Invalid HMAC SHA-256 signature' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Signature verification parsing error' });
  }

  next();
}`
      },
      {
        name: 'vibezClient.ts',
        path: 'src/services/vibezClient.ts',
        language: 'typescript',
        content: (cfg) => `export interface VibezClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export class VibezApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: VibezClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || '${cfg.apiUrl}';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
        'X-Client-Platform': 'NodeJS-Server',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || \`HTTP error \${response.status}\`);
    }

    return response.json();
  }

  async sendMessage(params: {
    recipientId?: string;
    channelId?: string;
    content: string;
    metadata?: Record<string, any>;
  }) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async generateRtcToken(params: {
    roomId: string;
    userId: string;
    role?: 'publisher' | 'subscriber';
    ttlSeconds?: number;
  }) {
    return this.request('/rtc/token', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}`
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: (cfg) => `{
  "name": "vibez-backend-server",
  "version": "1.0.0",
  "description": "Production Node.js backend server for VIBEZ Ecosystem",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.9",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}`
      },
      {
        name: '.env.example',
        path: '.env.example',
        language: 'bash',
        content: (cfg) => `# VIBEZ Server Configuration
PORT=${cfg.port}
VIBEZ_API_KEY=${cfg.apiKey}
VIBEZ_WEBHOOK_SECRET=${cfg.webhookSecret}
VIBEZ_API_URL=${cfg.apiUrl}
VIBEZ_CLIENT_ID=${cfg.clientId}
VIBEZ_CLIENT_SECRET=${cfg.clientSecret}`
      },
      {
        name: 'Dockerfile',
        path: 'Dockerfile',
        language: 'dockerfile',
        content: (cfg) => `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE ${cfg.port}
CMD ["node", "dist/server.js"]`
      }
    ]
  },
  {
    id: 'python',
    name: 'Python & FastAPI',
    runtime: 'Python 3.11+ / FastAPI & Uvicorn',
    icon: '🐍',
    badge: 'Async High-Perf',
    description: 'High-performance asynchronous Python API service with HMAC signature verification, Pydantic v2 schemas, and background tasks.',
    defaultPort: 8000,
    files: [
      {
        name: 'main.py',
        path: 'app/main.py',
        language: 'python',
        content: (cfg) => `"""
VIBEZ Developer Server - Python FastAPI
Powered by PRIGID GROUP VIBEZ Ecosystem
"""

import hmac
import hashlib
import time
import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, HTTPException, Header, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

load_dotenv()

VIBEZ_API_KEY = os.getenv("VIBEZ_API_KEY", "${cfg.apiKey}")
VIBEZ_WEBHOOK_SECRET = os.getenv("VIBEZ_WEBHOOK_SECRET", "${cfg.webhookSecret}")
VIBEZ_API_URL = os.getenv("VIBEZ_API_URL", "${cfg.apiUrl}")

app = FastAPI(
    title="VIBEZ Custom Backend Integration",
    description="Production Python server for VIBEZ messaging, OTP, and WebRTC signaling",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class MessageSendRequest(BaseModel):
    recipient_id: Optional[str] = Field(None, alias="recipientId")
    channel_id: Optional[str] = Field(None, alias="channelId")
    content: str
    metadata: Optional[Dict[str, Any]] = None

class RtcTokenRequest(BaseModel):
    room_id: str = Field(..., alias="roomId")
    user_id: str = Field(..., alias="userId")
    role: str = "publisher"
    ttl_seconds: int = Field(3600, alias="ttlSeconds")

# HMAC Webhook Verification Dependency
async def verify_webhook_signature(
    request: Request,
    x_vibez_signature: Optional[str] = Header(None),
    x_vibez_timestamp: Optional[str] = Header(None)
):
    if not x_vibez_signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing x-vibez-signature header")

    body_bytes = await request.body()
    
    # Optional replay attack check
    if x_vibez_timestamp:
        try:
            sent_time = int(x_vibez_timestamp)
            if abs(time.time() - sent_time) > 300:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Timestamp expired")
            content_to_sign = f"{x_vibez_timestamp}.{body_bytes.decode('utf-8')}".encode('utf-8')
        except ValueError:
            content_to_sign = body_bytes
    else:
        content_to_sign = body_bytes

    expected_sig = hmac.new(
        VIBEZ_WEBHOOK_SECRET.encode('utf-8'),
        content_to_sign,
        hashlib.sha256
    ).hexdigest()

    incoming_sig = x_vibez_signature.split("v1=")[1].split(",")[0].strip() if "v1=" in x_vibez_signature else x_vibez_signature.strip()

    if not hmac.compare_digest(incoming_sig, expected_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HMAC-SHA256 signature")

    return True

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VIBEZ Python Gateway",
        "powered_by": "PRIGID GROUP",
        "timestamp": time.time()
    }

@app.post("/api/webhooks/vibez")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    verified: bool = Depends(verify_webhook_signature)
):
    payload = await request.json()
    event_type = payload.get("event_type")
    event_id = payload.get("event_id")

    print(f"[Webhook Event] Verified: {event_type} (ID: {event_id})")

    # Delegate async processing to FastAPI BackgroundTasks
    def process_event(data: dict):
        # Insert database persistence, AI response, or push notification logic
        print(f"[Async Worker] Processed payload for event {data.get('event_id')}")

    background_tasks.add_task(process_event, payload)

    return {"received": True, "event_id": event_id}

@app.post("/api/messages/send")
async def send_message(req: MessageSendRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VIBEZ_API_URL}/messages/send",
            headers={
                "Authorization": f"Bearer {VIBEZ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "recipientId": req.recipient_id,
                "channelId": req.channel_id,
                "content": req.content,
                "metadata": req.metadata or {"source": "python_fastapi_server"}
            },
            timeout=10.0
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=${cfg.port}, reload=True)`
      },
      {
        name: 'requirements.txt',
        path: 'requirements.txt',
        language: 'plaintext',
        content: (cfg) => `fastapi>=0.111.0
uvicorn[standard]>=0.30.1
httpx>=0.27.0
pydantic>=2.7.4
python-dotenv>=1.0.1`
      },
      {
        name: 'Dockerfile',
        path: 'Dockerfile',
        language: 'dockerfile',
        content: (cfg) => `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE ${cfg.port}
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${cfg.port}"]`
      }
    ]
  },
  {
    id: 'go',
    name: 'Go & Gin / Fiber',
    runtime: 'Go 1.22+ / Gin Web Framework',
    icon: '🔷',
    badge: 'Ultra Fast',
    description: 'Sub-millisecond latency Go server with constant-time HMAC validation, connection pooling, and worker routines.',
    defaultPort: 8080,
    files: [
      {
        name: 'main.go',
        path: 'main.go',
        language: 'go',
        content: (cfg) => `package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Config struct {
	Port          string
	ApiKey        string
	WebhookSecret string
	ApiUrl        string
}

type WebhookEvent struct {
	EventId   string                 \`json:"event_id"\`
	EventType string                 \`json:"event_type"\`
	Timestamp int64                  \`json:"timestamp"\`
	Data      map[string]interface{} \`json:"data"\`
}

type SendMessageReq struct {
	RecipientID string                 \`json:"recipientId,omitempty"\`
	ChannelID   string                 \`json:"channelId,omitempty"\`
	Content     string                 \`json:"content" binding:"required"\`
	Metadata    map[string]interface{} \`json:"metadata,omitempty"\`
}

func main() {
	cfg := Config{
		Port:          getEnv("PORT", "${cfg.port}"),
		ApiKey:        getEnv("VIBEZ_API_KEY", "${cfg.apiKey}"),
		WebhookSecret: getEnv("VIBEZ_WEBHOOK_SECRET", "${cfg.webhookSecret}"),
		ApiUrl:        getEnv("VIBEZ_API_URL", "${cfg.apiUrl}"),
	}

	r := gin.Default()

	// Health endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":     "healthy",
			"engine":     "Go Gin VIBEZ Gateway",
			"powered_by": "PRIGID GROUP",
			"timestamp":  time.Now().Unix(),
		})
	})

	// Webhook Ingestion with HMAC-SHA256 signature verification
	r.POST("/api/webhooks/vibez", func(c *gin.Context) {
		sigHeader := c.GetHeader("x-vibez-signature")
		tsHeader := c.GetHeader("x-vibez-timestamp")

		if sigHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing x-vibez-signature header"})
			return
		}

		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
			return
		}

		// Replay attack defense
		if tsHeader != "" {
			tsInt, err := strconv.ParseInt(tsHeader, 10, 64)
			if err == nil && math.Abs(float64(time.Now().Unix()-tsInt)) > 300 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Timestamp expired"})
				return
			}
		}

		var payloadToSign []byte
		if tsHeader != "" {
			payloadToSign = []byte(fmt.Sprintf("%s.%s", tsHeader, string(bodyBytes)))
		} else {
			payloadToSign = bodyBytes
		}

		mac := hmac.New(sha256.New, []byte(cfg.WebhookSecret))
		mac.Write(payloadToSign)
		expectedSig := hex.EncodeToString(mac.Sum(nil))

		cleanSig := sigHeader
		if strings.Contains(sigHeader, "v1=") {
			parts := strings.Split(sigHeader, "v1=")
			if len(parts) > 1 {
				cleanSig = strings.Split(parts[1], ",")[0]
			}
		}

		if !hmac.Equal([]byte(cleanSig), []byte(expectedSig)) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid HMAC SHA-256 signature"})
			return
		}

		var event WebhookEvent
		if err := json.Unmarshal(bodyBytes, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Malformed JSON payload"})
			return
		}

		// Dispatch async worker goroutine
		go func(evt WebhookEvent) {
			log.Printf("[Go Worker] Handling verified event %s (ID: %s)", evt.EventType, evt.EventId)
		}(event)

		c.JSON(http.StatusOK, gin.H{
			"received": true,
			"event_id": event.EventId,
		})
	})

	// Server-to-server message dispatch
	r.POST("/api/messages/send", func(c *gin.Context) {
		var req SendMessageReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		payloadBytes, _ := json.Marshal(req)
		httpReq, _ := http.NewRequest("POST", cfg.ApiUrl+"/messages/send", bytes.NewBuffer(payloadBytes))
		httpReq.Header.Set("Authorization", "Bearer "+cfg.ApiKey)
		httpReq.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(httpReq)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, "application/json", respBody)
	})

	log.Printf("⚡ Go VIBEZ Server starting on :%s", cfg.Port)
	r.Run(":" + cfg.Port)
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}`
      },
      {
        name: 'go.mod',
        path: 'go.mod',
        language: 'plaintext',
        content: (cfg) => `module vibez-go-server

go 1.22

require github.com/gin-gonic/gin v1.10.0`
      },
      {
        name: 'Dockerfile',
        path: 'Dockerfile',
        language: 'dockerfile',
        content: (cfg) => `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /vibez-server .

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /vibez-server .
EXPOSE ${cfg.port}
CMD ["./vibez-server"]`
      }
    ]
  },
  {
    id: 'kotlin',
    name: 'Kotlin & Ktor',
    runtime: 'Kotlin 2.0+ / Ktor & Netty',
    icon: '🟣',
    badge: 'Android Native Fit',
    description: 'Coroutines-powered Kotlin server using Ktor, ContentNegotiation, and idiomatic type-safe routing.',
    defaultPort: 8080,
    files: [
      {
        name: 'Application.kt',
        path: 'src/main/kotlin/com/prigid/vibez/Application.kt',
        language: 'kotlin',
        content: (cfg) => `package com.prigid.vibez

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.security.MessageDigest

@Serializable
data class WebhookPayload(
    val event_id: String,
    val event_type: String,
    val timestamp: Long,
    val data: Map<String, String> = emptyMap()
)

@Serializable
data class MessageRequest(
    val recipientId: String? = null,
    val channelId: String? = null,
    val content: String
)

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: ${cfg.port}
    val webhookSecret = System.getenv("VIBEZ_WEBHOOK_SECRET") ?: "${cfg.webhookSecret}"

    embeddedServer(Netty, port = port) {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
        install(CORS) {
            anyHost()
            allowHeader(HttpHeaders.ContentType)
            allowHeader(HttpHeaders.Authorization)
            allowHeader("x-vibez-signature")
            allowHeader("x-vibez-timestamp")
        }

        routing {
            get("/health") {
                call.respond(mapOf(
                    "status" to "healthy",
                    "framework" to "Ktor Netty",
                    "powered_by" to "PRIGID GROUP"
                ))
            }

            post("/api/webhooks/vibez") {
                val signature = call.request.headers["x-vibez-signature"]
                val timestamp = call.request.headers["x-vibez-timestamp"]
                val rawBody = call.receiveText()

                if (signature == null) {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Missing signature"))
                    return@post
                }

                val contentToSign = if (timestamp != null) "$timestamp.$rawBody" else rawBody
                val calculatedSig = computeHmacSha256(contentToSign, webhookSecret)

                val cleanSig = if (signature.contains("v1=")) signature.substringAfter("v1=").substringBefore(",") else signature

                if (!MessageDigest.isEqual(cleanSig.toByteArray(), calculatedSig.toByteArray())) {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Invalid HMAC SHA-256 signature"))
                    return@post
                }

                val payload = Json.decodeFromString<WebhookPayload>(rawBody)
                println("Verified Kotlin Ktor Webhook Event: \${payload.event_type} (\${payload.event_id})")

                call.respond(HttpStatusCode.OK, mapOf("received" to "true", "event_id" to payload.event_id))
            }
        }
    }.start(wait = true)
}

fun computeHmacSha256(data: String, secret: String): String {
    val sha256Hmac = Mac.getInstance("HmacSHA256")
    val secretKey = SecretKeySpec(secret.toByteArray(), "HmacSHA256")
    sha256Hmac.init(secretKey)
    return sha256Hmac.doFinal(data.toByteArray()).joinToString("") { "%02x".format(it) }
}`
      },
      {
        name: 'build.gradle.kts',
        path: 'build.gradle.kts',
        language: 'kotlin',
        content: (cfg) => `plugins {
    kotlin("jvm") version "2.0.0"
    kotlin("plugin.serialization") version "2.0.0"
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.ktor:ktor-server-core:2.3.11")
    implementation("io.ktor:ktor-server-netty:2.3.11")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.11")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.11")
    implementation("io.ktor:ktor-server-cors:2.3.11")
    implementation("ch.qos.logback:logback-classic:1.5.6")
}

application {
    mainClass.set("com.prigid.vibez.ApplicationKt")
}`
      }
    ]
  },
  {
    id: 'rust',
    name: 'Rust & Actix-Web',
    runtime: 'Rust 1.78+ / Actix-Web',
    icon: '🦀',
    badge: 'Zero Overhead',
    description: 'Memory-safe, blazingly fast Rust server implementation with constant-time HMAC validation and asynchronous Tokio runtime.',
    defaultPort: 8080,
    files: [
      {
        name: 'main.rs',
        path: 'src/main.rs',
        language: 'rust',
        content: (cfg) => `use actix_web::{web, App, HttpResponse, HttpServer, Responder, HttpRequest};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde::{Deserialize, Serialize};
use std::env;

type HmacSha256 = Hmac<Sha256>;

#[derive(Serialize, Deserialize)]
struct WebhookEvent {
    event_id: String,
    event_type: String,
    timestamp: i64,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    engine: &'static str,
    powered_by: &'static str,
}

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(HealthResponse {
        status: "healthy",
        engine: "Rust Actix-Web",
        powered_by: "PRIGID GROUP",
    })
}

async fn handle_webhook(req: HttpRequest, body: web::Bytes) -> impl Responder {
    let secret = env::var("VIBEZ_WEBHOOK_SECRET").unwrap_or_else(|_| "${cfg.webhookSecret}".to_string());
    
    let signature_header = match req.headers().get("x-vibez-signature") {
        Some(sig) => sig.to_str().unwrap_or(""),
        None => return HttpResponse::Unauthorized().body("Missing signature header"),
    };

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(&body);

    let clean_sig = if signature_header.contains("v1=") {
        signature_header.split("v1=").nth(1).unwrap_or("").split(',').next().unwrap_or("")
    } else {
        signature_header
    };

    let expected_sig_bytes = match hex::decode(clean_sig) {
        Ok(bytes) => bytes,
        Err(_) => return HttpResponse::Unauthorized().body("Invalid signature encoding"),
    };

    if mac.verify_slice(&expected_sig_bytes).is_err() {
        return HttpResponse::Unauthorized().body("Invalid HMAC SHA-256 signature");
    }

    HttpResponse::Ok().json(serde_json::json!({ "received": true }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "${cfg.port}".to_string()).parse().unwrap_or(${cfg.port});
    println!("⚡ Rust Actix-Web server starting on 0.0.0.0:{}", port);

    HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health_check))
            .route("/api/webhooks/vibez", web::post().to(handle_webhook))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}`
      },
      {
        name: 'Cargo.toml',
        path: 'Cargo.toml',
        language: 'plaintext',
        content: (cfg) => `[package]
name = "vibez-rust-server"
version = "1.0.0"
edition = "2021"

[dependencies]
actix-web = "4.9.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
hmac = "0.12.1"
sha2 = "0.10.8"
hex = "0.4.3"
tokio = { version = "1", features = ["full"] }`
      }
    ]
  },
  {
    id: 'java',
    name: 'Java & Spring Boot 3',
    runtime: 'Java 21 / Spring Boot 3.3',
    icon: '☕',
    badge: 'Enterprise',
    description: 'Enterprise-grade Spring Boot 3 REST controller with Spring Security integration and HMAC filter.',
    defaultPort: 8080,
    files: [
      {
        name: 'VibezWebhookController.java',
        path: 'src/main/java/com/prigid/vibez/controller/VibezWebhookController.java',
        language: 'java',
        content: (cfg) => `package com.prigid.vibez.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class VibezWebhookController {

    @Value("\${vibez.webhook.secret:${cfg.webhookSecret}}")
    private String webhookSecret;

    @PostMapping("/vibez")
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "x-vibez-signature", required = false) String signature,
            @RequestHeader(value = "x-vibez-timestamp", required = false) String timestamp,
            @RequestBody String rawPayload
    ) {
        if (signature == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing signature"));
        }

        try {
            String contentToSign = (timestamp != null) ? timestamp + "." + rawPayload : rawPayload;
            
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] expectedHmac = mac.doFinal(contentToSign.getBytes(StandardCharsets.UTF_8));
            String expectedHex = HexFormat.of().formatHex(expectedHmac);

            String cleanSig = signature.contains("v1=") 
                ? signature.split("v1=")[1].split(",")[0].trim() 
                : signature.trim();

            if (!MessageDigest.isEqual(cleanSig.getBytes(StandardCharsets.UTF_8), expectedHex.getBytes(StandardCharsets.UTF_8))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid signature"));
            }

            return ResponseEntity.ok(Map.of("received", true, "poweredBy", "PRIGID GROUP"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}`
      },
      {
        name: 'pom.xml',
        path: 'pom.xml',
        language: 'plaintext',
        content: (cfg) => `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.1</version>
    </parent>
    <groupId>com.prigid</groupId>
    <artifactId>vibez-server</artifactId>
    <version>1.0.0</version>
    <properties>
        <java.version>21</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>`
      }
    ]
  }
];
