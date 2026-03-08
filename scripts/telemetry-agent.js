const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const os = require('os');

// --- CONFIGURATION ---
// 1. Download your Service Account Key from Firebase Console -> Project Settings -> Service Accounts
// 2. Save it as 'serviceAccountKey.json' in the same directory as this script
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Use the default database for the project
const db = getFirestore(app);

const SYSTEM_ID = 'OC-PROD-SERVER-01'; // Change this to identify your server

// --- METRICS COLLECTION ---

function getCpuUsage() {
  const cpus = os.cpus();
  let user = 0;
  let nice = 0;
  let sys = 0;
  let idle = 0;
  let irq = 0;

  for (let cpu of cpus) {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  }

  const total = user + nice + sys + idle + irq;
  return {
    idle,
    total
  };
}

// Store previous CPU usage to calculate difference
let startCpu = getCpuUsage();

function getCpuLoad() {
  const endCpu = getCpuUsage();
  const idleDiff = endCpu.idle - startCpu.idle;
  const totalDiff = endCpu.total - startCpu.total;
  
  // Update startCpu for the next interval
  startCpu = endCpu;

  if (totalDiff === 0) return 0;

  const percentage = 100 - Math.floor((100 * idleDiff) / totalDiff);
  return percentage;
}

function getMemoryMetrics() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usage = Math.floor((used / total) * 100);
  
  return {
    usage,
    total_gb: Math.floor(total / 1024 / 1024 / 1024),
    free_gb: Math.floor(free / 1024 / 1024 / 1024),
    used_gb: Math.floor(used / 1024 / 1024 / 1024)
  };
}

// Mock function for OpenClaw specific data
// In a real integration, you would fetch this from your AI application's internal API or logs
function getOpenClawMetrics() {
  // Use current CPU load for logs
  const currentCpu = getCpuLoad();
  const currentMem = getMemoryMetrics().usage;

  return {
    status: 'online',
    directory: process.cwd(),
    api: { status: 'healthy', version: '1.2.0' },
    processes: [
      { pid: process.pid, name: 'telemetry-agent', status: 'running', cpu: Math.floor(Math.random() * 5), memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) }
    ],
    rich: {
      token_usage: {
        total_tokens: Math.floor(Math.random() * 10000) + 150000,
        total_input: Math.floor(Math.random() * 5000) + 100000,
        total_output: Math.floor(Math.random() * 5000) + 50000
      },
      sessions: {
        count: Math.floor(Math.random() * 20) + 5
      }
    },
    logs: {
      gateway: {
        tail: [
          `[INFO] System heartbeat at ${new Date().toISOString()}`,
          `[INFO] CPU Load: ${currentCpu}%`,
          `[INFO] Memory Usage: ${currentMem}%`
        ]
      }
    }
  };
}

// --- MAIN LOOP ---

async function sendTelemetry() {
  try {
    // Calculate metrics
    // Note: getCpuLoad updates the 'startCpu' state, so calling it inside getOpenClawMetrics 
    // and here would cause issues if not careful. 
    // We'll call it once here and pass it if needed, but getOpenClawMetrics calls it internally too.
    // To fix this logic: we should just call it once per cycle.
    
    // Let's simplify: getCpuLoad() is called every 5 seconds by the interval.
    // It measures the load SINCE THE LAST CALL.
    
    const cpuLoad = getCpuLoad(); 
    const memory = getMemoryMetrics();
    
    // We need to pass these values to getOpenClawMetrics to avoid re-calculating (and resetting) the CPU diff
    // But getOpenClawMetrics is a mock, so let's just update it to use passed values or remove the internal call.
    
    // Redefining getOpenClawMetrics to accept params would be cleaner, but for now let's just
    // fix the mock data generation inside the payload construction.
    
    const openClawData = {
        status: 'online',
        directory: process.cwd(),
        api: { status: 'healthy', version: '1.2.0' },
        processes: [
          { pid: process.pid, name: 'telemetry-agent', status: 'running', cpu: Math.floor(Math.random() * 5), memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) }
        ],
        rich: {
          token_usage: {
            total_tokens: Math.floor(Math.random() * 10000) + 150000,
            total_input: Math.floor(Math.random() * 5000) + 100000,
            total_output: Math.floor(Math.random() * 5000) + 50000
          },
          sessions: {
            count: Math.floor(Math.random() * 20) + 5
          }
        },
        logs: {
          gateway: {
            tail: [
              `[INFO] System heartbeat at ${new Date().toISOString()}`,
              `[INFO] CPU Load: ${cpuLoad}%`,
              `[INFO] Memory Usage: ${memory.usage}%`
            ]
          }
        }
    };

    const payload = {
      id: SYSTEM_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      system: {
        cpu: {
          usage: cpuLoad,
          physical_cores: os.cpus().length / 2, // Approximation
          logical_cores: os.cpus().length,
          freq_mhz_current: os.cpus()[0].speed
        },
        memory: {
          usage: memory.usage,
          total: memory.total_gb,
          free: memory.free_gb,
          used_gb: memory.used_gb,
          total_gb: memory.total_gb
        },
        disk: {
          usage: 45, // Placeholder - requires 'df' command parsing for real data
          total: 512,
          free: 256
        },
        uptime: {
          uptime_hours: Math.floor(os.uptime() / 3600),
          boot_time: new Date(Date.now() - (os.uptime() * 1000)).toISOString()
        }
      },
      openclaw: openClawData
    };

    await db.collection('openclaw_telemetry').add(payload);
    console.log(`[${new Date().toISOString()}] Telemetry sent. CPU: ${cpuLoad}%, MEM: ${memory.usage}%`);

  } catch (error) {
    console.error('Error sending telemetry:', error);
  }
}

console.log('Starting OpenClaw Telemetry Agent...');
console.log(`Target System ID: ${SYSTEM_ID}`);

// Send data every 5 seconds
setInterval(sendTelemetry, 5000);
