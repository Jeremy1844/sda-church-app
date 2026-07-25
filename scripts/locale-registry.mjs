const EXPECTED_SUPPORTED_LOCALES = ['en', 'zh', 'zh-cn', 'es'];
const REQUIRED_CANDIDATES = ['bo', 'de', 'id', 'ja'];

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

export function validateLocaleRegistry(registry) {
  const errors = [];
  assert(registry && typeof registry === 'object', 'Registry must be an object.', errors);
  if (errors.length) return errors;

  assert(registry.schemaVersion === 1, 'schemaVersion must be 1.', errors);
  assert(Array.isArray(registry.supported), 'supported must be an array.', errors);
  assert(Array.isArray(registry.candidates), 'candidates must be an array.', errors);
  if (!Array.isArray(registry.supported) || !Array.isArray(registry.candidates)) return errors;

  const supportedIds = registry.supported.map((locale) => locale?.id);
  const candidateIds = registry.candidates.map((locale) => locale?.id);
  assert(
    JSON.stringify([...supportedIds].sort()) === JSON.stringify([...EXPECTED_SUPPORTED_LOCALES].sort()),
    `Supported locale IDs must be exactly ${EXPECTED_SUPPORTED_LOCALES.join(', ')}.`,
    errors,
  );
  assert(supportedIds.includes(registry.fallback), 'fallback must be a supported locale.', errors);
  assert(new Set([...supportedIds, ...candidateIds]).size === supportedIds.length + candidateIds.length,
    'Locale IDs must be unique across supported and candidate lists.', errors);

  for (const locale of registry.supported) {
    assert(Array.isArray(locale?.bcp47) && locale.bcp47.length > 0,
      `Supported locale ${locale?.id ?? '<missing>'} needs BCP-47 mappings.`, errors);
    assert(typeof locale?.script === 'string' && locale.script.length === 4,
      `Supported locale ${locale?.id ?? '<missing>'} needs an ISO 15924 script.`, errors);
    assert(locale?.textDirection === 'ltr' || locale?.textDirection === 'rtl',
      `Supported locale ${locale?.id ?? '<missing>'} needs a text direction.`, errors);
    assert(locale?.contentReview === 'existing-production-copy',
      `Supported locale ${locale?.id ?? '<missing>'} must identify reviewed copy state.`, errors);
  }

  assert(
    REQUIRED_CANDIDATES.every((id) => candidateIds.includes(id)),
    `Candidate registry must include ${REQUIRED_CANDIDATES.join(', ')}.`,
    errors,
  );
  for (const locale of registry.candidates) {
    assert(typeof locale?.status === 'string' && locale.status.startsWith('blocked-pending-'),
      `Candidate locale ${locale?.id ?? '<missing>'} must remain explicitly gated.`, errors);
  }

  return errors;
}
