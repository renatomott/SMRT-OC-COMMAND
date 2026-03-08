import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { TopCommandBar } from './TopCommandBar';
import { MiniMetricStrip } from './MiniMetricStrip';
import { TokenFlowPanel } from './TokenFlowPanel';
import { ModelEfficiencyTable } from './ModelEfficiencyTable';
import { SmartLogViewer } from './SmartLogViewer';
import { SystemCorrelationChart } from './SystemCorrelationChart';
import { DiskForecast } from './DiskForecast';
import { ProcessTreemap } from './ProcessTreemap';
import { ProcessTable } from './ProcessTable';
import { SyncHealth } from './SyncHealth';
import { PdfReport } from './PdfReport';
import { ProviderHealth } from './ProviderHealth';
import { ActivityHeatmap } from './ActivityHeatmap';
import { SessionList } from './SessionList';
import { ChannelBreakdown } from './ChannelBreakdown';
import { IntegrationList } from './IntegrationList';
import { OpsView } from './OpsView';
import { LLMAnalytics } from './LLMAnalytics';
import { SystemDetails } from './SystemDetails';
import { TelemetryData, LLMData } from '../types';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { LayoutDashboard, Activity, Brain, FileText } from 'lucide-react';
import { HeroMetrics } from './HeroMetrics';
import { OpenClawStatusCard } from './OpenClawStatusCard';
import { IntelligencePanel } from './IntelligencePanel';
import { SystemHealthScore } from './SystemHealthScore';
import { LoadAverageWidget } from './LoadAverageWidget';
import { CronHealthPanel } from './CronHealthPanel';
import { MultiTimeline } from './MultiTimeline';
import { ModelInsightsTable } from './ModelInsightsTable';
import { MemoryPressureWidget } from './MemoryPressureWidget';
import { generateInsights, computeHealthScore } from '../lib/insightEngine';

export function Dashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [llms, setLlms] = useState<LLMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [opsMode, setOpsMode] = useState(false);
  const innerUnsubRef = useRef<(() => void) | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = React.useState(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'diagnostics' | 'models'>('operations');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setPwaInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // 1. Listen to the MAIN collection to find the active device(s)
    // We limit to 1 because the user's script updates a single document "Mac-mini-de-Mott.local"
    const DEVICE_ID = 'Mac-mini-de-Mott.local';
    const deviceRef = doc(db, 'openclaw_telemetry', DEVICE_ID);

    const unsubscribe = onSnapshot(deviceRef, (mainDoc) => {
      if (!mainDoc.exists()) {
        setLoading(false);
        return;
      }

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
      // 300 pts ≈ 5 horas de histórico (sync a cada 60s)
      const historyQuery = query(
        collection(db, 'openclaw_telemetry', deviceId, 'snapshots'),
        orderBy('timestamp', 'desc'),
        limit(300)
      );

      if (innerUnsubRef.current) innerUnsubRef.current();
      innerUnsubRef.current = onSnapshot(historyQuery, (histSnapshot) => {
        const historyData = histSnapshot.docs.reverse().map(doc => {
          const d = doc.data();
          let tsDate: Date;
          if (d.timestamp?.toDate) tsDate = d.timestamp.toDate();
          else if (d.timestamp) tsDate = new Date(d.timestamp);
          else tsDate = new Date();
          return {
            timestamp: format(tsDate, 'HH:mm'),
            _ts: tsDate.getTime(),
            cpu:    d.cpu_pct    ?? d.system?.cpu?.usage_percent    ?? 0,
            memory: d.mem_pct    ?? d.system?.memory?.usage_percent  ?? 0,
            disk:   d.disk_pct   ?? d.system?.disk?.usage_percent    ?? 0,
            load1:       d.load_1m  ?? d.system?.load_avg?.['1min']   ?? null,
            load5:       d.load_5m  ?? d.system?.load_avg?.['5min']   ?? null,
            load15:      d.load_15m ?? d.system?.load_avg?.['15min']  ?? null,
            swap_pct:    d.swap_pct ?? d.system?.memory?.swap_pct     ?? null,
            net_sent_mb: d.net_sent_mb ?? d.system?.network?.bytes_sent_mb ?? null,
            net_recv_mb: d.net_recv_mb ?? d.system?.network?.bytes_recv_mb ?? null,
            disk_read_mb:  d.disk_read_mb  ?? d.system?.disk?.io?.read_mb  ?? null,
            disk_write_mb: d.disk_write_mb ?? d.system?.disk?.io?.write_mb ?? null,
            cpu_pct: d.cpu_pct ?? 0,
            mem_pct: d.mem_pct ?? 0,
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


  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
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
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans flex flex-col">
      {/* Level 1: Command Layer */}
      <div className="flex items-center justify-between bg-[#09090B] border-b border-[#2A2B30] sticky top-0 z-50">
        <div className="flex-1">
          <TopCommandBar
            status={data?.openclaw?.status === 'running' || data?.openclaw?.status === 'online' ? 'online' : 'offline'}
            systemId={data?.id || data?.hostname || data?.device_id || 'OC-2024-X1'}
            region={data?.system?.platform?.hostname || data?.hostname || data?.device_id || 'Mac-mini'}
            directory={data?.openclaw?.directory}
            apiFound={data?.openclaw?.api?.found}
            apiPort={data?.openclaw?.api?.port}
            apiBaseUrl={data?.openclaw?.api?.base_url}
            userEmail={currentUser?.email || undefined}
            onOpsMode={() => setOpsMode(true)}
          />
        </div>
        <div className="flex items-center gap-2 pr-4">
          <PdfReport data={data} />
          {!pwaInstalled && deferredPrompt && (
            <button
              onClick={handleInstallPwa}
              className="flex items-center gap-2 px-3 py-2 bg-[#151619] hover:bg-[#1E1F23] border border-[#2A2B30] rounded text-xs font-mono uppercase tracking-wider transition-colors text-white"
              title="Instalar como App"
            >
              <span>⬇ App</span>
            </button>
          )}
        </div>
      </div>
      
      {(() => {
        // Médias dos últimos snapshots
        const cpuVals = history.map((h: any) => h.cpu_pct).filter((v: any) => v != null);
        const memVals = history.map((h: any) => h.mem_pct).filter((v: any) => v != null);
        const snapshotCount = history.length;

        // Tokens/hora: baseado nos snapshots com timestamp mais antigo e mais recente
        let tokensPerHour: number | undefined = undefined;
        if (history.length >= 2 && data?.openclaw?.rich?.token_usage?.total_tokens) {
          const oldest = history[history.length - 1];
          const newest = history[0];
          if (oldest?.timestamp && newest?.timestamp) {
            const diffHours = (new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 3600000;
            if (diffHours > 0) {
              // Estimativa baseada na taxa de crescimento dos tokens totais vs janela de tempo
              tokensPerHour = Math.round(data.openclaw.rich.token_usage.total_tokens / Math.max(diffHours, 1));
            }
          }
        }
        const cpuAvg = cpuVals.length ? cpuVals.reduce((a: number, b: number) => a + b, 0) / cpuVals.length : undefined;
        const memAvg = memVals.length ? memVals.reduce((a: number, b: number) => a + b, 0) / memVals.length : undefined;
        // Providers ativos vs total
        const providers = data?.openclaw?.rich?.providers || {};
        const providerEntries = Object.values(providers) as any[];
        const totalProviders = providerEntries.length;
        const activeProviders = providerEntries.filter((p: any) => p?.enabled || p?.active || p?.status === 'active').length;
        return (
          <MiniMetricStrip
            cpu={data?.system?.cpu?.usage_pct || data?.system?.cpu?.usage_percent || 0}
            memory={data?.system?.memory?.usage_pct || data?.system?.memory?.usage_percent || 0}
            disk={data?.system?.disk?.usage_pct || data?.system?.disk?.usage_percent || 0}
            totalTokens={data?.openclaw?.rich?.token_usage?.total_tokens || 0}
            activeSessions={data?.openclaw?.rich?.sessions?.count || 0}
            warnings={0}
            errors={0}
            cpuAvg={cpuAvg}
            memAvg={memAvg}
            activeProviders={activeProviders}
            totalProviders={totalProviders}
            networkSentMb={data?.system?.network?.bytes_sent_mb}
            networkRecvMb={data?.system?.network?.bytes_recv_mb}
            snapshotCount={snapshotCount}
            tokensPerHour={tokensPerHour}
          />
        );
      })()}

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
        {/* Operations Tab */}
        {activeTab === 'operations' && (() => {
          const insights = generateInsights(data, history);
          const healthScore = computeHealthScore(data, history);
          const load1  = data?.system?.load_avg?.['1min']  ?? 0;
          const load5  = data?.system?.load_avg?.['5min']  ?? 0;
          const load15 = data?.system?.load_avg?.['15min'] ?? 0;
          const cronJobs = data?.openclaw?.rich?.cron_jobs?.jobs ?? [];
          return (
          <div className="space-y-5">
            {/* Row 1: Hero metrics */}
            <HeroMetrics
              data={{
                cpu: data?.system?.cpu?.usage_pct || data?.system?.cpu?.usage_percent || 0,
                mem: data?.system?.memory?.usage_pct || data?.system?.memory?.usage_percent || 0,
                disk: data?.system?.disk?.usage_pct || data?.system?.disk?.usage_percent || 0,
                totalTokens: data?.openclaw?.rich?.token_usage?.total_tokens || 0,
                sessions: data?.openclaw?.rich?.sessions?.count || 0,
                apiStatus: data?.openclaw?.api?.found || false,
              }}
              history={history}
            />

            {/* Row 2: Intelligence strip */}
            <IntelligencePanel insights={insights} />

            {/* Row 3: Health + Load + Cron + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SystemHealthScore score={healthScore} />
              <LoadAverageWidget
                load1={load1} load5={load5} load15={load15}
                physicalCores={data?.system?.cpu?.physical_cores || 4}
              />
              <CronHealthPanel jobs={cronJobs} />
              <OpenClawStatusCard data={data} />
            </div>

            {/* Row 4: Multi-timeline (full width) */}
            <MultiTimeline history={history} cronJobs={data?.openclaw?.rich?.cron_jobs} />

            {/* Row 5: Memory + ProcessTreemap + TokenFlow + Providers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="space-y-5">
                <MemoryPressureWidget
                  totalGb={data?.system?.memory?.total_gb || 0}
                  usedGb={data?.system?.memory?.used_gb || 0}
                  availableGb={data?.system?.memory?.available_gb || 0}
                  swapTotalGb={data?.system?.memory?.swap_total_gb}
                  swapUsedGb={data?.system?.memory?.swap_used_gb}
                  swapPct={data?.system?.memory?.swap_pct}
                  topProcesses={data?.system?.top_processes || []}
                />
                <ProviderHealth
                  models={llms.length > 0 ? llms
                    : Object.entries(data?.openclaw?.rich?.providers || {}).flatMap(
                        ([providerName, p]: [string, any]) =>
                          (p?.models || []).map((m: any) => ({
                            id: m.id || m.name, name: m.name || m.id,
                            provider: providerName,
                            state: p?.api ? 'online' : 'offline',
                            context_window: m.context_window,
                            max_tokens: m.max_tokens,
                          }))
                      )
                  }
                />
              </div>
              <div className="space-y-5">
                <ProcessTreemap processes={Array.isArray(data?.openclaw?.processes) ? data.openclaw.processes : []} />
                <DiskForecast history={history} currentDisk={data?.system?.disk?.usage_pct || data?.system?.disk?.usage_percent} />
              </div>
              <div>
                <TokenFlowPanel
                  promptTokens={data?.openclaw?.rich?.token_usage?.total_input || 0}
                  completionTokens={data?.openclaw?.rich?.token_usage?.total_output || 0}
                  totalTokens={data?.openclaw?.rich?.token_usage?.total_tokens || 0}
                  topModel={data?.openclaw?.rich?.token_usage?.per_model?.reduce(
                    (top: any, m: any) => (!top || m.total > top.total ? m : top), null as any
                  )?.model || '—'}
                  requestsPerMin={data?.openclaw?.rich?.token_usage?.per_model?.reduce((s: number, m: any) => s + (m.calls || 0), 0) || 0}
                  limit={200000000}
                />
              </div>
            </div>
          </div>
          );
        })()}

        {/* Diagnostics Tab */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-5">
            {/* Row 1: Log + Sessions side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <SmartLogViewer logs={data?.openclaw?.rich?.gateway_log || { tail: [] }} className="h-[420px]" />
              </div>
              <div className="space-y-4">
                <SessionList sessions={data?.openclaw?.rich?.sessions} />
                <SyncHealth
                  lastUpdated={data?.last_updated || data?.timestamp}
                  deviceId={data?.id || data?.device_id}
                />
              </div>
            </div>
            {/* Row 2: Process table full width */}
            <ProcessTable processes={Array.isArray(data?.openclaw?.processes) ? data.openclaw.processes : []} />
            {/* Row 3: System details + Integrations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <SystemDetails system={data?.system} />
              </div>
              <div className="space-y-4">
                <ChannelBreakdown sessions={data?.openclaw?.rich?.sessions} />
                <IntegrationList data={data?.openclaw} />
              </div>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-5">
            {/* Model Insights Table — full analytics */}
            <ModelInsightsTable
              tokenUsage={data?.openclaw?.rich?.token_usage}
              ollamaModels={data?.openclaw?.rich?.ollama_models}
            />
            {/* LLMAnalytics charts below */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <LLMAnalytics usage={data?.openclaw?.rich?.token_usage} models={llms} />
              </div>
              <div className="space-y-5">
                <ModelEfficiencyTable
                  models={llms.length > 0 ? llms
                    : (data?.openclaw?.rich?.token_usage?.per_model || []).map((m: any) => ({
                        id: m.model, name: m.model,
                        provider: m.provider || 'Unknown',
                        state: 'online' as const,
                        context_window: 0, max_tokens: 0,
                      }))
                  }
                  tokenUsage={data?.openclaw?.rich?.token_usage || {}}
                />
                <ProviderHealth
                  models={llms.length > 0 ? llms
                    : Object.entries(data?.openclaw?.rich?.providers || {}).flatMap(
                        ([providerName, p]: [string, any]) =>
                          (p?.models || []).map((m: any) => ({
                            id: m.id || m.name, name: m.name || m.id,
                            provider: providerName,
                            state: p?.api ? 'online' : 'offline',
                            context_window: m.context_window,
                            max_tokens: m.max_tokens,
                          }))
                      )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
