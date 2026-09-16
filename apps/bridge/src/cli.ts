#!/usr/bin/env node

import { loadConfig } from './config';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

const config = loadConfig();
const url = `http://127.0.0.1:${config.port}`;
const headers = config.security.accessToken ? { Authorization: `Bearer ${config.security.accessToken}` } : {};

async function fetchApi(path: string) {
  const res = await fetch(`${url}${path}`, { headers });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

async function main() {
  if (command === 'start') {
    require('./index');
  } 
  else if (command === 'printers') {
    try {
      const json = await fetchApi('/printers');
      if (json.data?.printers?.length) {
        console.table(json.data.printers);
      } else {
        console.log("No printers found.");
      }
    } catch (e: any) {
      console.error(`[Error] Connecting to bridge server. Is it running on port ${config.port}?`, e.message);
    }
  }
  else if (command === 'status') {
    try {
      const json = await fetchApi('/health');
      console.log(`Bridge is RUNNING on ${url}`);
      console.log(`Status: ${json.status}`);
    } catch (e: any) {
      console.log(`Bridge is OFFLINE or unreachable on ${url}`);
    }
  }
  else if (command === 'routes') {
    try {
      const json = await fetchApi('/routes');
      if (Object.keys(json.data.routes).length > 0) {
        console.table(Object.entries(json.data.routes).map(([route, printer]) => ({ Route: route, Printer: printer })));
      } else {
        console.log("No routes configured.");
      }
    } catch (e: any) {
      console.error("[Error] Connecting to bridge server.", e.message);
    }
  }
  else if (command === 'doctor') {
    console.log('--- Node-Print Doctor ---');
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform} (${process.arch})`);
    
    console.log('\nChecking OS Printer Subsystem...');
    try {
      if (process.platform === 'win32') {
        execSync('powershell "Get-Printer | Select-Object Name"', { stdio: 'ignore' });
        console.log('Windows Print Spooler: OK');
      } else {
        execSync('lpstat -p', { stdio: 'ignore' });
        console.log('CUPS Subsystem: OK');
      }
    } catch (e) {
      console.log('OS Printer Subsystem: ERROR (Spooler might not be running)');
    }

    console.log('\nChecking Bridge Connection...');
    try {
      await fetchApi('/health');
      console.log('Bridge Status: RUNNING');
    } catch (e) {
      console.log('Bridge Status: OFFLINE');
      console.log(`Hint: Run 'node-print start' to start the bridge on port ${config.port}.`);
    }
  }
  else {
    console.log("Usage: node-print [start|status|printers|routes|doctor]");
  }
}

main();
