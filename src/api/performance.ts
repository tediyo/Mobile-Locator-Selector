import { API_URL } from '../config/api';
import type { PerformanceScanResult, PerformanceViewport } from '../lib/performance-types';

const SCAN_TIMEOUT_MS = 180_000;

async function perfRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null; timeoutMs?: number } = {},
): Promise<T> {
  const { token, timeoutMs = 30_000, headers, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
      },
    });
    const data = (await res.json().catch(() => ({}))) as T & { message?: string };
    if (!res.ok) {
      throw new Error((data as { message?: string }).message ?? 'Request failed');
    }
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. The server may still be scanning—try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runPerformanceScan(
  token: string | null,
  input: {
    url: string;
    viewport?: PerformanceViewport;
    cookies?: string;
    authToken?: string;
  },
): Promise<PerformanceScanResult> {
  return perfRequest<PerformanceScanResult>('/performance/scan', {
    method: 'POST',
    token,
    timeoutMs: SCAN_TIMEOUT_MS,
    body: JSON.stringify({
      url: input.url,
      viewport: input.viewport ?? 'desktop',
      cookies: input.cookies || undefined,
      authToken: input.authToken || undefined,
    }),
  });
}

export async function getPerformanceHistory(token: string): Promise<PerformanceScanResult[]> {
  return perfRequest<PerformanceScanResult[]>('/performance/history', { token });
}

export async function getPerformanceScan(token: string, id: string): Promise<PerformanceScanResult | null> {
  return perfRequest<PerformanceScanResult | null>(`/performance/history/${id}`, { token });
}

export async function deletePerformanceScan(token: string, id: string): Promise<void> {
  await perfRequest(`/performance/history/${id}`, { method: 'DELETE', token });
}

export async function clearPerformanceHistory(token: string): Promise<number> {
  const data = await perfRequest<{ deletedCount: number }>('/performance/history', {
    method: 'DELETE',
    token,
  });
  return data.deletedCount ?? 0;
}
