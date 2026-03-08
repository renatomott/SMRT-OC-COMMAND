import { TelemetryData } from '../types';

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'good';
export type InsightCategory = 'system' | 'ai' | 'cron' | 'memory' | 'network' | 'power' | 'model';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  detail: string;
  metric?: string; // e.g. "87%" or "3 erros"
}

export interface SystemHealthScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: { label: string; value: number; weight: number; ok: boolean }[];
}

/** Compute 0-100 health score */
export function computeHealthScore(data: TelemetryData | null, history: any[]): SystemHealthScore {
  if (!data) return { score: 0, grade: 'F', factors: [] };

  const cpu    = data.system?.cpu?.usage_pct    ?? data.system?.cpu?.usage_percent    ?? 0;
  const mem    = data.system?.memory?.usage_pct  ?? data.system?.memory?.usage_percent  ?? 0;
  const disk   = data.system?.disk?.usage_pct    ?? data.system?.disk?.usage_percent    ?? 0;
  const swap   = data.system?.memory?.swap_pct   ?? 0;
  const load1  = data.system?.load_avg?.['1min'] ?? 0;
  const load15 = data.system?.load_avg?.['15min'] ?? 1;
  const cronJobs   = data.openclaw?.rich?.cron_jobs?.jobs ?? [];
  const failingCron = cronJobs.filter(j => (j.consecutive_errors ?? 0) > 0).length;
  const apiUp  = data.openclaw?.api?.found ? 1 : 0;
  const thermal = (data.system as any)?.power?.thermal_pressure ?? 'Nominal';
  const thermalOk = thermal === 'Nominal' || thermal === 'nominal';

  // Score each factor (100 = perfect)
  const cpuScore    = Math.max(0, 100 - cpu * 1.2);
  const memScore    = Math.max(0, 100 - mem * 1.1);
  const diskScore   = Math.max(0, 100 - Math.max(0, disk - 60) * 2.5);
  const swapScore   = swap < 5 ? 100 : swap < 30 ? 70 : 30;
  const loadScore   = load15 > 0 ? Math.max(0, 100 - ((load1 / load15) - 0.8) * 80) : 80;
  const cronScore   = cronJobs.length > 0 ? Math.max(0, 100 - (failingCron / cronJobs.length) * 100) : 100;
  const apiScore    = apiUp * 100;
  const thermalScore = thermalOk ? 100 : 50;

  const factors = [
    { label: 'CPU',     value: cpuScore,     weight: 0.20, ok: cpu < 85 },
    { label: 'Memória', value: memScore,     weight: 0.20, ok: mem < 90 },
    { label: 'Disco',   value: diskScore,    weight: 0.10, ok: disk < 90 },
    { label: 'Swap',    value: swapScore,    weight: 0.10, ok: swap < 10 },
    { label: 'Load',    value: loadScore,    weight: 0.15, ok: load1 <= load15 * 1.2 },
    { label: 'Cron',    value: cronScore,    weight: 0.10, ok: failingCron === 0 },
    { label: 'API',     value: apiScore,     weight: 0.10, ok: !!apiUp },
    { label: 'Thermal', value: thermalScore, weight: 0.05, ok: thermalOk },
  ];

  const score = Math.round(
    factors.reduce((acc, f) => acc + f.value * f.weight, 0)
  );

  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';
  return { score, grade, factors };
}

/** Generate insight list */
export function generateInsights(data: TelemetryData | null, history: any[]): Insight[] {
  if (!data) return [];
  const insights: Insight[] = [];

  const cpu    = data.system?.cpu?.usage_pct    ?? data.system?.cpu?.usage_percent    ?? 0;
  const mem    = data.system?.memory?.usage_pct  ?? data.system?.memory?.usage_percent  ?? 0;
  const disk   = data.system?.disk?.usage_pct    ?? data.system?.disk?.usage_percent    ?? 0;
  const swap   = data.system?.memory?.swap_pct   ?? 0;
  const swapGb = data.system?.memory?.swap_used_gb ?? 0;
  const load1  = data.system?.load_avg?.['1min']  ?? 0;
  const load5  = data.system?.load_avg?.['5min']  ?? 0;
  const load15 = data.system?.load_avg?.['15min'] ?? 0;
  const sentMb = data.system?.network?.bytes_sent_mb ?? 0;
  const recvMb = data.system?.network?.bytes_recv_mb ?? 0;
  const diskWriteMb = data.system?.disk?.io?.write_mb ?? 0;
  const diskReadMb  = data.system?.disk?.io?.read_mb  ?? 0;
  const cpuMw  = (data.system as any)?.power?.cpu_mw   ?? 0;
  const aneMw  = (data.system as any)?.power?.ane_mw   ?? 0;
  const combMw = (data.system as any)?.power?.combined_mw ?? 0;
  const thermal = (data.system as any)?.power?.thermal_pressure ?? 'Nominal';
  const cronJobs = data.openclaw?.rich?.cron_jobs?.jobs ?? [];
  const tokenUsage = data.openclaw?.rich?.token_usage;
  const sessions = data.openclaw?.rich?.sessions;

  // ── SYSTEM ──────────────────────────────────────────────

  if (cpu > 85) insights.push({
    id: 'cpu-high', severity: 'critical', category: 'system',
    title: 'CPU sob pressão severa',
    detail: `Uso em ${cpu.toFixed(1)}% — pode causar latência nas respostas do bot`,
    metric: `${cpu.toFixed(0)}%`,
  });

  if (mem > 90) insights.push({
    id: 'mem-critical', severity: 'critical', category: 'memory',
    title: 'Memória crítica',
    detail: `${mem.toFixed(1)}% utilizado — risco de OOM. Reiniciar processos pesados pode ajudar.`,
    metric: `${mem.toFixed(0)}%`,
  });

  // Load trend
  if (load15 > 0) {
    if (load1 > load15 * 1.5) insights.push({
      id: 'load-climbing', severity: 'warning', category: 'system',
      title: 'Pressão de carga crescente',
      detail: `Load 1m (${load1}) está ${((load1/load15-1)*100).toFixed(0)}% acima do 15m (${load15}) — sistema sob pressão crescente`,
      metric: `${load1} vs ${load15}`,
    });
    else if (load1 < load15 * 0.7 && load15 > 1.5) insights.push({
      id: 'load-recovering', severity: 'good', category: 'system',
      title: 'Sistema se recuperando',
      detail: `Load caiu de ${load15} (15m) para ${load1} (1m) — pressão anterior diminuindo`,
      metric: `↓ ${load1}`,
    });
  }

  // Memory leak detection via history
  if (history.length >= 10) {
    const recent = history.slice(-10);
    const memSlope = (recent[9].memory - recent[0].memory);
    const cpuDelta = Math.abs(recent[9].cpu - recent[0].cpu);
    if (memSlope > 8 && cpuDelta < 3) insights.push({
      id: 'mem-leak', severity: 'warning', category: 'memory',
      title: 'Possível vazamento de memória',
      detail: `Memória subiu ${memSlope.toFixed(1)}pp nos últimos ${history.length} snapshots enquanto CPU ficou estável — padrão de memory leak`,
      metric: `+${memSlope.toFixed(1)}pp`,
    });
  }

  // Swap pressure
  if (swapGb > 0.5) insights.push({
    id: 'swap-active', severity: swap > 20 ? 'warning' : 'info', category: 'memory',
    title: 'Swap em uso',
    detail: `${swapGb.toFixed(1)} GB de swap ativo (${swap.toFixed(0)}%) — sistema usando disco como memória. Performance degradada.`,
    metric: `${swapGb.toFixed(1)} GB`,
  });

  // Disk high
  if (disk > 85) insights.push({
    id: 'disk-high', severity: disk > 93 ? 'critical' : 'warning', category: 'system',
    title: disk > 93 ? 'Disco quase cheio' : 'Disco com pouco espaço',
    detail: `${disk.toFixed(1)}% utilizado — considere limpar modelos Ollama antigos ou logs`,
    metric: `${disk.toFixed(0)}%`,
  });

  // ── POWER ───────────────────────────────────────────────

  if (aneMw > 100) insights.push({
    id: 'ane-active', severity: 'good', category: 'power',
    title: 'Neural Engine ativo',
    detail: `Apple Neural Engine consumindo ${aneMw} mW — modelos otimizados para Apple Silicon estão rodando`,
    metric: `${aneMw} mW`,
  });

  if (cpuMw > 0 && cpu > 5) {
    const effRatio = cpuMw / cpu;
    if (effRatio > 80) insights.push({
      id: 'power-high', severity: 'info', category: 'power',
      title: 'Alto consumo energético por unidade de CPU',
      detail: `${effRatio.toFixed(0)} mW por 1% de CPU — carga de trabalho intensiva em energia (possivelmente inferência LLM)`,
      metric: `${effRatio.toFixed(0)} mW/%`,
    });
  }

  if (thermal !== 'Nominal' && thermal !== 'nominal') insights.push({
    id: 'thermal-pressure', severity: thermal === 'Serious' || thermal === 'Critical' ? 'critical' : 'warning', category: 'power',
    title: `Pressão térmica: ${thermal}`,
    detail: `Sistema em throttling térmico — frequências reduzidas para controlar temperatura. Verifique ventilação.`,
    metric: thermal,
  });

  // ── AI / MODELS ──────────────────────────────────────────

  if (tokenUsage?.per_model && tokenUsage.per_model.length > 0) {
    const sorted = [...tokenUsage.per_model].sort((a, b) => b.total - a.total);
    const topModel = sorted[0];
    const totalTok = tokenUsage.total_tokens || 1;
    const dominance = (topModel.total / totalTok * 100);
    if (dominance > 75) insights.push({
      id: 'model-dominant', severity: 'info', category: 'model',
      title: 'Modelo dominante detectado',
      detail: `${topModel.model} representa ${dominance.toFixed(0)}% de todos os tokens. Considere distribuir carga.`,
      metric: `${dominance.toFixed(0)}%`,
    });

    // Cost efficiency
    sorted.forEach(m => {
      if (m.calls > 0) {
        const avgTokensPerCall = m.total / m.calls;
        if (avgTokensPerCall > 50000) insights.push({
          id: `model-expensive-${m.model}`, severity: 'info', category: 'model',
          title: `Chamadas pesadas: ${m.model}`,
          detail: `Média de ${(avgTokensPerCall/1000).toFixed(0)}K tokens por chamada — considere prompt mais curto ou chunking`,
          metric: `${(avgTokensPerCall/1000).toFixed(0)}K/call`,
        });
      }
    });

    // Output ratio
    const totalInput = tokenUsage.total_input || 1;
    const totalOutput = tokenUsage.total_output || 0;
    const ratio = totalOutput / totalInput;
    if (ratio < 0.2) insights.push({
      id: 'low-output-ratio', severity: 'info', category: 'ai',
      title: 'Baixa taxa de output',
      detail: `Output/Input ratio = ${ratio.toFixed(2)} — prompts longos com respostas curtas. Pode indicar falhas ou respostas truncadas.`,
      metric: ratio.toFixed(2),
    });
  }

  // Ollama vs token usage gap
  const ollamaModels = data.openclaw?.rich?.ollama_models ?? [];
  const tokenModels  = tokenUsage?.per_model?.map(m => m.model) ?? [];
  const unusedOllama = ollamaModels.filter(om => !tokenModels.some(tm => tm.includes(om.name.split(':')[0])));
  if (unusedOllama.length > 0) insights.push({
    id: 'ollama-unused', severity: 'info', category: 'model',
    title: `${unusedOllama.length} modelo${unusedOllama.length > 1 ? 's' : ''} Ollama sem uso`,
    detail: `${unusedOllama.map(m => m.name).join(', ')} — ocupando ${unusedOllama.reduce((s, m) => s + (m.size_gb || 0), 0).toFixed(1)} GB sem registrar tokens`,
    metric: `${unusedOllama.reduce((s, m) => s + (m.size_gb || 0), 0).toFixed(1)} GB`,
  });

  // ── CRON ────────────────────────────────────────────────

  const failingJobs = cronJobs.filter(j => (j.consecutive_errors ?? 0) > 0);
  if (failingJobs.length > 0) {
    failingJobs.forEach(j => insights.push({
      id: `cron-fail-${j.id || j.name}`, severity: (j.consecutive_errors ?? 0) > 2 ? 'critical' : 'warning', category: 'cron',
      title: `Cron falhando: ${j.name}`,
      detail: `${j.consecutive_errors} erro${(j.consecutive_errors ?? 0) > 1 ? 's' : ''} consecutivo${(j.consecutive_errors ?? 0) > 1 ? 's' : ''} — último status: ${j.last_run_status || 'desconhecido'}`,
      metric: `${j.consecutive_errors}x`,
    }));
  }

  // Next cron
  const enabledJobs = cronJobs.filter(j => j.enabled !== false && j.next_run_at);
  if (enabledJobs.length > 0) {
    const sorted = [...enabledJobs].sort((a, b) =>
      new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime()
    );
    const next = sorted[0];
    const minsUntil = Math.round((new Date(next.next_run_at!).getTime() - Date.now()) / 60000);
    if (minsUntil >= 0 && minsUntil < 10) insights.push({
      id: 'cron-imminent', severity: 'info', category: 'cron',
      title: `Cron em ${minsUntil < 1 ? 'menos de 1 min' : minsUntil + ' min'}`,
      detail: `"${next.name}" dispara em ${minsUntil < 1 ? 'instantes' : minsUntil + ' minutos'} via ${next.delivery_channel || '?'} com ${next.model || '?'}`,
      metric: minsUntil < 1 ? 'agora' : `${minsUntil}m`,
    });
  }

  // ── NETWORK ──────────────────────────────────────────────

  if (sentMb > 0 && recvMb > 0) {
    const ratio = sentMb / recvMb;
    if (ratio > 3) insights.push({
      id: 'net-outbound', severity: 'info', category: 'network',
      title: 'Alto tráfego de saída',
      detail: `${ratio.toFixed(1)}x mais dados enviados (${sentMb.toFixed(0)} MB) do que recebidos (${recvMb.toFixed(0)} MB) — bot entregando muitas respostas`,
      metric: `${sentMb.toFixed(0)} MB ↑`,
    });
    if (ratio < 0.3) insights.push({
      id: 'net-inbound', severity: 'info', category: 'network',
      title: 'Alto tráfego de entrada',
      detail: `${recvMb.toFixed(0)} MB recebidos vs ${sentMb.toFixed(0)} MB enviados — possível download de modelo ou dados externos`,
      metric: `${recvMb.toFixed(0)} MB ↓`,
    });
  }

  // Disk I/O
  if (diskWriteMb > diskReadMb * 2 && diskWriteMb > 100) insights.push({
    id: 'disk-heavy-write', severity: 'info', category: 'system',
    title: 'Escrita intensa em disco',
    detail: `${diskWriteMb.toFixed(0)} MB escritos vs ${diskReadMb.toFixed(0)} MB lidos — possível cache de inferência ou logs volumosos`,
    metric: `${diskWriteMb.toFixed(0)} MB ↑`,
  });

  // Session vs process
  const sessionCount = sessions?.count ?? 0;
  const procCount    = data.openclaw?.processes?.length ?? 0;
  if (sessionCount > 0 && procCount > 0 && sessionCount / procCount > 20) insights.push({
    id: 'sessions-per-proc', severity: 'info', category: 'ai',
    title: 'Alta densidade de sessões',
    detail: `${sessionCount} sessões distribuídas em apenas ${procCount} processos — sistema eficiente ou potencialmente sobrecarregado`,
    metric: `${(sessionCount/procCount).toFixed(0)} sess/proc`,
  });

  // All good case
  if (insights.filter(i => i.severity === 'critical' || i.severity === 'warning').length === 0) {
    insights.unshift({
      id: 'all-good', severity: 'good', category: 'system',
      title: 'Sistema operando normalmente',
      detail: 'Nenhuma anomalia detectada. CPU, memória, cron jobs e modelos dentro dos parâmetros esperados.',
      metric: '✓',
    });
  }

  // Sort: critical → warning → info → good
  const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Compute load average trend label */
export function loadTrend(load1: number, load5: number, load15: number): {
  label: string; direction: 'up' | 'down' | 'stable'; color: string;
} {
  if (load15 === 0) return { label: 'Estável', direction: 'stable', color: '#8E9299' };
  const ratio = load1 / load15;
  if (ratio > 1.3)  return { label: 'Subindo',    direction: 'up',     color: '#ef4444' };
  if (ratio < 0.7)  return { label: 'Caindo',     direction: 'down',   color: '#22c55e' };
  return { label: 'Estável', direction: 'stable', color: '#8E9299' };
}
