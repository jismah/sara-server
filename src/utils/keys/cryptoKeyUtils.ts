import * as fs from 'fs';
import * as crypto from 'crypto';

class KeySplitter {
  private readonly KEY_SIZE = 32; // Key size in bytes
  private readonly PARTS_COUNT = 64; // Number of parts to split the key
  private keyFile: string;

  constructor(keyFile: string) {
    this.keyFile = keyFile;
  }

  // Generate a cryptographically strong random key
  private generateRandomKey(): Buffer {
    return crypto.randomBytes(this.KEY_SIZE);
  }

  // XOR two buffers
  private xorBuffers(buffer1: Buffer, buffer2: Buffer): Buffer {
    const result = Buffer.alloc(this.KEY_SIZE);
    for (let i = 0; i < this.KEY_SIZE; i++) {
      result[i] = buffer1[i] ^ buffer2[i];
    }
    return result;
  }

  // Create split key parts and save them to a file
  public createSplitKey(): void {
    if (fs.existsSync(this.keyFile)) {
      return;
    }

    const key = this.generateRandomKey();
    console.log(`Real Key: ${key.toString('hex')}`);
    const splitKeys: Buffer[] = [];

    for (let i = 0; i < this.PARTS_COUNT - 1; i++) {
      const randomPart = this.generateRandomKey();
      splitKeys.push(randomPart);
      key.set(this.xorBuffers(key, randomPart));
    }
    splitKeys.push(key);

    fs.writeFileSync(this.keyFile, JSON.stringify(splitKeys.map(part => part.toString('base64'))));

    console.log(`Split key parts created and saved to ${this.keyFile}`);
  }

  // Retrieve the real key from split parts
  public getRealKey(): Buffer {
    if (!fs.existsSync(this.keyFile)) {
      throw new Error(`File ${this.keyFile} does not exist.`);
    }

    const splitKeys = JSON.parse(fs.readFileSync(this.keyFile).toString()) as string[];

    if (splitKeys.length !== this.PARTS_COUNT) {
      throw new Error(`Invalid number of split key parts in ${this.keyFile}.`);
    }

    let realKey = Buffer.from(splitKeys[0], 'base64');
    for (let i = 1; i < this.PARTS_COUNT; i++) {
      realKey = this.xorBuffers(realKey, Buffer.from(splitKeys[i], 'base64'));
    }

    return realKey;
  }
}

const keySplitter = new KeySplitter('keys.json');

try {
  keySplitter.createSplitKey();
} catch (error: any) {
  console.error(`Error: ${error.message}`);
}

export default keySplitter
