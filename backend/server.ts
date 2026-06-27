/**
 * NeoProxy Genesis Server
 * 
 * Main entry point for the backend runtime.
 * Provides:
 * - REST API for capabilities and events
 * - WebSocket for real-time updates
 * - Health monitoring endpoints
 * 
 * This server is designed to be replaced/extended by Qwen
 * when implementing real capability execution.
 */

import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { registry } from './genesis/registry';
import { eventBus } from './genesis/eventBus';
import { resolver, ExecutionRequest } from './genesis/resolver';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws) => {
  console.log('[Server] WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('[Server] WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[Server] WebSocket error:', error);
    clients.delete(ws);
  });
});

// Subscribe to all events and broadcast to WebSocket clients
eventBus.subscribe('*', (event) => {
  broadcast(event);
});

function broadcast(data: any): void {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// =====================================================
// REST API Endpoints
// =====================================================

/**
 * GET /capabilities
 * Returns all registered capabilities
 */
app.get('/capabilities', (_req: Request, res: Response) => {
  res.json(registry.getAll());
});

/**
 * GET /capabilities/:name
 * Returns a specific capability
 */
app.get('/capabilities/:name', (req: Request, res: Response) => {
  const capability = registry.get(req.params.name);
  if (!capability) {
    return res.status(404).json({ error: `Capability ${req.params.name} not found` });
  }
  res.json(capability);
});

/**
 * GET /events
 * Returns recent events
 */
app.get('/events', (_req: Request, res: Response) => {
  res.json(eventBus.getRecent(100));
});

/**
 * GET /events/stats
 * Returns event statistics
 */
app.get('/events/stats', (_req: Request, res: Response) => {
  res.json(eventBus.getStats());
});

/**
 * POST /event
 * Emit a custom event
 */
app.post('/event', (req: Request, res: Response) => {
  const { type, source, payload, capability } = req.body;

  if (!type || !source) {
    return res.status(400).json({ error: 'Event must have type and source' });
  }

  const event = eventBus.emit({
    type,
    source,
    payload: payload || {},
    capability
  });

  broadcast(event);
  res.json(event);
});

/**
 * GET /resolve/:capability
 * Resolve a capability to find best provider
 * 
 * HOOK FOR QWEN: This endpoint uses the resolver
 */
app.get('/resolve/:capability', (req: Request, res: Response) => {
  const result = resolver.resolve(req.params.capability);
  
  if (result.status !== 'success') {
    return res.status(404).json(result);
  }

  res.json(result);
});

/**
 * POST /execute
 * Execute a capability
 * 
 * HOOK FOR QWEN: This endpoint uses the resolver execution
 */
app.post('/execute', async (req: Request, res: Response) => {
  try {
    const { capability, input, priority } = req.body as ExecutionRequest;

    if (!capability) {
      return res.status(400).json({ error: 'Capability name is required' });
    }

    const result = await resolver.execute({
      capability,
      input: input || {},
      priority: priority || 'normal'
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[Server] Execute error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      provider: 'none',
      latency: 0
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    capabilities: Object.keys(registry.getAll()).length,
    events: eventBus.getStats().total
  });
});

/**
 * GET /status
 * Full system status
 */
app.get('/status', (_req: Request, res: Response) => {
  const capabilities = registry.getAll();
  const eventStats = eventBus.getStats();

  res.json({
    runtime: 'NeoProxy Genesis v0.1',
    status: 'running',
    timestamp: Date.now(),
    uptime: process.uptime(),
    capabilities: {
      total: Object.keys(capabilities).length,
      names: Object.keys(capabilities)
    },
    events: eventStats,
    websocket: {
      connectedClients: clients.size
    }
  });
});

// =====================================================
// Server Startup
// =====================================================

server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         NeoProxy Genesis Runtime v0.1                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  HTTP Server:  http://localhost:${PORT}`.padEnd(60) + ' ║');
  console.log(`║  WebSocket:    ws://localhost:${PORT}`.padEnd(60) + ' ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Capabilities loaded:'.padEnd(60) + ' ║');
  
  Object.keys(registry.getAll()).forEach(cap => {
    console.log(`║    • ${cap}`.padEnd(60) + ' ║');
  });
  
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Ready for Qwen implementation                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received. Shutting down gracefully...');
  
  eventBus.emit({
    type: 'runtime.shutdown',
    source: 'server',
    payload: { reason: 'SIGTERM' }
  });

  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received. Shutting down gracefully...');
  
  eventBus.emit({
    type: 'runtime.shutdown',
    source: 'server',
    payload: { reason: 'SIGINT' }
  });

  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});
