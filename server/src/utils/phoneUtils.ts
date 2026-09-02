export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters except leading plus
  return phone.replace(/[^0-9+]/g, '').trim();
}

export function extractDigits(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

export function phonesMatch(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;

  const normA = normalizePhone(phoneA);
  const normB = normalizePhone(phoneB);

  if (normA === normB && normA.length > 0) return true;

  const digitsA = extractDigits(phoneA);
  const digitsB = extractDigits(phoneB);

  if (digitsA === digitsB && digitsA.length > 0) return true;

  // If one starts with 0 (e.g. 08123456789) and the other has international code (e.g. 2348123456789)
  const noZeroA = digitsA.replace(/^0+/, '');
  const noZeroB = digitsB.replace(/^0+/, '');

  if (noZeroA === noZeroB && noZeroA.length > 0) return true;

  // Suffix matching for last 7 to 10 digits
  const minLen = Math.min(digitsA.length, digitsB.length);
  if (minLen >= 7) {
    const matchLen = Math.min(minLen, 10);
    const suffixA = digitsA.slice(-matchLen);
    const suffixB = digitsB.slice(-matchLen);
    if (suffixA === suffixB) return true;
  }

  return false;
}
