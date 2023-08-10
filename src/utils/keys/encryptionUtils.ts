import * as crypto from 'crypto';
import keySplitter from './cryptoKeyUtils';

class Encryptor {
  private key: Buffer;

  constructor() {
    this.key = keySplitter.getRealKey();
  }

  public encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    const encrypted = Buffer.concat([iv, cipher.update(text, 'utf-8'), cipher.final()]);
    return encrypted.toString('hex');
  }

  public decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, 'hex');
    const iv = data.subarray(0, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
    const decrypted = Buffer.concat([decipher.update(data.subarray(16)), decipher.final()]);
    return decrypted.toString('utf-8');
  }
}

const encryptor = new Encryptor()
export default encryptor;
