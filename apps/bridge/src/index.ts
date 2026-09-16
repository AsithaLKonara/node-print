import express from 'express';
import cors from 'cors';
import { getPrinters } from './printers';
import { printRawData } from './printJob';
import { GetPrintersResponse, PrintActionResponse } from '@asitha/protocol';

const app = express();
const PORT = process.env.PORT || 18181;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
      error: {
        code: 'PRINTER_DISCOVERY_ERROR',
        message: error.message
      }
    });
  }
});

app.post('/print', async (req, res) => {
  try {
    const { printer, type, data } = req.body;
    
    if (!printer) {
      return res.status(400).json({
        version: 1,
        requestId: req.headers['x-request-id'] || Date.now().toString(),
        error: { code: 'INVALID_REQUEST', message: 'printer name is required' }
      });
    }

    if (type === 'raw') {
      if (!data) {
        return res.status(400).json({
          version: 1,
          requestId: req.headers['x-request-id'] || Date.now().toString(),
          error: { code: 'INVALID_REQUEST', message: 'data is required for raw printing (base64 string)' }
        });
      }

      const buffer = Buffer.from(data, 'base64');
      await printRawData(printer, buffer);
      
      const response: PrintActionResponse = {
        version: 1,
        requestId: req.headers['x-request-id'] as string || Date.now().toString(),
        data: {
          jobId: `job_${Date.now()}`,
          status: 'completed'
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
      error: {
        code: 'PRINT_FAILED',
        message: error.message
      }
    });
  }
});

// Export app for testing, or listen if called directly
if (require.main === module || process.argv.includes('start')) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Bridge server listening on http://127.0.0.1:${PORT}`);
  });
}

export default app;
