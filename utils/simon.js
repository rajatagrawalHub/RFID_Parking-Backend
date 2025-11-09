// Simple 64-bit SIMON cipher (keyed lightweight block cipher)
// Note: For demonstration, this is a compact JavaScript implementation (not for production crypto)

const WORD_SIZE = 32;
const MASK = 0xffffffff;

function rotl(x, r) { return ((x << r) | (x >>> (WORD_SIZE - r))) & MASK; }
function rotr(x, r) { return ((x >>> r) | (x << (WORD_SIZE - r))) & MASK; }

function simonRound(x, y, k) {
  let tmp = (rotl(x, 1) & rotl(x, 8)) ^ rotl(x, 2);
  tmp = (tmp ^ y ^ k) >>> 0;
  return [tmp, x];
}

// Simple key schedule for 64/128-bit key version (32-bit words)
function keySchedule(keyWords, rounds = 44) {
  let c = 0xfffffffc;
  let z = 0b11111010001001010110000111001101111101000100101011000011100110n;
  let zBits = z.toString(2).padStart(62, '0');
  let keys = keyWords.slice();

  for (let i = 4; i < rounds; i++) {
    let tmp = rotr(keys[i - 1], 3) ^ keys[i - 3];
    tmp ^= rotr(tmp, 1);
    let zBit = parseInt(zBits[(i - 4) % 62]);
    keys[i] = (c ^ zBit ^ (~keys[i - 4]) ^ tmp) & MASK;
  }
  return keys.slice(0, rounds);
}

export function simonEncrypt(plainText, keyWords) {
  const rounds = 44;
  let keys = keySchedule(keyWords, rounds);
  let [x, y] = plainText;

  for (let i = 0; i < rounds; i++) {
    [x, y] = simonRound(x, y, keys[i]);
  }
  return [x, y];
}

export function simonDecrypt(cipherText, keyWords) {
  const rounds = 44;
  let keys = keySchedule(keyWords, rounds);
  let [x, y] = cipherText;

  for (let i = rounds - 1; i >= 0; i--) {
    [y, x] = simonRound(y, x, keys[i]);
  }
  return [x, y];
}

export function textToBlocks(text) {
  const blocks = [];
  const padded = text.padEnd(Math.ceil(text.length / 8) * 8, " ");
  for (let i = 0; i < padded.length; i += 8) {
    const buf = Buffer.from(padded.slice(i, i + 8));
    blocks.push([buf.readUInt32BE(0), buf.readUInt32BE(4)]);
  }
  return blocks;
}
export function blocksToText(blocks) {
  let result = "";
  for (const [x, y] of blocks) {
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(x);
    buf.writeUInt32BE(y, 4);
    result += buf.toString();
  }
  return result.trimEnd();
}