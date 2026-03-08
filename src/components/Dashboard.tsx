import React, { useState, useEffect, useRef } from 'react';
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
  const innerUnsubRef = useRef<(() => void) | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'operations' | 'diagnostics' | 'models' | 'simulation'>('operations');

  useEffect(() => {
    // 1. Listen to the MAIN collection to find the active device(s)
    // We limit to 1 because the user's script updates a single document "Mac-mini-de-Mott.local"
    const q = query(collection(db, 'openclaw_telemetry'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setLoading(false);
        return;
      }

      // Get the first available device document
      const mainDoc = snapshot.docs[0];
      const mainData = mainDoc.data();
      const deviceId = mainDoc.id;

      // Set Current State Data directly from this main document
      // The sync.py script puts EVERYTHING (system + openclaw) in this one doc.
      setData({
        id: deviceId,
        createdAt: mainData.createdAt || new Date(),
        system: mainData.system || {},
        openclaw: mainData.openclaw || {}
      } as TelemetryData);

      setLoading(false);

      // 2. Listen to the SNAPSHOTS subcollection for History
      // Path: openclaw_telemetry/{deviceId}/snapshots
      const historyQuery = query(
        collection(db, 'openclaw_telemetry', deviceId, 'snapshots'),
        orderBy('timestamp', 'desc'), // Assuming the script saves a 'timestamp' field or we use document ID if it's ISO
        limit(20)
      );

      // Cleanup previous inner listener before creating a new one (prevents memory leak)
      if (innerUnsubRef.current) innerUnsubRef.current();
      innerUnsubRef.current = onSnapshot(historyQuery, (histSnapshot) => {
        const historyData = histSnapshot.docs.reverse().map(doc => {
          const d = doc.data();
          // The snapshot doc contains compact data: cpu_pct, mem_pct, etc.
          // We need to map it to the format expected by the charts
          return {
            timestamp: d.timestamp?.toDate ? format(d.timestamp.toDate(), 'HH:mm:ss') : format(new Date(d.timestamp || Date.now()), 'HH:mm:ss'),
            cpu: d.cpu_pct || d.system?.cpu?.usage_percent || 0,
            memory: d.mem_pct || d.system?.memory?.usage_percent || 0,
            disk: d.disk_pct || d.system?.disk?.usage_percent || 0,
            tokens: 0 // Snapshots might not have tokens to save space, as per user description
          };
        });
        setHistory(historyData);
      });
    });

    const qLlms = query(collection(db, 'llms'));
    const unsubscribeLlms = onSnapshot(qLlms, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LLMData));
      setLlms(docs);
    });

    return () => {
      unsubscribe();
      unsubscribeLlms();
      if (innerUnsubRef.current) innerUnsubRef.current();
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
          device_id: 'SIM-001',
          hostname: 'SIMULATOR',
          timestamp: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          system: {
            platform: 'linux',
            cpu: { usage_pct: cpuLoad, physical_cores: 8, logical_cores: 16, freq_mhz_current: 2400 },
            memory: { usage_pct: memoryLoad, total_gb: 32, available_gb: 32 * (1 - memoryLoad / 100), used_gb: 32 * (memoryLoad / 100), swap_pct: 5, swap_used_gb: 0.5 },
            disk: { usage_pct: 75, total_gb: 1024, used_gb: 768, free_gb: 256, io: { read_mb: 12, write_mb: 8 }, partitions: [] },
            network: { bytes_sent_mb: 150, bytes_recv_mb: 300 },
            uptime: { boot_time: new Date(Date.now() - 86400000).toISOString(), uptime_hours: 24 },
            load_avg: { '1min': 1.5, '5min': 1.2, '15min': 1.0 }
          },
          openclaw: {
            status: providerStatus === 'offline' ? 'degraded' : 'online',
            directory: '/var/www/openclaw',
            api: { status: 'healthy', version: '1.2.0' },
            processes: [
              { pid: 1234, name: 'claw-control', status: 'running', cpu_pct: cpuLoad, mem_mb: 128, cmdline: 'claw-control', started: '' },
              { pid: 5678, name: 'video-stream', status: 'running', cpu_pct: Math.floor(Math.random() * 50), mem_mb: 512, cmdline: 'video-stream', started: '' },
              { pid: 9012, name: 'payment-gateway', status: 'sleeping', cpu_pct: 0, mem_mb: 64, cmdline: 'payment-gateway', started: '' },
              { pid: 3456, name: 'node-worker-1', status: 'running', cpu_pct: Math.floor(Math.random() * 20), mem_mb: memoryLoad * 10, cmdline: 'node-worker-1', started: '' },
              { pid: 7890, name: 'node-worker-2', status: 'running', cpu_pct: Math.floor(Math.random() * 25), mem_mb: 256, cmdline: 'node-worker-2', started: '' }
            ],
            rich: {
              providers: { ollama: { base_url: '', api: false, model_count: 0, models: [] } },
              ollama_models: [{ name: 'llama3', size: 0, digest: '', modified_at: '' }],
              sessions: {
                count: Math.floor(Math.random() * 50),
                size_mb: Math.floor(Math.random() * 500),
                channels: {
                  whatsapp: Math.floor(Math.random() * 20),
                  discord: Math.floor(Math.random() * 10),
                  subagent: Math.floor(Math.random() * 5),
                  other: Math.floor(Math.random() * 15)
                },
                whatsapp_contacts: ['+1234567890', '+0987654321', '+1122334455'],
                discord_channels: ['general', 'support', 'voice-1']
              },
              cron_jobs: {
                count: 3,
                jobs: [
                  { schedule: '0 * * * *', name: 'backup.sh', last_run_at: '10 mins ago', next_run_at: '50 mins' },
                  { schedule: '*/5 * * * *', name: 'health-check.sh', last_run_at: '2 mins ago', next_run_at: '3 mins' },
                  { schedule: '0 0 * * *', name: 'daily-report.sh', last_run_at: '24 hours ago', next_run_at: 'tomorrow' }
                ]
              },
              gateway_log: {
                size_mb: 5,
                total_lines: 1000,
                tail: [
                  "[INFO] System started",
                  "[INFO] Connected to database",
                  providerStatus === 'offline' ? "[ERROR] Provider connection failed" : "[INFO] Provider connected",
                  "[WARN] High memory usage detected"
                ]
              },
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
              main_config: {
                ".env": { "OPENAI_API_KEY": "sk-...", "DISCORD_TOKEN": "..." }
              }
            },
            config: { ".env": { "OPENAI_API_KEY": "sk-...", "DISCORD_TOKEN": "..." } }
          },
          system: {
            cpu: {
              usage_pct: cpuLoad,
              physical_cores: 8,
              logical_cores: 16,
              freq_mhz_current: 3200
            },
            memory: {
              usage_pct: memoryLoad,
              total_gb: 32,
              free: 32 - (memoryLoad / 100 * 32),
              used_gb: (memoryLoad / 100 * 32),
              available_gb: 32 - (memoryLoad / 100 * 32),
              swap_pct: 10,
              swap_used_gb: 2
            },
            disk: {
              usage_pct: 45 + Math.floor(Math.random() * 5),
              total: 512,
              free: 256,
              used_gb: 256,
              total_gb: 512,
              io: {
                read_mb: Math.floor(Math.random() * 100),
                write_mb: Math.floor(Math.random() * 50)
              },
              partitions: [
                { mountpoint: '/', device: '/dev/sda1', fstype: 'ext4', total_gb: 512, used_gb: 256, free_gb: 256, usage_pct: 50 },
                { mountpoint: '/mnt/data', device: '/dev/sdb1', fstype: 'ext4', total_gb: 1024, used_gb: 100, free_gb: 924, usage_pct: 10 }
              ]
            },
            load_avg: {
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
        
        // Update local state directly for immediate feedback
        setData(mockData as unknown as TelemetryData);
        setLoading(false);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [simulating, simulationScenario]);

  const handleSync = async () => {
    try {
      const res = await fetch('/.netlify/functions/trigger-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all' }),
      });
      if (res.ok) {
        console.log('✅ Sync triggered via GitHub Actions');
      } else {
        console.warn('Sync trigger returned status', res.status);
        alert(`Sync request failed (HTTP ${res.status}). Check Netlify function logs.`);
      }
    } catch (err) {
      console.error('Failed to trigger sync:', err);
      alert('Could not reach /.netlify/functions/trigger-sync. Are you running on Netlify?');
    }
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
        status={data?.openclaw?.status === 'running' ? 'online' : 'offline'}
        systemId={data?.hostname || data?.device_id || "OC-2024-X1"}
        region={data?.id || data?.hostname || data?.device_id || 'OC-PROD'}
        simulating={simulating}
        onToggleSimulation={() => setSimulating(!simulating)}
        onSync={handleSync}
        onOpsMode={() => setOpsMode(true)}
        simulationScenario={simulationScenario}
        onScenarioChange={setSimulationScenario}
      />
      
      <MiniMetricStrip 
        cpu={data?.system?.cpu?.usage_pct || data?.system?.cpu?.usage_percent || 0}
        memory={data?.system?.memory?.usage_pct || data?.system?.memory?.usage_percent || 0}
        disk={data?.system?.disk?.usage_pct || data?.system?.disk?.usage_percent || 0}
        totalTokens={data?.openclaw?.rich?.token_usage?.total_tokens || 0}
        activeSessions={data?.openclaw?.rich?.sessions?.count || 0}
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
                <DiskForecast history={history} currentDisk={data?.system?.disk?.usage_pct || data?.system?.disk?.usage_percent} />
                <ProcessTreemap processes={
                  Array.isArray(data?.openclaw?.processes) 
                    ? data.openclaw.processes 
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
                topModel={
                  data?.openclaw?.rich?.token_usage?.per_model?.reduce(
                    (top, m) => (!top || m.total > top.total ? m : top),
                    null as any
                  )?.model || '—'
                }
                requestsPerMin={
                  data?.openclaw?.rich?.token_usage?.per_model?.reduce((s, m) => s + (m.calls || 0), 0) || 0
                }
                limit={200000000}
              />
              <ModelEfficiencyTable
                models={
                  llms.length > 0
                    ? llms
                    : (data?.openclaw?.rich?.token_usage?.per_model || []).map((m: any) => ({
                        id: m.model,
                        name: m.model,
                        provider: m.provider || 'Unknown',
                        state: 'online' as const,
                        context_window: 0,
                        max_tokens: 0,
                      }))
                }
                tokenUsage={data?.openclaw?.rich?.token_usage || {}}
              />
              <ProviderHealth
                models={
                  llms.length > 0
                    ? llms
                    : Object.entries(data?.openclaw?.rich?.providers || {}).flatMap(
                        ([providerName, p]: [string, any]) =>
                          (p?.models || []).map((m: any) => ({
                            id: m.id || m.name,
                            name: m.name || m.id,
                            provider: providerName,
                            state: p?.api ? 'online' : 'offline',
                            context_window: m.context_window,
                            max_tokens: m.max_tokens,
                          }))
                      )
                }
              />
              <ActivityHeatmap history={history} />
            </div>
          </div>
        )}

        {/* Level 3: Diagnostic Layer (Diagnostics Tab) */}
        {activeTab === 'diagnostics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 space-y-6">
              <SmartLogViewer logs={data?.openclaw?.rich?.gateway_log || { tail: [] }} className="h-[600px]" />
              <SystemDetails system={data?.system} />
            </div>
            <div className="space-y-6">
              <SessionList sessions={data?.openclaw?.rich?.sessions} />
              <ChannelBreakdown sessions={data?.openclaw?.rich?.sessions} />
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
