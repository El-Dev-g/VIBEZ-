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
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Fallback: If port is different or relative
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
};

export const fetchPublicAppConfig = async (): Promise<PublicAppConfig> => {
  try {
    const base = getBackendUrl();
    const url = base ? `${base}/api/config/public` : '/api/config/public';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data;
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(err.error || 'Failed to submit contact message');
  }
  return await res.json();
};
