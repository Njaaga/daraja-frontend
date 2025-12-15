export function getTenantFromHostname(hostname) {
  const parts = hostname.split('.');
  if (parts.length < 3) return null; // default domain
  return parts[0]; // subdomain = tenant
}
