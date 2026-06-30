export type PerformanceSeverity = 'critical' | 'warning' | 'info';

export type PerformanceFinding = {
  code: string;
  severity: PerformanceSeverity;
  category: 'server' | 'network' | 'assets' | 'javascript' | 'dom' | string;
  title: string;
  message: string;
  evidence?: string[];
};

export type NetworkResourceRow = {
  url: string;
  method: string;
  status: number;
  durationMs: number;
  transferSize: number;
  resourceType: string;
};

export type PerformanceMetrics = {
  ttfbMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  domCompleteMs: number | null;
  loadTimeMs: number | null;
  requestCount: number;
  failedRequestCount: number;
  totalTransferBytes: number;
  domElementCount: number;
  consoleErrorCount: number;
  thirdPartyBytes: number;
  finalUrl: string;
  pageTitle: string;
  scanMode?: 'stable';
  runCount?: number;
  scoreMin?: number;
  scoreMax?: number;
};

export type PerformanceAuthWarning = {
  warning: string;
  redirectedTo: string;
  hint: string;
  loginError?: string;
};

export type PerformanceScanResult = {
  _id: string;
  url: string;
  viewport: string;
  score: number;
  metrics: PerformanceMetrics;
  findings: PerformanceFinding[];
  networkTop: NetworkResourceRow[];
  durationMs: number;
  createdAt: string;
  authWarning?: PerformanceAuthWarning;
};

export type PerformanceViewport = 'desktop' | 'mobile';
