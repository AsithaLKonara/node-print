export class NodePrintWebUSBClient {
  private device: USBDevice | null = null;
  private endpointNumber: number | null = null;

  /**
   * Request access to a USB receipt printer using the browser's WebUSB API.
   * This must be called in response to a user interaction (e.g. click).
   * 
   * Printer classCode is typically 7 (Printer).
   */
  public async requestDevice(): Promise<void> {
    if (!navigator.usb) {
      throw new Error("WebUSB API is not supported by this browser.");
    }
    
    // Receipt printers use classCode: 7
    this.device = await navigator.usb.requestDevice({ filters: [{ classCode: 7 }] });
  }

  /**
   * Connect to the previously requested or paired device.
   */
  public async connect(device?: USBDevice): Promise<void> {
    if (device) this.device = device;
    if (!this.device) throw new Error("No device selected. Call requestDevice() first.");

    await this.device.open();
    
    if (this.device.configuration === null) {
      await this.device.selectConfiguration(1);
    }
    
    await this.device.claimInterface(0);

    // Find the bulk OUT endpoint to send data to the printer
    const endpoints = this.device.configuration!.interfaces[0].alternates[0].endpoints;
    const outEndpoint = endpoints.find((e: any) => e.direction === 'out');
    
    if (!outEndpoint) {
      throw new Error("Could not find OUT endpoint on the printer.");
    }
    
    this.endpointNumber = outEndpoint.endpointNumber;
  }

  /**
   * Send raw ESC/POS buffer directly to the USB printer via WebUSB.
   */
  public async print(buffer: Buffer | Uint8Array): Promise<void> {
    if (!this.device || this.endpointNumber === null) {
      throw new Error("Printer is not connected. Call connect() first.");
    }

    const data = new Uint8Array(
      'buffer' in buffer ? buffer.buffer : buffer,
      'byteOffset' in buffer ? buffer.byteOffset : 0,
      buffer.length
    );
    
    const result = await this.device.transferOut(this.endpointNumber, data as any);
    
    if (result.status !== 'ok') {
      throw new Error(`Failed to print: transfer status ${result.status}`);
    }
  }

  /**
   * Disconnect the WebUSB printer and release the interface.
   */
  public async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.releaseInterface(0);
      await this.device.close();
      this.device = null;
      this.endpointNumber = null;
    }
  }

  /**
   * Utility to get previously paired devices without prompting the user.
   */
  public async getPairedDevices(): Promise<USBDevice[]> {
    if (!navigator.usb) return [];
    return await navigator.usb.getDevices();
  }
}
