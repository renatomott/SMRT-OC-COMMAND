import React, { useState } from 'react';
import { FileText, Loader } from 'lucide-react';
import { TelemetryData } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PdfReportProps {
  data: TelemetryData | null;
}

export function PdfReport({ data }: PdfReportProps) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!data) return;
    setGenerating(true);

    const now = new Date();
    const ts = format(now, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    const cpu = data.system?.cpu?.usage_pct ?? data.system?.cpu?.usage_percent ?? 0;
    const mem = data.system?.memory?.usage_pct ?? data.system?.memory?.usage_percent ?? 0;
    const disk = data.system?.disk?.usage_pct ?? data.system?.disk?.usage_percent ?? 0;
    const tokens = data.openclaw?.rich?.token_usage?.total_tokens ?? 0;
    const sessions = data.openclaw?.rich?.sessions?.count ?? 0;
    const cronJobs = data.openclaw?.rich?.cron_jobs?.jobs ?? [];
    const processes = data.openclaw?.processes ?? [];
    const perModel = data.openclaw?.rich?.token_usage?.per_model ?? [];

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>OpenClaw Report — ${ts}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; background:#fff; color:#111; padding:32px; font-size:11px; }
  h1 { font-size:20px; font-weight:bold; border-bottom:2px solid #111; padding-bottom:8px; margin-bottom:4px; }
  .meta { color:#555; font-size:10px; margin-bottom:24px; }
  h2 { font-size:13px; font-weight:bold; margin:20px 0 8px; border-left:3px solid #111; padding-left:8px; text-transform:uppercase; letter-spacing:.05em; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
  .card { border:1px solid #ddd; border-radius:4px; padding:10px; }
  .card .label { font-size:9px; text-transform:uppercase; color:#888; letter-spacing:.05em; }
  .card .value { font-size:18px; font-weight:bold; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  th { text-align:left; font-size:9px; text-transform:uppercase; color:#888; border-bottom:1px solid #ddd; padding:4px 6px; }
  td { padding:4px 6px; border-bottom:1px solid #f0f0f0; font-size:10px; }
  tr:last-child td { border-bottom:none; }
  .badge { display:inline-block; padding:1px 6px; border-radius:3px; font-size:9px; font-weight:bold; text-transform:uppercase; }
  .badge-green { background:#dcfce7; color:#16a34a; }
  .badge-yellow { background:#fef9c3; color:#ca8a04; }
  .badge-red { background:#fee2e2; color:#dc2626; }
  .footer { margin-top:32px; border-top:1px solid #ddd; padding-top:8px; color:#888; font-size:9px; text-align:center; }
</style>
</head>
<body>
<h1>OPENCLAW — Relatório de Status</h1>
<div class="meta">Gerado em ${ts} · Dispositivo: ${data.id || data.hostname || '—'} · Status: ${(data.openclaw?.status || 'unknown').toUpperCase()}</div>

<h2>Métricas do Sistema</h2>
<div class="grid">
  <div class="card"><div class="label">CPU</div><div class="value">${cpu.toFixed(1)}%</div></div>
  <div class="card"><div class="label">Memória</div><div class="value">${mem.toFixed(1)}%</div></div>
  <div class="card"><div class="label">Disco</div><div class="value">${disk.toFixed(1)}%</div></div>
  <div class="card"><div class="label">Uptime</div><div class="value">${data.system?.uptime?.uptime_hours?.toFixed(0) ?? '—'}h</div></div>
</div>
<div class="grid">
  <div class="card"><div class="label">Total Tokens</div><div class="value">${tokens.toLocaleString('pt-BR')}</div></div>
  <div class="card"><div class="label">Sessões</div><div class="value">${sessions}</div></div>
  <div class="card"><div class="label">RAM Total</div><div class="value">${data.system?.memory?.total_gb?.toFixed(1) ?? '—'} GB</div></div>
  <div class="card"><div class="label">Disco Total</div><div class="value">${data.system?.disk?.total_gb?.toFixed(0) ?? '—'} GB</div></div>
</div>

<h2>Uso por Modelo</h2>
<table>
  <tr><th>Modelo</th><th>Provider</th><th>Input</th><th>Output</th><th>Total</th><th>Custo (USD)</th></tr>
  ${perModel.map(m => `<tr>
    <td>${m.model}</td>
    <td>${m.provider || '—'}</td>
    <td>${m.input?.toLocaleString('pt-BR') ?? 0}</td>
    <td>${m.output?.toLocaleString('pt-BR') ?? 0}</td>
    <td><strong>${m.total?.toLocaleString('pt-BR') ?? 0}</strong></td>
    <td>$${(m.cost ?? 0).toFixed(4)}</td>
  </tr>`).join('') || '<tr><td colspan="6" style="color:#888;font-style:italic">Sem dados</td></tr>'}
</table>

<h2>Processos (${processes.length})</h2>
<table>
  <tr><th>PID</th><th>Nome</th><th>Status</th><th>CPU%</th><th>Mem (MB)</th><th>Iniciado</th></tr>
  ${processes.map(p => {
    const cpu = (p as any).cpu_pct ?? (p as any).cpu ?? 0;
    const mem = (p as any).mem_mb ?? (p as any).memory ?? 0;
    const badge = p.status === 'running' ? 'badge-green' : p.status === 'sleeping' ? 'badge-yellow' : 'badge-red';
    return `<tr>
      <td>${p.pid ?? '—'}</td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge ${badge}">${p.status || '—'}</span></td>
      <td>${cpu.toFixed(1)}%</td>
      <td>${mem > 0 ? mem.toFixed(0) : '—'}</td>
      <td>${p.started ? new Date(p.started).toLocaleString('pt-BR') : '—'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="color:#888;font-style:italic">Sem dados</td></tr>'}
</table>

<h2>Cron Jobs (${cronJobs.length})</h2>
<table>
  <tr><th>Nome</th><th>Schedule</th><th>Último Run</th><th>Próximo Run</th><th>Status</th><th>Erros</th></tr>
  ${cronJobs.map(j => {
    const badge = !j.last_run_status || j.last_run_status === 'success' ? 'badge-green' : 'badge-red';
    return `<tr>
      <td><strong>${j.name || '—'}</strong></td>
      <td>${j.schedule}</td>
      <td>${j.last_run_at || '—'}</td>
      <td>${j.next_run_at || '—'}</td>
      <td><span class="badge ${badge}">${j.last_run_status || 'ok'}</span></td>
      <td>${j.consecutive_errors ?? 0}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="color:#888;font-style:italic">Sem dados</td></tr>'}
</table>

<div class="footer">OpenClaw SMRT Command · ${ts} · openclaw_telemetry/${data.id || '—'}</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); setGenerating(false); }, 500);
    } else {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generate}
      disabled={!data || generating}
      className="flex items-center gap-2 px-3 py-2 bg-[#151619] hover:bg-[#1E1F23] border border-[#2A2B30] rounded text-xs font-mono uppercase tracking-wider transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
      title="Baixar Relatório PDF"
    >
      {generating
        ? <Loader className="w-4 h-4 animate-spin" />
        : <FileText className="w-4 h-4" />}
      <span className="hidden sm:inline">PDF</span>
    </button>
  );
}
