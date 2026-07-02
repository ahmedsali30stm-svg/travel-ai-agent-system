import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createContextLogger } from './logger.js';

const logger = createContextLogger({ component: 'Encryption' });

const SALT_ROUNDS = 12;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class Encryption {
  private algorithm = 'aes-256-gcm';

  async encrypt(data: string, secret: string): Promise<string> {
    try {
      const key = this.deriveKey(secret);
      const iv = crypto.randomBytes(IV_LENGTH);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
      const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();

      const result = Buffer.concat([iv, tag, encrypted]);
      return result.toString('base64');
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  async decrypt(encryptedData: string, secret: string): Promise<string> {
    try {
      const key = this.deriveKey(secret);
      const buffer = Buffer.from(encryptedData, 'base64');

      const iv = buffer.subarray(0, IV_LENGTH);
      const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw error;
    }
  }

  async hash(data: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(data, SALT_ROUNDS);
      logger.debug('Data hashed');
      return hash;
    } catch (error) {
      logger.error('Hashing failed:', error);
      throw error;
    }
  }

  async verify(data: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(data, hash);
      logger.debug('Hash verified');
      return isValid;
    } catch (error) {
      logger.error('Verification failed:', error);
      throw error;
    }
  }

  async generateToken(length = 32): Promise<string> {
    try {
      const token = crypto.randomBytes(length).toString('hex');
      logger.debug('Token generated');
      return token;
    } catch (error) {
      logger.error('Token generation failed:', error);
      throw error;
    }
  }

  async generateApiKey(): Promise<string> {
    try {
      const key = crypto.randomBytes(48).toString('base64');
      logger.debug('API key generated');
      return key;
    } catch (error) {
      logger.error('API key generation failed:', error);
      throw error;
    }
  }

  async hashApiKey(apiKey: string): Promise<string> {
    return this.hash(apiKey);
  }

  private deriveKey(secret: string): Buffer {
    return crypto.scryptSync(secret, 'travel-ai-salt', KEY_LENGTH);
  }

  generateHmacSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifyHmacSignature(data: string, secret: string, signature: string): boolean {
    const expected = this.generateHmacSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

export const encryption = new Encryption();
