#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (command === 'printers') {
    try {
      const res = await fetch('http://127.0.0.1:18181/printers');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      if (json.data && json.data.printers) {
        console.table(json.data.printers);
      } else {
        console.log("No printers found.");
      }
    } catch (e: any) {
      console.error("Error connecting to bridge server. Is it running on port 18181?", e.message);
    }
  } else if (command === 'start') {
    require('./index');
  } else {
    console.log("Usage: node-print [start|printers]");
  }
}

main();
