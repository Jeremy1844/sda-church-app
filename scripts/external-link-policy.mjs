import ts from 'typescript';

const APPROVED_MODES = new Set(['automatic', 'user-initiated', 'local-metadata-only']);
const HTTPS_URL_PATTERN = /https:\/\/[^\s'"`<>\\]+/g;

function asSources(sourceOrSources) {
  if (typeof sourceOrSources === 'string') {
    return [{ fileName: 'inline.ts', source: sourceOrSources }];
  }
  if (!Array.isArray(sourceOrSources)) return [];
  return sourceOrSources.filter(
    (entry) =>
      entry && typeof entry.fileName === 'string' && typeof entry.source === 'string',
  );
}

function scriptKindFor(fileName) {
  if (fileName.endsWith('.json')) return ts.ScriptKind.JSON;
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function extractUrlsFromText(text, fileName, position, references, seen) {
  for (const match of text.matchAll(HTTPS_URL_PATTERN)) {
    const rawUrl = match[0].replace(/[),;.!]+$/, '');
    const key = `${fileName}:${position + (match.index ?? 0)}:${rawUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    references.push({ fileName, rawUrl });
  }
}

/**
 * Extracts HTTPS references only from JavaScript/TypeScript runtime literals.
 * Documentation comments are intentionally ignored, while every static segment of a
 * template literal is inspected so dynamic URLs still register their host.
 */
export function extractHttpsReferences(source, fileName = 'inline.ts') {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  );
  const references = [];
  const seen = new Set();

  function visit(node) {
    if (ts.isStringLiteralLike(node)) {
      extractUrlsFromText(node.text, fileName, node.getStart(sourceFile), references, seen);
    } else if (ts.isTemplateExpression(node)) {
      extractUrlsFromText(
        node.head.text,
        fileName,
        node.head.getStart(sourceFile),
        references,
        seen,
      );
      for (const span of node.templateSpans) {
        extractUrlsFromText(
          span.literal.text,
          fileName,
          span.literal.getStart(sourceFile),
          references,
          seen,
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return references;
}

function validatePolicy(policy) {
  const errors = [];
  if (policy?.schemaVersion !== 2 || !Array.isArray(policy.allowedHosts)) {
    return ['External-host policy schema is invalid.'];
  }

  const seenHosts = new Set();
  for (const entry of policy.allowedHosts) {
    if (!entry || typeof entry !== 'object') {
      errors.push('External-host policy contains a malformed host entry.');
      continue;
    }
    const { host, purpose, mode } = entry;
    if (
      typeof host !== 'string' ||
      host !== host.toLowerCase() ||
      !/^[a-z0-9.-]+$/.test(host) ||
      host.startsWith('.') ||
      host.endsWith('.')
    ) {
      errors.push(`Policy host is invalid: ${String(host)}`);
      continue;
    }
    if (seenHosts.has(host)) errors.push(`Policy host is duplicated: ${host}`);
    seenHosts.add(host);
    if (typeof purpose !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(purpose)) {
      errors.push(`Policy purpose is invalid for host: ${host}`);
    }
    if (!APPROVED_MODES.has(mode)) {
      errors.push(`Policy mode is invalid for host: ${host}`);
    }
  }

  if (!Array.isArray(policy.disabledIntegrations) || policy.disabledIntegrations.length === 0) {
    errors.push('Policy must preserve explicit disabled integration gates.');
  }
  return errors;
}

export function validateExternalLinks(sourceOrSources, policy) {
  const errors = validatePolicy(policy);
  if (errors.length) return errors;

  const sources = asSources(sourceOrSources);
  if (sources.length === 0) return ['No runtime sources were provided for external-host review.'];

  const allowedHosts = new Set(policy.allowedHosts.map(({ host }) => host));
  const referencedHosts = new Set();
  for (const { fileName, source } of sources) {
    const references = extractHttpsReferences(source, fileName);
    for (const { rawUrl } of references) {
      let url;
      try {
        url = new URL(rawUrl);
      } catch {
        errors.push(`${fileName}: Invalid external URL: ${rawUrl}`);
        continue;
      }
      referencedHosts.add(url.hostname);
      if (url.username || url.password) {
        errors.push(`${fileName}: URL contains credentials: ${url.host}`);
      }
      if (!allowedHosts.has(url.hostname)) {
        errors.push(`${fileName}: Host is not approved: ${url.hostname}`);
      }
      if (/\.\.\.placeholder|\bTBD\b/i.test(rawUrl)) {
        errors.push(`${fileName}: External URL contains a placeholder destination.`);
      }
    }
  }

  for (const host of allowedHosts) {
    if (!referencedHosts.has(host)) errors.push(`Policy host is not used by runtime source: ${host}`);
  }

  return errors;
}
