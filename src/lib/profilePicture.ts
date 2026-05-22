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
