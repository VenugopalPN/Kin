/** Root-absolute app path, including the GitHub Pages prefix when this build has one. */
export function appPath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!path.startsWith('/')) return path;
  if (!base || path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

/** Full address for a copied link. Router paths stay unprefixed; this adds the deploy prefix. */
export function absoluteAppUrl(path: string): string {
  return `${window.location.origin}${appPath(path)}`;
}
