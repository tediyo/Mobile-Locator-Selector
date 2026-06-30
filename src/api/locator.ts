import { apiFetch } from './client';
import type { HistoryEntry } from '../lib/dashboard-analytics';

export async function getLocatorHistory(token: string): Promise<HistoryEntry[]> {
  const { ok, data } = await apiFetch<HistoryEntry[]>('/locator/history', { token });
  if (!ok) throw new Error('Failed to load locator history');
  return data;
}

export async function deleteLocatorHistoryEntry(token: string, id: string): Promise<void> {
  const { ok } = await apiFetch(`/locator/history/${id}`, { method: 'DELETE', token });
  if (!ok) throw new Error('Failed to delete locator entry');
}

export async function clearLocatorHistory(token: string): Promise<void> {
  const { ok } = await apiFetch('/locator/history', { method: 'DELETE', token });
  if (!ok) throw new Error('Failed to clear locator history');
}
