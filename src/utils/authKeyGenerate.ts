import cryptoRandomString from 'crypto-random-string';

function generateAuthKey(length: number): string {
    return cryptoRandomString({length: length, type: 'alphanumeric'});
  }

  const newKey = generateAuthKey(8);
  console.log(newKey);

