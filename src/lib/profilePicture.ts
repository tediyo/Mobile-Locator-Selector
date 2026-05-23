/** Normalize profile photo URL from API / OAuth payloads. */
export function resolveProfilePictureUrl(
  data: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!data) return undefined;

  const candidates = [
    data.profilePicture,
    data.profile_picture,
    data.picture,
    data.avatar,
    data.avatarUrl,
    data.avatar_url,
    data.photo,
    data.photoUrl,
    data.photo_url,
    data.image,
    data.imageUrl,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().startsWith('http')) {
      return c.trim();
    }
  }

  return undefined;
}

/** Normalize account creation date from API payloads. */
export function resolveCreatedAt(data: Record<string, unknown> | null | undefined): string | undefined {
  if (!data) return undefined;

  const candidates = [
    data.createdAt,
    data.created_at,
    data.memberSince,
    data.member_since,
    data.joinedAt,
    data.joined_at,
    data.registrationDate,
    data.registeredAt,
    data.dateJoined,
    data.date_joined,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (typeof c === 'number' && Number.isFinite(c)) return new Date(c).toISOString();
  }

  return undefined;
}
