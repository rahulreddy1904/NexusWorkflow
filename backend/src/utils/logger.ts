export function sanitize(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'secret',
    'jwt_secret',
    'gemini_api_key',
    'api_key',
    'authorization',
    'client_secret',
    'app_secret'
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  error: (msg: string, error?: any, meta?: any) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${msg}`,
      error?.message || error || '',
      meta ? JSON.stringify(sanitize(meta)) : ''
    );
  },
  audit: (event: string, actor: string, details?: any) => {
    console.log(`[AUDIT] [${event}] actor=${actor}`, details ? JSON.stringify(sanitize(details)) : '');
  }
};
