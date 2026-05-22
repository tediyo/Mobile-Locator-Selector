import { API_URL } from '../config/api';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const { token, headers, ...rest } = options;
  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
      },
    });
  } catch (err) {
    const hint =
      API_URL.includes('localhost') || API_URL.includes('127.0.0.1')
        ? ' On a phone, set DEV_MACHINE_HOST in src/config/env.ts and USE_LOCAL_API=true'
        : ' Check your network connection and that the API is reachable';
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new Error(`Cannot reach ${url}. ${msg}.${hint}`);
  }

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}
