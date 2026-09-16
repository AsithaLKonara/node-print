export type PrinterStatus = "online" | "offline" | "unknown";
export type PrinterType = "thermal" | "label" | "laser" | "inkjet" | "unknown";
export type PrinterConnection = "usb" | "network" | "system";
export interface Printer {
    id: string;
    name: string;
    status: PrinterStatus;
    type: PrinterType;
    connection: PrinterConnection;
    isDefault: boolean;
}
export type JobStatus = "queued" | "processing" | "printing" | "completed" | "failed" | "retrying";
export interface PrintJob {
    id: string;
    status: JobStatus;
    error?: string;
    createdAt: string;
    updatedAt: string;
}
export interface BasePrintRequest {
    printer?: string;
    route?: string;
    jobId?: string;
}
export interface EscPosPrintRequest extends BasePrintRequest {
    type: "escpos";
    data: string;
}
export interface RawPrintRequest extends BasePrintRequest {
    type: "raw";
    data: string;
}
export interface HtmlPrintRequest extends BasePrintRequest {
    type: "html";
    html: string;
    paper?: string | {
        width: string;
    };
}
export interface ImagePrintRequest extends BasePrintRequest {
    type: "image";
    data: string;
}
export type PrintRequest = EscPosPrintRequest | RawPrintRequest | HtmlPrintRequest | ImagePrintRequest;
