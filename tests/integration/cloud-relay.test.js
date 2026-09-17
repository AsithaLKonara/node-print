const http = require('http');
const { spawn } = require('child_process');

const CLOUD_PORT = 9999;
let jobPolled = false;

const mockCloudApp = http.createServer((req, res) => {
  if (req.url === '/api/jobs' && req.method === 'GET') {
    console.log('[Mock Cloud] Received poll request');
    jobPolled = true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jobId: "job-cloud-001",
      printer: "MOCK_PRINTER",
      payload: Buffer.from("Hello Cloud").toString('base64')
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const mockServer = mockCloudApp.listen(CLOUD_PORT, () => {
  console.log(`[Mock Cloud] Running on port ${CLOUD_PORT}`);
  
  // Start the Bridge process with Cloud Polling enabled
  const env = {
    ...process.env,
    TS_NODE_PROJECT: './apps/bridge/tsconfig.json'
  };
  
  // Create a temporary config file
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(process.cwd(), 'node-print.config.js');
  fs.writeFileSync(configPath, `
    module.exports = {
      port: 18181,
      cloudPolling: {
        enabled: true,
        endpoint: 'http://127.0.0.1:${CLOUD_PORT}/api/jobs',
        token: 'test-token',
        intervalMs: 1000
      }
    };
  `);

  const bridge = spawn('npx', ['tsx', 'apps/bridge/src/index.ts', 'start'], { env });

  bridge.stdout.on('data', (data) => {
    const out = data.toString();
    console.log(`[Bridge Output] ${out.trim()}`);
    if (out.includes('Received job job-cloud-001')) {
      console.log('✅ TEST PASSED: Bridge successfully polled the cloud and received the job!');
      fs.unlinkSync(configPath);
      bridge.kill();
      mockServer.close();
      process.exit(0);
    }
  });

  bridge.stderr.on('data', (data) => {
    console.error(`[Bridge Error] ${data.toString()}`);
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    if (!jobPolled) {
      console.error('❌ TEST FAILED: Bridge never polled the cloud endpoint.');
    } else {
      console.error('❌ TEST FAILED: Bridge polled but did not process the job correctly.');
    }
    fs.unlinkSync(configPath);
    bridge.kill();
    mockServer.close();
    process.exit(1);
  }, 10000);
});
