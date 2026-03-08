export interface SystemMetrics {
  platform?: string;
  release?: string;
  version?: string;
  machine?: string;
  processor?: string;
  hostname?: string;
  python?: string;
  cpu: {
    physical_cores: number;
    logical_cores: number;
    usage_pct?: number;
    usage_percent?: number; // Alias
    usage_per_core?: number[];
    freq_mhz_current?: number;
    freq_mhz_max?: number;
    usage?: number; // Legacy support
  };
  memory: {
    total_gb: number;
    available_gb: number;
    used_gb: number;
    usage_pct?: number;
    usage_percent?: number; // Alias
    used?: number; // bytes
    total?: number; // bytes
    swap_total_gb?: number;
    swap_used_gb?: number;
    swap_pct?: number;
    usage?: number; // Legacy support
    free?: number; // Legacy support
  };
  disk: {
    usage_pct?: number;
    usage_percent?: number; // Alias
    used?: number; // GB or bytes
    total?: number; // GB or bytes
    usage?: number; // Legacy support
    free?: number; // Legacy support
    partitions?: Array<{
      device: string;
      mountpoint: string;
      fstype: string;
      total_gb: number;
      used_gb: number;
      free_gb: number;
      usage_pct: number;
      mount?: string; // Legacy alias
      percent?: number; // Legacy alias
      total?: number; // Legacy alias
      used?: number; // Legacy alias
    }>;
    io?: {
      read_mb: number;
      write_mb: number;
      read_count: number;
      write_count: number;
    };
  };
  network?: {
    bytes_sent_mb: number;
    bytes_recv_mb: number;
    packets_sent?: number;
    packets_recv?: number;
    errors_in?: number;
    errors_out?: number;
    drop_in?: number;
    drop_out?: number;
    interfaces?: Record<string, {
      is_up: boolean;
      speed_mbps: number;
    }>;
  };
  temperature?: {
    cpu_celsius?: string;
    note?: string;
  };
  load_avg?: {
    "1min": number;
    "5min": number;
    "15min": number;
  };
  uptime?: {
    boot_time: string;
    uptime_hours: number;
  };
  top_processes?: Array<{
    pid: number;
    name: string;
    cpu_pct: number;
    mem_pct: number;
    status: string;
  }>;
}

export interface OpenClawProcess {
  pid: number;
  name: string;
  cmdline?: string;
  cpu_pct?: number;
  mem_mb?: number;
  status?: string;
  started?: string;
  cpu?: number; // Legacy
  memory?: number; // Legacy
}

export interface CronJob {
  id?: string;
  name?: string;
  enabled?: boolean;
  schedule: string;
  model?: string;
  delivery_channel?: string;
  delivery_to?: string;
  last_run_status?: string;
  last_run_at?: string;
  next_run_at?: string;
  last_duration_s?: number;
  consecutive_errors?: number;
  last_delivered?: boolean;
  command?: string; // Legacy
  last_run?: string; // Legacy
}

export interface LLMData {
  id: string;
  name: string;
  provider: string;
  state: 'online' | 'offline' | 'maintenance' | 'active';
  context_window: number;
  max_tokens: number;
}

export interface TokenUsage {
  total_input: number;
  total_output: number;
  total_tokens: number;
  total_cost?: number;
  files_read?: number;
  per_model?: Array<{
    model: string;
    provider: string;
    input: number;
    output: number;
    total: number;
    cost: number;
    calls: number;
  }>;
}

export interface SessionData {
  count: number;
  size_mb: number;
  channels: Record<string, number>;
  whatsapp_contacts?: string[];
  discord_channels?: string[];
  active_users?: number;
  queue?: number;
  details?: {
    whatsapp: string[];
    discord: string[];
  };
}

export interface OpenClawData {
  status?: string;
  directory?: string;
  api?: {
    found: boolean;
    port?: number;
    base_url?: string;
    endpoints?: Record<string, any>;
    status?: string; // Legacy
    version?: string; // Legacy
  };
  processes?: OpenClawProcess[];
  config?: {
    ".env"?: Record<string, string>;
  };
  logs?: Record<string, any>;
  rich?: {
    providers?: Record<string, {
      base_url?: string;
      api?: string;
      model_count?: number;
      models?: Array<{
        id: string;
        name: string;
        reasoning?: boolean;
        context_window?: number;
        max_tokens?: number;
        input_types?: string[];
      }>;
    }>;
    sessions?: {
      count: number;
      size_mb: number;
      channels: Record<string, number>;
      whatsapp_contacts?: string[];
      discord_channels?: string[];
      active_users?: number; // Legacy
      queue?: number; // Legacy
      details?: any; // Legacy
    };
    cron_jobs?: {
      version?: string;
      count: number;
      jobs: CronJob[];
    };
    gateway_log?: {
      size_mb: number;
      total_lines: number;
      tail: string[];
    };
    ollama_models?: Array<{
      name: string;
      size_gb: number;
      modified_at: string;
      family: string;
      params: string;
      quantization: string;
      is_remote: boolean;
    }>;
    main_config?: Record<string, any>;
    token_usage?: TokenUsage;
  };
  // Legacy fields for backward compatibility if needed
  sessions?: any;
  cron?: any;
  ollama?: any;
  integrations?: any;
}

export interface TelemetryData {
  id: string;
  device_id?: string;
  hostname?: string;
  timestamp?: string; // ISO string
  last_updated?: string; // ISO string
  createdAt?: any; // Firestore timestamp or Date
  openclaw?: OpenClawData;
  system?: SystemMetrics;
}
