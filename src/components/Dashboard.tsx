import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { TopCommandBar } from './TopCommandBar';
import { MiniMetricStrip } from './MiniMetricStrip';
import { TokenFlowPanel } from './TokenFlowPanel';
import { ModelEfficiencyTable } from './ModelEfficiencyTable';
import { SmartLogViewer } from './SmartLogViewer';
import { SystemCorrelationChart } from './SystemCorrelationChart';
import { DiskForecast } from './DiskForecast';
import { ProcessTreemap } from './ProcessTreemap';
import { ProviderHealth } from './ProviderHealth';
import { ActivityHeatmap } from './ActivityHeatmap';
import { SessionList } from './SessionList';
import { ChannelBreakdown } from './ChannelBreakdown';
import { IntegrationList } from './IntegrationList';
import { OpsView } from './OpsView';
import { LLMAnalytics } from './LLMAnalytics';
import { SystemDetails } from './SystemDetails';
import { TelemetryData, LLMData } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { LayoutDashboard, Activity, Brain, Play, FileText } from 'lucide-react';

export function Dashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [llms, setLlms] = useState<LLMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulationScenario, setSimulationScenario] = useState('normal');
  const [opsMode, setOpsMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'diagnostics' | 'models' | 'simulation'>('operations');

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
          disk: d.system?.disk?.usage || 0,
          tokens: d.openclaw?.rich?.token_usage?.total_tokens || 0
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

  // Simulation Logic with Scenarios
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simulating) {
      if (llms.length === 0) {
        setLlms([
          { id: '1', name: 'gpt-4', provider: 'OpenAI', state: 'online', context_window: 128000, max_tokens: 4096 },
          { id: '2', name: 'claude-3-opus', provider: 'Anthropic', state: 'active', context_window: 200000, max_tokens: 4096 },
          { id: '3', name: 'llama-3-70b', provider: 'Groq', state: 'online', context_window: 8192, max_tokens: 8192 },
          { id: '4', name: 'gemini-1.5-pro', provider: 'Google', state: 'maintenance', context_window: 1000000, max_tokens: 8192 }
        ]);
      }

      interval = setInterval(async () => {
        // Scenario modifiers
        let cpuLoad = Math.floor(Math.random() * 30);
        let memoryLoad = Math.floor(Math.random() * 40);
        let tokenUsage = 150000 + Math.floor(Math.random() * 5000);
        let errorCount = 0;
        let warningCount = 0;
        let providerStatus = 'online';

        if (simulationScenario === 'heavy_llm') {
          tokenUsage = 500000 + Math.floor(Math.random() * 100000);
          cpuLoad = 80 + Math.floor(Math.random() * 15);
        } else if (simulationScenario === 'memory_leak') {
          memoryLoad = Math.min(95, memoryLoad + (history.length * 2)); // Increasing memory
          warningCount = 5;
        } else if (simulationScenario === 'token_spike') {
          tokenUsage = 1000000;
          warningCount = 2;
        } else if (simulationScenario === 'provider_outage') {
          providerStatus = 'offline';
          errorCount = 15;
        }

        const mockData = {
          createdAt: serverTimestamp(),
          openclaw: {
            status: providerStatus === 'offline' ? 'degraded' : 'online',
            directory: '/var/www/openclaw',
            api: { status: 'healthy', version: '1.2.0' },
            processes: [
              { pid: 1234, name: 'claw-control', status: 'running', cpu: cpuLoad, memory: 128 },
              { pid: 5678, name: 'video-stream', status: 'running', cpu: Math.floor(Math.random() * 50), memory: 512 },
              { pid: 9012, name: 'payment-gateway', status: 'sleeping', cpu: 0, memory: 64 },
              { pid: 3456, name: 'node-worker-1', status: 'running', cpu: Math.floor(Math.random() * 20), memory: memoryLoad * 10 },
              { pid: 7890, name: 'node-worker-2', status: 'running', cpu: Math.floor(Math.random() * 25), memory: 256 }
            ],
            rich: {
              providers: { discord: true, twitch: false, youtube: true },
              sessions: { active_users: Math.floor(Math.random() * 100), queue: Math.floor(Math.random() * 10) },
              token_usage: {
                total_tokens: tokenUsage,
                total_input: Math.floor(tokenUsage * 0.7),
                total_output: Math.floor(tokenUsage * 0.3),
                per_model: [
                  { model: 'gpt-4', input: Math.floor(tokenUsage * 0.4), output: Math.floor(tokenUsage * 0.1), total: Math.floor(tokenUsage * 0.5) },
                  { model: 'claude-3-opus', input: Math.floor(tokenUsage * 0.2), output: Math.floor(tokenUsage * 0.1), total: Math.floor(tokenUsage * 0.3) },
                  { model: 'llama-3-70b', input: Math.floor(tokenUsage * 0.1), output: Math.floor(tokenUsage * 0.1), total: Math.floor(tokenUsage * 0.2) }
                ]
              },
              cron_jobs: {
                count: 3,
                jobs: [
                  { schedule: '0 * * * *', command: 'backup.sh', last_run: '10 mins ago' },
                  { schedule: '*/5 * * * *', command: 'health-check.sh', last_run: '2 mins ago' },
                  { schedule: '0 0 * * *', command: 'daily-report.sh', last_run: '24 hours ago' }
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
                  errorCount > 0 ? '[ERROR] Provider connection failed' : '[INFO] Provider connection healthy',
                  warningCount > 0 ? '[WARN] High memory usage detected' : '[INFO] System load normal',
                  '[INFO] User connected: user_123',
                  '[SUCCESS] Payment processed',
                  `[INFO] System load: ${cpuLoad.toFixed(2)}`,
                  `[INFO] Active sessions: ${Math.floor(Math.random() * 100)}`
                ]
              }
            }
          },
          system: {
            cpu: {
              usage: cpuLoad,
              physical_cores: 8,
              logical_cores: 16,
              freq_mhz_current: 3200
            },
            memory: {
              usage: memoryLoad,
              total_gb: 32,
              free: 32 - (memoryLoad / 100 * 32),
              used_gb: (memoryLoad / 100 * 32),
              available_gb: 32 - (memoryLoad / 100 * 32),
              swap_pct: 10,
              swap_used_gb: 2
            },
            disk: {
              usage: 45 + Math.floor(Math.random() * 5),
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
  }, [simulating, simulationScenario]);

  const handleSync = async () => {
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

  if (opsMode) {
    return <OpsView data={data} onExit={() => setOpsMode(false)} />;
  }

  const tabs = [
    { id: 'operations', label: 'Operations', icon: LayoutDashboard },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
    { id: 'models', label: 'Models & Usage', icon: Brain },
    { id: 'simulation', label: 'Simulation', icon: Play },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans flex flex-col">
      {/* Level 1: Command Layer */}
      <TopCommandBar 
        status={data?.openclaw?.status === 'online' ? 'online' : 'offline'}
        systemId="OC-2024-X1"
        region="US-WEST-2"
        simulating={simulating}
        onToggleSimulation={() => setSimulating(!simulating)}
        onSync={handleSync}
        onOpsMode={() => setOpsMode(true)}
        simulationScenario={simulationScenario}
        onScenarioChange={setSimulationScenario}
      />
      
      <MiniMetricStrip 
        cpu={data?.system?.cpu?.usage || 0}
        memory={data?.system?.memory?.usage || 0}
        disk={data?.system?.disk?.usage || 0}
        tokensPerMin={Math.floor((data?.openclaw?.rich?.token_usage?.total_tokens || 0) / 60)} // Approx
        activeSessions={data?.openclaw?.sessions?.count || 0}
        warnings={simulationScenario === 'memory_leak' ? 5 : 0} // Mock from scenario
        errors={simulationScenario === 'provider_outage' ? 15 : 0} // Mock from scenario
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 pt-6 border-b border-[#2A2B30] overflow-x-auto">
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

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Level 2: Situational Layer (Operations Tab) */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: System State */}
            <div className="lg:col-span-2 space-y-6">
              <SystemCorrelationChart 
                history={history} 
                cronJobs={data?.openclaw?.rich?.cron_jobs} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DiskForecast history={history} currentDisk={data?.system?.disk?.usage} />
                <ProcessTreemap processes={
                  Array.isArray(data?.openclaw?.processes) 
                    ? data.openclaw.processes 
                    : typeof data?.openclaw?.processes === 'object' && data?.openclaw?.processes !== null
                      ? Object.values(data.openclaw.processes)
                      : []
                } />
              </div>
            </div>

            {/* Right Column: AI & Providers */}
            <div className="space-y-6">
              <TokenFlowPanel 
                promptTokens={data?.openclaw?.rich?.token_usage?.total_input || 0}
                completionTokens={data?.openclaw?.rich?.token_usage?.total_output || 0}
                totalTokens={data?.openclaw?.rich?.token_usage?.total_tokens || 0}
                topModel="gpt-4" // Mock, could be derived
                requestsPerMin={14} // Mock
                limit={2000000} // Mock limit
              />
              <ModelEfficiencyTable 
                models={llms} 
                tokenUsage={data?.openclaw?.rich?.token_usage || {}} 
              />
              <ProviderHealth models={llms} />
              <ActivityHeatmap history={history} />
            </div>
          </div>
        )}

        {/* Level 3: Diagnostic Layer (Diagnostics Tab) */}
        {activeTab === 'diagnostics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 space-y-6">
              <SmartLogViewer logs={data?.openclaw?.logs?.gateway || { tail: [] }} className="h-[600px]" />
              <SystemDetails system={data?.system} />
            </div>
            <div className="space-y-6">
              <SessionList sessions={data?.openclaw?.sessions} />
              <ChannelBreakdown sessions={data?.openclaw?.sessions} />
              <IntegrationList data={data?.openclaw} />
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <LLMAnalytics usage={data?.openclaw?.rich?.token_usage} models={llms} />
          </div>
        )}

        {/* Simulation Tab (Placeholder for future expansion) */}
        {activeTab === 'simulation' && (
          <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed border-[#2A2B30] rounded-lg bg-[#151619]/50">
            <Play className="w-12 h-12 text-[#8E9299] mb-4" />
            <h2 className="text-xl font-bold mb-2">Simulation Mode Active</h2>
            <p className="text-[#8E9299] mb-6 text-center max-w-md">
              Current Scenario: <span className="text-white font-mono uppercase">{simulationScenario.replace('_', ' ')}</span>
            </p>
            <p className="text-sm text-[#8E9299]">
              Use the controls in the Top Command Bar to change scenarios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
