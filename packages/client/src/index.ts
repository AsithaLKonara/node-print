import { Printer, PrintJob, PrintRequest } from '@asitha/types';
import { GetPrintersResponse, PrintActionResponse, GetJobResponse } from '@asitha/protocol';

export interface NodePrintConfig {
  url?: string;
  token?: string;
}

export type EventHandler = (data: any) => void;

export class NodePrintClient {
  private url: string;
  private token?: string;
  private ws: any = null;
  private listeners: Record<string, EventHandler[]> = {};

  constructor(config?: NodePrintConfig) {
    this.url = config?.url || 'http://127.0.0.1:18181';
    this.token = config?.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as any) || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.url}${path}`, {
      ...options,
      headers
    });

    const data: any = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `HTTP ${res.status}`);
    }

    return data as T;
  }

  public connect() {
    if (this.ws) return;

    const wsUrl = this.url.replace(/^http/, 'ws');
    
    // Check if WebSocket is defined (Browser / modern node)
    if (typeof WebSocket !== 'undefined') {
      this.ws = new WebSocket(wsUrl);
    } else {
      // Fallback for older Node environments (requires `ws` to be installed locally if used in old Node)
      const WS = require('ws');
      this.ws = new WS(wsUrl);
    }

    this.ws.onmessage = (event: any) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type && this.listeners[msg.type]) {
          this.listeners[msg.type].forEach(fn => fn(msg.data));
        }
      } catch (e) {
        // ignore
      }
    };
    
    this.ws.onclose = () => {
      this.ws = null;
      setTimeout(() => this.connect(), 5000); // Basic reconnect
    };
  }

  public on(event: string, handler: EventHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  public off(event: string, handler: EventHandler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  }

  public printers = {
    list: async (): Promise<Printer[]> => {
      const res = await this.request<GetPrintersResponse>('/printers');
      return res.data?.printers || [];
    }
  };

  public jobs = {
    get: async (id: string): Promise<PrintJob> => {
      const res = await this.request<GetJobResponse>(`/jobs/${id}`);
      return res.data?.job as PrintJob;
    }
  };

  public routes = {
    set: async (route: string, printer: string): Promise<void> => {
      await this.request<any>('/routes', {
        method: 'POST',
        body: JSON.stringify({ route, printer })
      });
    },
    list: async (): Promise<Record<string, string>> => {
      const res = await this.request<any>('/routes');
      return res.data?.routes || {};
    }
  };

  public cashDrawer = {
    open: async (options: { printer?: string, route?: string, pin?: 2 | 5 }): Promise<string> => {
      const res = await this.request<PrintActionResponse>('/cash-drawer', {
        method: 'POST',
        body: JSON.stringify(options)
      });
      return res.data?.jobId as string;
    }
  };

  public async print(req: PrintRequest): Promise<string> {
    const res = await this.request<PrintActionResponse>('/print', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    return res.data?.jobId as string;
  }
}
