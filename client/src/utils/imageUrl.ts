/**
 * Convert image URL to absolute backend URL if it's a relative path
 * Local cached images are served from port 3001, but the app runs on port 3000
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
    return `http://localhost:3001${imageUrl}`;
  }

  // Otherwise return as-is
  return imageUrl;
}
