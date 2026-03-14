// ============================================================
// Haul Command — Worker Entry Point (Fly.io)
// Health endpoint + worker orchestration
// ============================================================

import http from 'node:http';

const PORT = parseInt(process.env.PORT || '8080', 10);

// ── Health Server ──
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'hc-workers',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Webhook receiver for Trigger.dev, Traccar, etc.
  if (req.url === '/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log('[Worker] Webhook received:', payload.type || 'unknown');
        // Route to appropriate handler based on payload
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[HC-Workers] Running on port ${PORT}`);
  console.log(`[HC-Workers] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[HC-Workers] Ready for autonomous operations`);
});

// ── Graceful Shutdown ──
process.on('SIGTERM', () => {
  console.log('[HC-Workers] SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});
