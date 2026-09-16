import { Printer, PrintJob, PrintRequest } from "@asitha/types";

export interface ApiRequest<T> {
  version: 1;
  requestId: string;
  action: string;
  payload: T;
}

export interface ApiResponse<T> {
  version: 1;
  requestId: string;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type PrintActionRequest = ApiRequest<PrintRequest>;

export interface PrintActionResponseData {
  jobId: string;
  status: PrintJob["status"];
}

export type PrintActionResponse = ApiResponse<PrintActionResponseData>;

export type GetPrintersRequest = ApiRequest<void>;
export type GetPrintersResponse = ApiResponse<{ printers: Printer[] }>;

export type GetJobRequest = ApiRequest<{ jobId: string }>;
export type GetJobResponse = ApiResponse<{ job: PrintJob }>;
