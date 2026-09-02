import crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32Str: string): Buffer {
  const cleanStr = base32Str.replace(/=+$/, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr.charAt(i);
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateBase32Secret(length = 32): string {
  const randomBytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % 32];
  }
  return secret;
}

export function generateTOTPCode(secret: string, timeInSeconds: number = Math.floor(Date.now() / 1000)): string {
  const keyBuffer = base32Decode(secret);
  const counter = Math.floor(timeInSeconds / 30);
  
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    // shift 8 bits
    Math.floor(counter / 256);
  }

  // Create 8-byte big endian integer for counter
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const code = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

export function verifyTOTP(secret: string, userToken: string, window = 1): boolean {
  const cleanToken = userToken.toString().trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);

  // Check current window and adjacent windows for clock drift tolerance
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const timeCheck = nowSeconds + (errorWindow * 30);
    const expectedCode = generateTOTPCode(secret, timeCheck);
    if (expectedCode === cleanToken) {
      return true;
    }
  }

  return false;
}

export function generateOTPAuthUri(accountName: string, secret: string, issuer = 'VIBEZ Admin'): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
