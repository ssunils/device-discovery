/**
 * Convert image URL to absolute backend URL if it's a relative path
 * Local cached images are served from backend, port determined by REACT_APP_BACKEND_URL env var
 */
export function getImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) return null;

  // If it's already an absolute URL (http/https), use as-is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's a relative path (e.g., /images/...), point to backend server
  if (imageUrl.startsWith("/images/")) {
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
    return `${backendUrl}${imageUrl}`;
  }

  // Otherwise return as-is
  return imageUrl;
}

/**
 * Get a placeholder SVG avatar with a user icon on grey background
 */
export function getPlaceholderAvatar(
  phoneNumber?: string,
  size: number = 24
): string {
  // Create SVG with user icon on grey background
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#64748b" rx="4"/>
    <circle cx="${size / 2}" cy="${size * 0.35}" r="${
    size * 0.2
  }" fill="#94a3b8"/>
    <path d="M ${size * 0.15} ${size * 0.65} Q ${size * 0.15} ${size * 0.5} ${
    size * 0.5
  } ${size * 0.5} Q ${size * 0.85} ${size * 0.5} ${size * 0.85} ${
    size * 0.65
  } L ${size * 0.85} ${size * 0.9} Q ${size * 0.85} ${size * 0.95} ${
    size * 0.8
  } ${size * 0.95} L ${size * 0.2} ${size * 0.95} Q ${size * 0.15} ${
    size * 0.95
  } ${size * 0.15} ${size * 0.9} Z" fill="#94a3b8"/>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
