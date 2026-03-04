"use strict";
const MD5_K = [
  3614090360,
  3905402710,
  606105819,
  3250441966,
  4118548399,
  1200080426,
  2821735955,
  4249261313,
  1770035416,
  2336552879,
  4294925233,
  2304563134,
  1804603682,
  4254626195,
  2792965006,
  1236535329,
  4129170786,
  3225465664,
  643717713,
  3921069994,
  3593408605,
  38016083,
  3634488961,
  3889429448,
  568446438,
  3275163606,
  4107603335,
  1163531501,
  2850285829,
  4243563512,
  1735328473,
  2368359562,
  4294588738,
  2272392833,
  1839030562,
  4259657740,
  2763975236,
  1272893353,
  4139469664,
  3200236656,
  681279174,
  3936430074,
  3572445317,
  76029189,
  3654602809,
  3873151461,
  530742520,
  3299628645,
  4096336452,
  1126891415,
  2878612391,
  4237533241,
  1700485571,
  2399980690,
  4293915773,
  2240044497,
  1873313359,
  4264355552,
  2734768916,
  1309151649,
  4149444226,
  3174756917,
  718787259,
  3951481745
];
const MD5_S = [
  7,
  12,
  17,
  22,
  7,
  12,
  17,
  22,
  7,
  12,
  17,
  22,
  7,
  12,
  17,
  22,
  5,
  9,
  14,
  20,
  5,
  9,
  14,
  20,
  5,
  9,
  14,
  20,
  5,
  9,
  14,
  20,
  4,
  11,
  16,
  23,
  4,
  11,
  16,
  23,
  4,
  11,
  16,
  23,
  4,
  11,
  16,
  23,
  6,
  10,
  15,
  21,
  6,
  10,
  15,
  21,
  6,
  10,
  15,
  21,
  6,
  10,
  15,
  21
];
function md5RotateLeft(n, b) {
  return (n << b | n >>> 32 - b) >>> 0;
}
function md5AddUnsigned(a, b) {
  const lsw = (a & 65535) + (b & 65535);
  const msw = (a >>> 16) + (b >>> 16) + (lsw >>> 16);
  return (msw << 16 | lsw & 65535) >>> 0;
}
function md5(string) {
  let str = "";
  for (let i = 0; i < string.length; i++) {
    let c2 = string.charCodeAt(i);
    if (c2 < 128) {
      str += String.fromCharCode(c2);
    } else if (c2 < 2048) {
      str += String.fromCharCode(192 | c2 >> 6);
      str += String.fromCharCode(128 | c2 & 63);
    } else if (c2 < 65536) {
      str += String.fromCharCode(224 | c2 >> 12);
      str += String.fromCharCode(128 | c2 >> 6 & 63);
      str += String.fromCharCode(128 | c2 & 63);
    } else {
      str += String.fromCharCode(240 | c2 >> 18);
      str += String.fromCharCode(128 | c2 >> 12 & 63);
      str += String.fromCharCode(128 | c2 >> 6 & 63);
      str += String.fromCharCode(128 | c2 & 63);
    }
  }
  const msg = [];
  for (let i = 0; i < str.length; i++) {
    msg.push(str.charCodeAt(i));
  }
  const bitLen = msg.length * 8 >>> 0;
  msg.push(128);
  while (msg.length * 8 % 512 !== 448) {
    msg.push(0);
  }
  msg.push(bitLen >>> 0 & 255);
  msg.push(bitLen >>> 8 & 255);
  msg.push(bitLen >>> 16 & 255);
  msg.push(bitLen >>> 24 & 255);
  msg.push(0);
  msg.push(0);
  msg.push(0);
  msg.push(0);
  let a = 1732584193;
  let b = 4023233417;
  let c = 2562383102;
  let d = 271733878;
  for (let i = 0; i < msg.length; i += 64) {
    const chunk = msg.slice(i, i + 64);
    const M = [];
    for (let j = 0; j < 16; j++) {
      M[j] = chunk[j * 4] | chunk[j * 4 + 1] << 8 | chunk[j * 4 + 2] << 16 | chunk[j * 4 + 3] << 24;
    }
    let [A, B, C, D] = [a, b, c, d];
    for (let j = 0; j < 64; j++) {
      let F, g;
      if (j < 16) {
        F = B & C | ~B & D;
        g = j;
      } else if (j < 32) {
        F = D & B | ~D & C;
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        F = B ^ C ^ D;
        g = (3 * j + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = 7 * j % 16;
      }
      const temp = D;
      D = C;
      C = B;
      B = md5AddUnsigned(B, md5RotateLeft(md5AddUnsigned(md5AddUnsigned(A, F), md5AddUnsigned(MD5_K[j], M[g])), MD5_S[j]));
      A = temp;
    }
    a = md5AddUnsigned(a, A);
    b = md5AddUnsigned(b, B);
    c = md5AddUnsigned(c, C);
    d = md5AddUnsigned(d, D);
  }
  function wordToHex(word) {
    let hex = "";
    for (let i = 0; i < 4; i++) {
      const b2 = word >>> i * 8 & 255;
      hex += b2.toString(16).padStart(2, "0");
    }
    return hex;
  }
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}
exports.md5 = md5;
