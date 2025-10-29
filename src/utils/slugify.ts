export const slugify = (s: string): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    // allow alphanumeric, spaces, dashes, and parentheses
    .replace(/[^a-z0-9\s\-\(\)]/g, '')
    .trim()
    // replace all spaces with a single dash
    .replace(/\s+/g, '-')
    // collapse multiple dashes
    .replace(/-+/g, '-')
    // trim leading/trailing dashes
    .replace(/^-|-$/g, '');
};

export default slugify;
