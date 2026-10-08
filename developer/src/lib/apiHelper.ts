/**
 * API Helper for Developer Portal
 * Resolves Backend API Base URL and performs safe JSON parsing.
 * Powered by PRIGID GROUP
 */

export function getApiBaseUrl(): string {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_BACKEND_URL)) ||
    (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_BACKEND_URL));

  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // Fallback to production server endpoint
  return 'https://vibez-server.onrender.com/api';
}

export async function safeFetchJson(endpointPath: string, options?: RequestInit) {
  const baseUrl = getApiBaseUrl();
  const cleanPath = endpointPath.startsWith('/api')
    ? endpointPath.substring(4)
    : endpointPath.startsWith('/')
    ? endpointPath
    : `/${endpointPath}`;

  const fullUrl = baseUrl.endsWith('/api')
    ? `${baseUrl}${cleanPath}`
    : `${baseUrl}/api${cleanPath}`;

  try {
    const res = await fetch(fullUrl, options);
    const text = await res.text();
    let data: any = {};

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: false,
          error: `Server at ${baseUrl} returned non-JSON response (HTTP ${res.status}). Verify your backend URL.`,
        };
      }
    } else {
      data = {
        success: false,
        error: res.ok
          ? 'Empty response from server'
          : `HTTP ${res.status} ${res.statusText}`,
      };
    }

    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        error: err.message || 'Failed to connect to backend server. Please check network connection or CORS settings.',
      },
    };
  }
}
