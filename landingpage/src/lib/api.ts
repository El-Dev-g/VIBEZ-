export interface PublicAppConfig {
  appName: string;
  appVersion: string;
  appDownloadUrl: string;
  contactEmail: string;
  contactPhone: string;
  supportAddress: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
}

export const getBackendUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return '';
};

export const fetchPublicAppConfig = async (): Promise<PublicAppConfig> => {
  try {
    const base = getBackendUrl();
    const url = base ? `${base}/api/config/public` : '/api/config/public';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        return JSON.parse(text);
      }
    }
  } catch (error) {
    console.warn('Could not fetch remote config, using defaults:', error);
  }

  return {
    appName: 'VIBEZ',
    appVersion: '1.0.0',
    appDownloadUrl: '',
    contactEmail: 'support@vibez.chat',
    contactPhone: '+1 (800) 555-0199',
    supportAddress: 'San Francisco, CA, USA',
    maintenanceMode: false,
    allowNewRegistrations: true
  };
};

export const submitContactForm = async (data: { name: string; email: string; subject: string; message: string }) => {
  const base = getBackendUrl();
  const url = base ? `${base}/api/contact` : '/api/contact';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const text = await res.text();
  let parsed: any = {};
  if (text && text.trim().length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: 'Invalid response from server' };
    }
  }
  if (!res.ok) {
    throw new Error(parsed.error || parsed.message || 'Failed to submit contact message');
  }
  return parsed;
};
