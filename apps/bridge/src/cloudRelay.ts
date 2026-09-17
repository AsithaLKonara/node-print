import { config } from './config';
import { jobManager } from './JobManager';

export class CloudRelay {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {}

  start() {
    if (!config.cloudPolling?.enabled || !config.cloudPolling.endpoint) {
      return;
    }
    console.log(`Starting Cloud Polling Relay for endpoint: ${config.cloudPolling.endpoint}`);
    this.timer = setInterval(() => this.poll(), config.cloudPolling.intervalMs || 5000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll() {
    if (this.isRunning || !config.cloudPolling) return;
    this.isRunning = true;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.cloudPolling.token) {
        headers['Authorization'] = `Bearer ${config.cloudPolling.token}`;
      }

      const res = await fetch(config.cloudPolling.endpoint, { headers });
      if (!res.ok) {
        if (res.status !== 404) {
          console.warn(`[Cloud Relay] Polling failed: HTTP ${res.status}`);
        }
        this.isRunning = false;
        return;
      }

      const data = await res.json();
      
      // Expected payload from Cloud:
      // {
      //   "jobId": "cloud-job-123",
      //   "printer": "Receipt_Printer",
      //   "payload": "base64encoded_escpos_data"
      // }
      
      if (data && data.jobId && data.printer && data.payload) {
        console.log(`[Cloud Relay] Received job ${data.jobId} for printer ${data.printer}`);
        const buffer = Buffer.from(data.payload, 'base64');
        const localJob = jobManager.enqueue(data.printer, buffer);
        
        // Optional: In a full production IoT relay, you would track the job status 
        // through JobManager events and push updates back to the cloud.
      }
    } catch (error: any) {
      console.warn(`[Cloud Relay] Error: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }
}

export const cloudRelay = new CloudRelay();
