export function validateExternalLinks(source, policy) {
  const errors = [];
  if (policy?.schemaVersion !== 1 || !Array.isArray(policy.allowedHosts)) {
    return ['External-host policy schema is invalid.'];
  }

  const allowedHosts = new Set(policy.allowedHosts.map(({ host }) => host));
  const urls = source.match(/https:\/\/[^\s'"`]+/g) ?? [];
  for (const rawValue of urls) {
    const rawUrl = rawValue.replace(/[),;]+$/, '');
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      errors.push(`Invalid external URL: ${rawValue}`);
      continue;
    }
    if (url.username || url.password) errors.push(`URL contains credentials: ${url.host}`);
    if (!allowedHosts.has(url.hostname)) errors.push(`Host is not approved: ${url.hostname}`);
  }

  if (/\.\.\.placeholder|\bTBD\b/i.test(source)) {
    errors.push('External-link source contains a placeholder destination.');
  }
  if (!Array.isArray(policy.disabledIntegrations) || policy.disabledIntegrations.length === 0) {
    errors.push('Policy must preserve explicit disabled integration gates.');
  }

  return errors;
}
