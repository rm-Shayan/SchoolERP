/**
 * Helper script to connect WhatsApp with Evolution API.
 * Opens the Evolution API Manager in your browser and monitors the connection state.
 *
 * Usage:
 *   node wa.js connect   - open manager & monitor connection
 *   node wa.js create    - create a new WhatsApp-Baileys instance
 *   node wa.js pair      - generate a pairing code
 */
import { exec } from 'node:child_process';
import { createInterface } from 'node:readline';
import 'dotenv/config';

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const INSTANCE = process.env.INSTANCE;

async function checkStatus() {
  try {
    const res = await fetch(`${API_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { apikey: API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data?.instance?.state ?? 'unknown';
  } catch (e) {
    return `error ${e}`;
  }
}

function openBrowser(url) {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  console.log('='.repeat(60));
  console.log('  exKhataBot - Connect WhatsApp');
  console.log('='.repeat(60));
  console.log(`\nInstance Name: ${INSTANCE}`);
  console.log(`Global API Key: ${API_KEY}`);

  const state = await checkStatus();
  console.log(`Current Connection State: ${state}`);

  if (state === 'open') {
    console.log('\n🎉 WhatsApp is ALREADY CONNECTED!');
    return;
  }

  const managerUrl = `${API_URL}/manager`;
  console.log(`\nOpening Evolution API Manager in your browser:`);
  console.log(`  --> ${managerUrl}`);
  console.log('\nHow to scan the QR code:');
  console.log('  1. In the Manager webpage, log in with:');
  console.log(`     - Global API Key: ${API_KEY}`);
  console.log("  2. Click on the 'exkhatabot' instance.");
  console.log("  3. Click 'Connect' / QR code button to display the QR code.");
  console.log('  4. Open WhatsApp on your phone -> Settings -> Linked Devices -> Link a Device.');
  console.log('  5. Scan the QR code.\n');

  openBrowser(managerUrl);

  console.log('Monitoring connection state (press Ctrl+C to stop)...');
  let currentState = state;
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const current = await checkStatus();
    if (current === 'open') {
      console.log('\n🎉 SUCCESS! WhatsApp connected successfully!');
      return;
    }
    if (current !== currentState) {
      console.log(`  State changed to: ${current}`);
      currentState = current;
    }
  }
}

async function createInstance() {
  console.log(`Creating instance: ${INSTANCE}`);
  const headers = { apikey: API_KEY, 'Content-Type': 'application/json' };
  const payload = {
    instanceName: INSTANCE,
    token: process.env.INSTANCE_TOKEN || 'DD8A54DB3EEA-4355-B9E1-DB834878459434',
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  };
  try {
    const res = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.status === 200 || res.status === 201) {
      console.log('Instance created!');
    } else {
      console.log(`Error creating instance: ${await res.text()}`);
    }
  } catch (e) {
    console.log(`Failed to create: ${e}`);
  }
}

async function generatePairingCode() {
  console.log('='.repeat(60));
  console.log('  exKhataBot - Generate Pairing Code');
  console.log('='.repeat(60));
  console.log(`\nInstance Name: ${INSTANCE}`);
  console.log(`Global API Key: ${API_KEY}`);

  const state = await checkStatus();
  console.log(`Current Connection State: ${state}`);

  if (state === 'open') {
    console.log('\n🎉 WhatsApp is ALREADY CONNECTED!');
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  const number = (await ask('Enter your WhatsApp number with country code (e.g., 923172783460): ')).trim();
  rl.close();

  try {
    const url = `${API_URL}/instance/connect/${INSTANCE}`;
    const headers = { apikey: API_KEY, 'Content-Type': 'application/json' };
    console.log('\nGenerating pairing code...');
    const response = await fetch(`${url}?number=${encodeURIComponent(number)}`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 200) {
      const data = await response.json();
      const code = data.pairingCode || 'NOT FOUND';
      if (code && code !== 'NOT FOUND') {
        console.log('\n==========================================');
        console.log(`🚀 PAIRING CODE: ${code}`);
        console.log('==========================================');
        console.log('Open WhatsApp -> Linked Devices -> Link with Phone Number Instead');
        console.log('Enter this code to connect.');
      } else {
        console.log(`\nNo pairing code returned. Response: ${JSON.stringify(data)}`);
      }
    } else {
      console.log(`Failed! Status Code: ${response.status}, Response: ${await response.text()}`);
    }
  } catch (e) {
    console.log(`Error occurred: ${e}`);
  }
}

const cmd = process.argv[2];
if (cmd === 'create') {
  await createInstance();
} else if (cmd === 'pair') {
  await generatePairingCode();
} else {
  await connect();
}