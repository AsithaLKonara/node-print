import { PrintJob } from '@asitha/types';
import { printRawData } from './printJob';
import { EventEmitter } from 'events';
import { config } from './config';

export interface PrintTask {
  printerName: string;
  dataBuffer: Buffer;
  job: PrintJob;
  retries: number;
}

export class JobManager extends EventEmitter {
  private queue: PrintTask[] = [];
  private jobs: Map<string, PrintJob> = new Map();
  private processing: boolean = false;
  
  public config = {
    retriesLimit: config.queue.retries
  };

  createJob(): PrintJob {
    const job: PrintJob = {
      id: `job_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId: string): PrintJob | undefined {
    return this.jobs.get(jobId);
  }

  enqueue(printerName: string, dataBuffer: Buffer) {
    const job = this.createJob();
    this.queue.push({
      printerName,
      dataBuffer,
      job,
      retries: 0
    });
    
    // Start processing without awaiting
    this.processQueue().catch(console.error);
    return job;
  }

  private updateJobStatus(job: PrintJob, status: PrintJob['status'], error?: string) {
    job.status = status;
    job.updatedAt = new Date().toISOString();
    if (error) {
      job.error = error;
    }
    this.emit(`job.${status}`, job);
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;

      this.updateJobStatus(task.job, 'processing');

      try {
        await printRawData(task.printerName, task.dataBuffer);
        this.updateJobStatus(task.job, 'completed');
      } catch (err: any) {
        if (task.retries < this.config.retriesLimit) {
          task.retries += 1;
          this.updateJobStatus(task.job, 'retrying', err.message);
          
          // Delay before retry
          await new Promise(r => setTimeout(r, 2000));
          
          // Re-queue at the front
          this.queue.unshift(task);
        } else {
          this.updateJobStatus(task.job, 'failed', err.message);
        }
      }
    }

    this.processing = false;
  }
}

export const jobManager = new JobManager();
