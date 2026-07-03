import { apiFetch } from './client';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(token: string, data: ChangePasswordRequest): Promise<void> {
  const { ok, status } = await apiFetch<void>('/users/me/password', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });

  if (!ok) {
    if (status === 401) {
      throw new Error('Current password is incorrect');
    }
    throw new Error('Failed to change password');
  }
}
