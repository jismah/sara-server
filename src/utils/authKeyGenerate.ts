import crypto from 'crypto';

function generateAuthKey(): string {
  const key = crypto.randomBytes(8);
  return key.toString('base64');
}

const authKey = generateAuthKey();
console.log(authKey);

