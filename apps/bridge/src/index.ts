import express from 'express';
import cors from 'cors';
import { getPrinters } from './printers';
import { printRawData } from './printJob';
import { jobManager } from './JobManager';
import { GetPrintersResponse, PrintActionResponse } from '@asitha/protocol';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 18181;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || ''; 
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; 

const routes = new Map<string, string>();

app.use(cors({
  origin: ALLOWED_ORIGIN === '*' ? '*' : ALLOWED_ORIGIN.split(',')
}));
app.use(express.json());

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!ACCESS_TOKEN) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ACCESS_TOKEN}`) {
    return res.status(401).json({
      version: 1,
      requestId: req.headers['x-request-id'] || Date.now().toString(),
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing access token' }
    });
  }
  next();
};

app.use(authMiddleware);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/printers', async (req, res) => {
  try {
    const printers = await getPrinters();
    const response: GetPrintersResponse = {
      version: 1,
      requestId: req.headers['x-request-id'] as string || Date.now().toString(),
      data: { printers }
    };
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      version: 1,
      requestId: req.headers['x-request-id'] as string || Date.now().toString(),
      error: { code: 'PRINTER_DISCOVERY_ERROR', message: error.message }
    });
  }
});

app.get('/routes', (req, res) => {
  res.json({
    version: 1,
    requestId: req.headers['x-request-id'] as string || Date.now().toString(),
    data: { routes: Object.fromEntries(routes) }
  });
});

app.post('/routes', (req, res) => {
  const { route, printer } = req.body;
  if (!route || !printer) {
    return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'route and printer are required' } });
  }
  routes.set(route, printer);
  res.json({ data: { success: true } });
});

app.post('/print', async (req, res) => {
  try {
    const { printer, route, type, data } = req.body;
    
    let targetPrinter = printer;
    if (route) {
      targetPrinter = routes.get(route);
      if (!targetPrinter) {
        return res.status(404).json({
          version: 1,
          requestId: req.headers['x-request-id'] || Date.now().toString(),
          error: { code: 'ROUTE_NOT_FOUND', message: `Route '${route}' is not mapped to any printer.` }
        });
      }
    }

    if (!targetPrinter) {
      return res.status(400).json({
        version: 1,
        requestId: req.headers['x-request-id'] || Date.now().toString(),
        error: { code: 'INVALID_REQUEST', message: 'printer name or route is required' }
      });
    }

    if (type === 'raw' || type === 'escpos') {
      if (!data) {
        return res.status(400).json({
          version: 1,
          requestId: req.headers['x-request-id'] || Date.now().toString(),
          error: { code: 'INVALID_REQUEST', message: `data is required for ${type} printing (base64 string)` }
        });
      }

      const buffer = Buffer.from(data, 'base64');
      const job = jobManager.enqueue(targetPrinter, buffer);
      
      const response: PrintActionResponse = {
        version: 1,
        requestId: req.headers['x-request-id'] as string || Date.now().toString(),
        data: {
          jobId: job.id,
          status: job.status
        }
      };
      return res.json(response);
    }

    return res.status(501).json({
      version: 1,
      requestId: req.headers['x-request-id'] || Date.now().toString(),
      error: { code: 'NOT_IMPLEMENTED', message: `Type ${type} is not supported yet.` }
    });

  } catch (error: any) {
    res.status(500).json({
      version: 1,
      requestId: req.headers['x-request-id'] as string || Date.now().toString(),
      error: { code: 'PRINT_FAILED', message: error.message }
    });
  }
});

app.get('/jobs/:id', (req, res) => {
  const job = jobManager.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({
      version: 1,
      requestId: req.headers['x-request-id'] as string || Date.now().toString(),
      error: { code: 'JOB_NOT_FOUND', message: 'Job not found' }
    });
  }
  return res.json({
    version: 1,
    requestId: req.headers['x-request-id'] as string || Date.now().toString(),
    data: { job }
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', message: 'Bridge WebSocket Connected' }));
});

['job.queued', 'job.processing', 'job.completed', 'job.failed', 'job.retrying'].forEach(event => {
  jobManager.on(event, (job) => {
    const payload = JSON.stringify({ type: event, data: job });
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    });
  });
});

if (require.main === module || process.argv.includes('start')) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Bridge server listening on http://127.0.0.1:${PORT}`);
  });
}

export default server;
