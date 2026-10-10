import fs from 'fs';

export interface ParsedServiceAccount {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
  [key: string]: any;
}

/**
 * Strips UTF-8 and UTF-16 Byte Order Marks (BOM) from the beginning of a string.
 * Essential for keys created or piped through Windows PowerShell / Notepad.
 */
export const stripBom = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/^\uFEFF+/, '')
    .replace(/^\uFFFE+/, '')
    .replace(/^\uEFBBBF+/, '');
};

/**
 * Strips outer matching quotes (repeated up to 5 times) and handles escaped outer quotes.
 */
export const stripWrappingQuotes = (str: string): string => {
  let clean = stripBom(str.trim());
  for (let i = 0; i < 5; i++) {
    clean = clean.trim();
    if (
      (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2) ||
      (clean.startsWith("'") && clean.endsWith("'") && clean.length >= 2) ||
      (clean.startsWith('`') && clean.endsWith('`') && clean.length >= 2)
    ) {
      clean = clean.slice(1, -1);
    } else {
      break;
    }
  }
  return stripBom(clean.trim());
};

/**
 * Recursively parses JSON strings that may have been stringified multiple times
 * (e.g. from Vercel env var editor, CLI tool serialization, or JSON.stringify nesting).
 */
const recursivelyParseJson = (input: any, maxDepth = 5): any => {
  if (!input || maxDepth <= 0) return null;
  if (typeof input === 'object' && input !== null) return input;
  if (typeof input !== 'string') return null;

  let candidate = stripWrappingQuotes(input);
  if (!candidate) return null;

  try {
    const direct = JSON.parse(candidate);
    if (typeof direct === 'string') {
      return recursivelyParseJson(direct, maxDepth - 1);
    }
    return direct;
  } catch (_) {
    // Try relaxing escaped quotes: e.g. \"type\": \"service_account\" -> "type": "service_account"
    try {
      if (candidate.includes('\\"')) {
        const unescaped = candidate.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const unescapedParse = JSON.parse(unescaped);
        if (typeof unescapedParse === 'string') {
          return recursivelyParseJson(unescapedParse, maxDepth - 1);
        }
        return unescapedParse;
      }
    } catch (_) {}

    // Try handling unescaped newlines in private_key
    try {
      const fixedNewlines = candidate.replace(/(?<!\\)\r?\n/g, '\\n');
      return JSON.parse(fixedNewlines);
    } catch (_) {}
  }
  return null;
};

/**
 * Robustly parses a Google Cloud Service Account JSON from any format:
 * - Direct JS Object
 * - Raw JSON string (single-line or multi-line)
 * - Base64 encoded string (UTF-8 or UTF-16 LE from Windows PowerShell)
 * - Base64 string with UTF-8 BOM (starts with 77u/)
 * - Path to a credentials file on the local filesystem
 * - String wrapped in quotes or escaped JSON
 * 
 * Returns the normalized ParsedServiceAccount object with real newlines in private_key,
 * or null if the string cannot be parsed into a valid Service Account object.
 */
export const safelyParseServiceAccountJson = (raw: any): ParsedServiceAccount | null => {
  if (!raw) return null;

  // 1. Direct object pass-through
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return normalizeServiceAccountObject(raw);
  }

  if (typeof raw !== 'string') return null;

  let text = stripWrappingQuotes(raw);
  if (!text) return null;

  // 2. Check if the string is a local file path
  try {
    if (
      (text.endsWith('.json') || text.includes('/') || text.includes('\\')) &&
      text.length < 500 &&
      !text.includes('\n') &&
      !text.includes('{')
    ) {
      if (typeof fs !== 'undefined' && fs.existsSync && fs.existsSync(text)) {
        const fileContent = fs.readFileSync(text, 'utf8');
        return safelyParseServiceAccountJson(fileContent);
      }
    }
  } catch (_) {
    // ignore filesystem errors and proceed to in-memory parsing
  }

  // 3. Attempt direct or nested JSON parsing first
  let parsed = recursivelyParseJson(text);
  if (parsed && typeof parsed === 'object') {
    const normalized = normalizeServiceAccountObject(parsed);
    if (normalized) return normalized;
  }

  // 4. Base64 Detection & Decoding
  // If not starting with '{' or if it looks like Base64 (base64 string might start with 77u/ if it has UTF-8 BOM)
  const compact = text.replace(/\s+/g, '');
  if (!text.startsWith('{') && compact.length > 20) {
    try {
      const buf = Buffer.from(compact, 'base64');

      // 4a. Try UTF-8 decoding (stripping BOM)
      const utf8Text = stripBom(buf.toString('utf8')).trim();
      // If it contains null bytes (\u0000), it is likely UTF-16 LE from Windows PowerShell
      if (utf8Text.includes('\u0000')) {
        const utf16Text = stripBom(buf.toString('utf16le')).trim();
        parsed = recursivelyParseJson(utf16Text);
      } else {
        parsed = recursivelyParseJson(utf8Text);
      }

      if (parsed && typeof parsed === 'object') {
        const normalized = normalizeServiceAccountObject(parsed);
        if (normalized) return normalized;
      }
    } catch (_) {}
  }

  // 5. Try URL decoding in case encoded in transit
  if (text.includes('%7B') || text.includes('%22')) {
    try {
      const decodedUrl = decodeURIComponent(text);
      parsed = recursivelyParseJson(decodedUrl);
      if (parsed && typeof parsed === 'object') {
        const normalized = normalizeServiceAccountObject(parsed);
        if (normalized) return normalized;
      }
    } catch (_) {}
  }

  return null;
};

/**
 * Validates and normalizes service account fields:
 * - Un-escapes \n in private_key to actual PEM newlines
 * - Verifies essential Google Cloud Service Account markers
 */
const normalizeServiceAccountObject = (obj: any): ParsedServiceAccount | null => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

  // Check for expected service account fields
  const hasSaIdentifiers = Boolean(
    obj.project_id ||
    obj.client_email ||
    obj.private_key ||
    obj.type === 'service_account'
  );

  if (!hasSaIdentifiers) return null;

  const result: ParsedServiceAccount = { ...obj };

  if (result.private_key && typeof result.private_key === 'string') {
    // Normalize literal \n or escaped newlines in PEM private key
    result.private_key = result.private_key
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .trim();
  }

  if (result.project_id && typeof result.project_id === 'string') {
    result.project_id = result.project_id.trim();
  }

  if (result.client_email && typeof result.client_email === 'string') {
    result.client_email = result.client_email.trim();
  }

  return result;
};
