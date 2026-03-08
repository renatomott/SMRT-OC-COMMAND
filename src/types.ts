export interface SystemMetrics {
  cpu: {
    usage: number;
    physical_cores?: number;
    logical_cores?: number;
    freq_mhz_current?: number;
  };
  memory: {
    usage: number;
    total: number; // in GB or MB, normalize in component
    free: number;
    used_gb?: number;
    total_gb?: number;
    available_gb?: number;
    swap_pct?: number;
    swap_used_gb?: number;
  };
  disk: {
    usage: number;
    total: number;
    free: number;
    used_gb?: number;
    total_gb?: number;
    io?: {
      read_mb: number;
      write_mb: number;
    };
    partitions?: Array<{
      mount: string;
      device: string;
      total: number;
      used: number;
      percent: number;
    }>;
  };
  load?: {
    "1min": number;
    "5min": number;
    "15min": number;
  };
  uptime?: {
    uptime_hours: number;
    boot_time: string | number;
  };
  network?: {
    bytes_sent_mb: number;
    bytes_recv_mb: number;
  };
}

export interface SessionData {
  count: number;
  size_mb: number;
  channels: {
    whatsapp: number;
    discord: number;
    subagent: number;
    other: number;
  };
  details: {
    whatsapp: string[];
    discord: string[];
  };
}

export interface ProcessData {
  pid: number;
  name: string;
  status: string;
  cpu: number;
  memory: number;
}

export interface CronJob {
  schedule: string;
  command?: string;
  last_run?: string;
  consecutive_errors?: number;
}

export interface LLMData {
  id: string;
  name: string;
  provider: string;
  state: string;
  context_window?: number;
  max_tokens?: number;
  total_tokens?: number; // Aggregated usage
}

export interface UsageLogData {
  id: string;
  timestamp: string | any;
  llmId: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsage {
  total_tokens: number;
  total_input: number;
  total_output: number;
  per_model?: Array<{
    model: string;
    provider?: string;
    input: number;
    output: number;
    total: number;
  }>;
}

export interface OpenClawData {
  status: string;
  directory: string;
  api: {
    status: string;
    version?: string;
    found?: boolean;
    port?: number;
    base_url?: string;
    [key: string]: any;
  };
  processes: {
    [key: string]: {
      pid: number;
      status: string;
      cpu?: number;
      memory?: number;
      name?: string;
    };
  } | string[] | any[]; // Handle array or object
  rich: {
    providers: {
      [key: string]: any;
    };
    sessions: {
      [key: string]: any;
    };
    token_usage?: TokenUsage;
    cron_jobs?: {
      jobs: CronJob[];
    };
    ollama_models?: any[];
    gateway_log?: {
      total_lines: number;
      size_mb: number;
      tail: string[];
    };
  };
  sessions?: SessionData;
  cron?: {
    count: number;
    jobs: CronJob[];
  };
  ollama?: {
    models: string[];
  };
  integrations?: {
    env_keys: string[];
  };
  logs?: {
    gateway: {
      total_lines: number;
      size_mb: number;
      tail: string[];
    };
  };
}

export interface TelemetryData {
  id: string;
  createdAt: string | any; // Timestamp or string
  openclaw: OpenClawData;
  system: SystemMetrics;
}
