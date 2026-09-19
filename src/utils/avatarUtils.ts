/**
 * Returns true only if the url represents a custom avatar uploaded or set by the user,
 * and false if it is empty, null, undefined, or a default Unsplash stock photo placeholder.
 */
export const isCustomAvatar = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.trim();
  if (!clean) return false;
  // Filter out stock Unsplash placeholders that were used as defaults
  if (
    clean.includes('photo-1534528741775') || // default female stock avatar
    clean.includes('photo-1507003211169') || // default male stock avatar
    clean.includes('photo-1494790108377') || // mock seed avatar
    clean.includes('photo-1500648767791')    // mock seed avatar
  ) {
    return false;
  }
  return true;
};
