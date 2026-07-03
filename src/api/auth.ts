import { apiFetch } from './client';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(token: string, data: ChangePasswordRequest): Promise<void> {
  const { ok, status, data: response } = await apiFetch<{ message?: string }>('/users/me/password', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });

  if (!ok) {
    if (status === 401) {
      throw new Error(response?.message || 'Current password is incorrect');
    }
    throw new Error(response?.message || 'Failed to change password');
  }
}
