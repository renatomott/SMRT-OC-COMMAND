import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MetricCard } from './MetricCard';
import { StatusIndicator } from './StatusIndicator';
import { ProcessList } from './ProcessList';
import { RichPresence } from './RichPresence';
import { SystemCharts } from './SystemCharts';
import { SystemDetails } from './SystemDetails';
import { SessionList } from './SessionList';
import { IntegrationList } from './IntegrationList';
import { LogViewer } from './LogViewer';
import { LLMAnalytics } from './LLMAnalytics';
import { Activity, Cpu, HardDrive, Server, RefreshCw, Play, Pause, AlertCircle, LayoutDashboard, Settings, List, FileText, Terminal, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { TelemetryData, LLMData } from '../types';

export function Dashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [llms, setLlms] = useState<LLMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'sessions' | 'integrations' | 'logs' | 'llms'>('overview');

  useEffect(() => {
    const q = query(collection(db, 'openclaw_telemetry'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TelemetryData));
      if (docs.length > 0) {
        setData(docs[0]);
        setHistory(docs.reverse().map(d => ({
          timestamp: d.createdAt?.toDate ? format(d.createdAt.toDate(), 'HH:mm:ss') : format(new Date(d.createdAt), 'HH:mm:ss'),
          cpu: d.system?.cpu?.usage || 0,
          memory: d.system?.memory?.usage || 0,
          disk: d.system?.disk?.usage || 0
        })));
      }
      setLoading(false);
    });

    const qLlms = query(collection(db, 'llms'));
    const unsubscribeLlms = onSnapshot(qLlms, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LLMData));
      setLlms(docs);
    });

    return () => {
      unsubscribe();
      unsubscribeLlms();
    };
  }, []);

  // Simulation logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simulating) {
      // Simulate LLM data if empty
      if (llms.length === 0) {
        setLlms([
          { id: '1', name: 'gpt-4', provider: 'OpenAI', state: 'online', context_window: 128000, max_tokens: 4096 },
          { id: '2', name: 'claude-3-opus', provider: 'Anthropic', state: 'active', context_window: 200000, max_tokens: 4096 },
          { id: '3', name: 'llama-3-70b', provider: 'Groq', state: 'online', context_window: 8192, max_tokens: 8192 },
          { id: '4', name: 'gemini-1.5-pro', provider: 'Google', state: 'maintenance', context_window: 1000000, max_tokens: 8192 }
        ]);
      }

      interval = setInterval(async () => {
        const mockData = {
          createdAt: serverTimestamp(),
          openclaw: {
            status: Math.random() > 0.1 ? 'online' : 'maintenance',
            directory: '/var/www/openclaw',
            api: { status: 'healthy', version: '1.2.0' },
            processes: [
              { pid: 1234, name: 'claw-control', status: 'running', cpu: Math.floor(Math.random() * 30), memory: 128 },
              { pid: 5678, name: 'video-stream', status: 'running', cpu: Math.floor(Math.random() * 50), memory: 512 },
              { pid: 9012, name: 'payment-gateway', status: 'sleeping', cpu: 0, memory: 64 }
            ],
            rich: {
              providers: { discord: true, twitch: false, youtube: true },
              sessions: { active_users: Math.floor(Math.random() * 100), queue: Math.floor(Math.random() * 10) },
              token_usage: {
                total_tokens: 150000 + Math.floor(Math.random() * 5000),
                total_input: 100000 + Math.floor(Math.random() * 3000),
                total_output: 50000 + Math.floor(Math.random() * 2000),
                per_model: [
                  { model: 'gpt-4', input: 50000, output: 20000, total: 70000 },
                  { model: 'claude-3-opus', input: 30000, output: 15000, total: 45000 },
                  { model: 'llama-3-70b', input: 20000, output: 15000, total: 35000 }
                ]
              }
            },
            sessions: {
              count: Math.floor(Math.random() * 50),
              size_mb: Math.floor(Math.random() * 500),
              channels: {
                whatsapp: Math.floor(Math.random() * 20),
                discord: Math.floor(Math.random() * 10),
                subagent: Math.floor(Math.random() * 5),
                other: Math.floor(Math.random() * 15)
              },
              details: {
                whatsapp: ['+1234567890', '+0987654321', '+1122334455'],
                discord: ['general', 'support', 'voice-1']
              }
            },
            cron: {
              count: 3,
              jobs: [
                { schedule: '0 * * * *', command: 'backup.sh', last_run: '10 mins ago' },
                { schedule: '*/5 * * * *', command: 'health-check.sh', last_run: '2 mins ago' },
                { schedule: '0 0 * * *', command: 'daily-report.sh', last_run: '24 hours ago' }
              ]
            },
            ollama: {
              models: ['llama3', 'mistral', 'gemma']
            },
            integrations: {
              env_keys: ['OPENAI_API_KEY', 'DISCORD_TOKEN', 'STRIPE_SECRET']
            },
            logs: {
              gateway: {
                total_lines: 15420,
                size_mb: 45,
                tail: [
                  '[INFO] Gateway started on port 3000',
                  '[INFO] Connected to database',
                  '[WARN] High latency detected on video stream',
                  '[INFO] User connected: user_123',
                  '[ERROR] Payment gateway timeout',
                  '[INFO] Retrying payment...',
                  '[SUCCESS] Payment processed',
                  `[INFO] System load: ${Math.random().toFixed(2)}`,
                  `[INFO] Active sessions: ${Math.floor(Math.random() * 100)}`
                ]
              }
            }
          },
          system: {
            cpu: {
              usage: Math.floor(Math.random() * 100),
              physical_cores: 8,
              logical_cores: 16,
              freq_mhz_current: 3200
            },
            memory: {
              usage: Math.floor(Math.random() * 100),
              total_gb: 32,
              free: 16,
              used_gb: 16,
              available_gb: 16,
              swap_pct: 10,
              swap_used_gb: 2
            },
            disk: {
              usage: 45,
              total: 512,
              free: 256,
              used_gb: 256,
              total_gb: 512,
              io: {
                read_mb: Math.floor(Math.random() * 100),
                write_mb: Math.floor(Math.random() * 50)
              },
              partitions: [
                { mount: '/', device: '/dev/sda1', total: 512, used: 256, percent: 50 },
                { mount: '/mnt/data', device: '/dev/sdb1', total: 1024, used: 100, percent: 10 }
              ]
            },
            load: {
              "1min": 1.5,
              "5min": 1.2,
              "15min": 1.0
            },
            uptime: {
              uptime_hours: 48,
              boot_time: '2024-03-01 10:00:00'
            },
            network: {
              bytes_sent_mb: Math.floor(Math.random() * 1000),
              bytes_recv_mb: Math.floor(Math.random() * 2000)
            }
          }
        };
        await addDoc(collection(db, 'openclaw_telemetry'), mockData);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [simulating]);

  const handleSync = async () => {
    // In a real scenario, this would call a Netlify function
    console.log("Triggering manual sync...");
    alert("Manual sync triggered (simulated)");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          <p className="text-[#8E9299] text-sm uppercase tracking-wider">Initializing Telemetry Link...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'system', label: 'System', icon: Server },
    { id: 'llms', label: 'LLMs & Usage', icon: Brain },
    { id: 'sessions', label: 'Sessions', icon: List },
    { id: 'integrations', label: 'Integrations', icon: Settings },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white p-6 font-sans flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-white" />
            OPENCLAW COMMAND
          </h1>
          <p className="text-[#8E9299] text-sm font-mono mt-1">
            SYSTEM ID: OC-2024-X1 • REGION: US-WEST-2
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator 
            status={data?.openclaw?.status === 'online' ? 'online' : 'offline'} 
            label={data?.openclaw?.status?.toUpperCase() || 'UNKNOWN'} 
            className="bg-[#151619] px-3 py-1.5 rounded border border-[#2A2B30]"
          />
          <button 
            onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 bg-[#151619] hover:bg-[#1E1F23] border border-[#2A2B30] rounded text-xs font-mono uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Sync
          </button>
          <button 
            onClick={() => setSimulating(!simulating)}
            className={clsx("flex items-center gap-2 px-4 py-2 border rounded text-xs font-mono uppercase tracking-wider transition-colors", {
              "bg-green-500/10 border-green-500/20 text-green-500": simulating,
              "bg-[#151619] border-[#2A2B30] text-[#8E9299] hover:bg-[#1E1F23]": !simulating
            })}
          >
            {simulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {simulating ? 'Simulating' : 'Simulate'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#2A2B30] pb-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-mono uppercase tracking-wider transition-colors border-b-2", {
              "border-white text-white bg-[#151619]": activeTab === tab.id,
              "border-transparent text-[#8E9299] hover:text-white hover:bg-[#151619]/50": activeTab !== tab.id
            })}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {!data && !simulating ? (
        <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed border-[#2A2B30] rounded-lg bg-[#151619]/50">
          <AlertCircle className="w-12 h-12 text-[#8E9299] mb-4" />
          <h2 className="text-xl font-bold mb-2">No Telemetry Data</h2>
          <p className="text-[#8E9299] mb-6 text-center max-w-md">
            Waiting for incoming data stream from OpenClaw unit. 
            Ensure the telemetry agent is running or start simulation mode.
          </p>
          <button 
            onClick={() => setSimulating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded font-bold hover:bg-gray-200 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Simulation
          </button>
        </div>
      ) : (
        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Metrics Row */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                  title="CPU Load" 
                  value={data?.system?.cpu?.usage || 0} 
                  unit="%" 
                  icon={<Cpu className="w-4 h-4" />} 
                  trend={history.length > 1 && (data?.system?.cpu?.usage || 0) > (history[history.length - 2]?.cpu || 0) ? 'up' : history.length > 1 && (data?.system?.cpu?.usage || 0) < (history[history.length - 2]?.cpu || 0) ? 'down' : 'neutral'}
                  trendValue={history.length > 1 ? `${Math.abs((data?.system?.cpu?.usage || 0) - (history[history.length - 2]?.cpu || 0))}%` : '-'}
                />
                <MetricCard 
                  title="Memory Usage" 
                  value={data?.system?.memory?.usage || 0} 
                  unit="%" 
                  icon={<Activity className="w-4 h-4" />} 
                />
                <MetricCard 
                  title="Disk Usage" 
                  value={data?.system?.disk?.usage || 0} 
                  unit="%" 
                  icon={<HardDrive className="w-4 h-4" />} 
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <SystemCharts data={history} />
                <ProcessList processes={
                  Array.isArray(data?.openclaw?.processes) 
                    ? data.openclaw.processes 
                    : typeof data?.openclaw?.processes === 'object' && data?.openclaw?.processes !== null
                      ? Object.values(data.openclaw.processes)
                      : []
                } />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
                  <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">System Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-[#2A2B30] pb-2">
                      <span className="text-[#8E9299] text-xs font-mono">Directory</span>
                      <span className="text-white text-xs font-mono truncate max-w-[150px]">{data?.openclaw?.directory || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#2A2B30] pb-2">
                      <span className="text-[#8E9299] text-xs font-mono">API Version</span>
                      <span className="text-white text-xs font-mono">{data?.openclaw?.api?.version || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-[#8E9299] text-xs font-mono">Last Update</span>
                      <span className="text-white text-xs font-mono">
                        {data?.createdAt?.toDate ? format(data.createdAt.toDate(), 'HH:mm:ss') : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <RichPresence 
                  providers={data?.openclaw?.rich?.providers || {}} 
                  sessions={data?.openclaw?.rich?.sessions || {}} 
                />
              </div>
            </div>
          )}

          {activeTab === 'system' && data?.system && (
            <SystemDetails system={data.system} />
          )}

          {activeTab === 'llms' && (
            <LLMAnalytics usage={data?.openclaw?.rich?.token_usage} models={llms} />
          )}

          {activeTab === 'sessions' && data?.openclaw?.sessions && (
            <SessionList sessions={data.openclaw.sessions} />
          )}

          {activeTab === 'integrations' && data?.openclaw && (
            <IntegrationList data={data.openclaw} />
          )}

          {activeTab === 'logs' && data?.openclaw?.logs?.gateway && (
            <LogViewer logs={data.openclaw.logs.gateway} className="h-[calc(100vh-200px)]" />
          )}
        </div>
      )}
    </div>
  );
}
