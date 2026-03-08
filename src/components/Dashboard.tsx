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
import { LayoutDashboard, Activity, Brain, FileText } from 'lucide-react';

export function Dashboard() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [llms, setLlms] = useState<LLMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [opsMode, setOpsMode] = useState(false);
  const innerUnsubRef = useRef<(() => void) | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'operations' | 'diagnostics' | 'models'>('operations');

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
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans flex flex-col">
      {/* Level 1: Command Layer */}
      <TopCommandBar 
        status={data?.openclaw?.status === 'running' ? 'online' : 'offline'}
        systemId={data?.hostname || data?.device_id || "OC-2024-X1"}
        region={data?.id || data?.hostname || data?.device_id || 'OC-PROD'}
        onSync={handleSync}
        onOpsMode={() => setOpsMode(true)}
      />
      
      <MiniMetricStrip 
        cpu={data?.system?.cpu?.usage_pct || data?.system?.cpu?.usage_percent || 0}
        memory={data?.system?.memory?.usage_pct || data?.system?.memory?.usage_percent || 0}
        disk={data?.system?.disk?.usage_pct || data?.system?.disk?.usage_percent || 0}
        totalTokens={data?.openclaw?.rich?.token_usage?.total_tokens || 0}
        activeSessions={data?.openclaw?.rich?.sessions?.count || 0}
        warnings={0}
        errors={0}
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
      </div>
    </div>
  );
}
