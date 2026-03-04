"use strict";
const common_vendor = require("../common/vendor.js");
const ENC_KEY = new Uint8Array([64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105]);
function stringToUint8Array(str) {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 255;
  }
  return arr;
}
function uint8ArrayToString(array) {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(array);
}
function isGzipData(data) {
  return data.length >= 2 && data[0] === 31 && data[1] === 139;
}
async function decodeKrcLyric(content) {
  if (!content || typeof content !== "string") {
    return "";
  }
  try {
    let buffer;
    try {
      const binary = common_vendor.index.base64ToArrayBuffer(content);
      buffer = new Uint8Array(binary);
    } catch (e) {
      buffer = stringToUint8Array(content);
    }
    if (buffer.length < 4) {
      return "";
    }
    const data = buffer.slice(4);
    const decrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ ENC_KEY[i % 16];
    }
    if (isGzipData(decrypted)) {
      console.log("[kgLyricDecoder] 检测到 gzip 压缩数据，尝试解压");
      try {
        const result = await decompressGzip(decrypted);
        return result;
      } catch (err) {
        console.error("[kgLyricDecoder] gzip 解压失败:", err);
        return "";
      }
    }
    return uint8ArrayToString(decrypted);
  } catch (error) {
    console.error("[kgLyricDecoder] 解码 KRC 歌词失败:", error);
    return "";
  }
}
async function decompressGzip(data) {
  return new Promise((resolve, reject) => {
    console.log("[kgLyricDecoder] 小程序环境不支持 gzip 解压，需要后端处理");
    reject(new Error("GZIP_NOT_SUPPORTED"));
  });
}
function parseKgLyric(krcContent) {
  if (!krcContent) {
    return { lyric: "", tlyric: "", rlyric: "", lxlyric: "" };
  }
  let content = krcContent.replace(/\r/g, "");
  const headExp = /^.*\[id:\$\w+\]\n/;
  if (headExp.test(content)) {
    content = content.replace(headExp, "");
  }
  let tlyric = "";
  let rlyric = "";
  const transMatch = content.match(/\[language:([\w=\\/+]+)\]/);
  if (transMatch) {
    content = content.replace(/\[language:[\w=\\/+]+\]\n/, "");
    try {
      const transBinary = common_vendor.index.base64ToArrayBuffer(transMatch[1]);
      const transJson = JSON.parse(uint8ArrayToString(new Uint8Array(transBinary)));
      if (transJson.content) {
        for (const item of transJson.content) {
          switch (item.type) {
            case 0:
              rlyric = item.lyricContent;
              break;
            case 1:
              tlyric = item.lyricContent;
              break;
          }
        }
      }
    } catch (e) {
      console.log("[kgLyricDecoder] 解析翻译信息失败:", e);
    }
  }
  let i = 0;
  let lxlyric = content.replace(/\[((\d+),\d+)\].*/g, (str) => {
    const result = str.match(/\[((\d+),\d+)\].*/);
    if (!result)
      return str;
    let time = parseInt(result[2]);
    const ms = time % 1e3;
    time = Math.floor(time / 1e3);
    const m = Math.floor(time / 60).toString().padStart(2, "0");
    const s = (time % 60).toString().padStart(2, "0");
    const timeStr = `${m}:${s}.${ms}`;
    if (rlyric && rlyric[i]) {
      rlyric[i] = `[${timeStr}]${rlyric[i].join("") || ""}`;
    }
    if (tlyric && tlyric[i]) {
      tlyric[i] = `[${timeStr}]${tlyric[i].join("") || ""}`;
    }
    i++;
    return str.replace(result[1], timeStr);
  });
  if (Array.isArray(rlyric)) {
    rlyric = rlyric.join("\n");
  }
  if (Array.isArray(tlyric)) {
    tlyric = tlyric.join("\n");
  }
  lxlyric = lxlyric.replace(/<(\d+,\d+),\d+>/g, "<$1>");
  const lyric = lxlyric.replace(/<\d+,\d+>/g, "");
  return {
    lyric,
    tlyric: tlyric || "",
    rlyric: rlyric || "",
    lxlyric
  };
}
function isKgCompressedLyric(lyric) {
  if (!lyric || typeof lyric !== "string") {
    return false;
  }
  let binaryCount = 0;
  for (let i = 0; i < Math.min(lyric.length, 100); i++) {
    const code = lyric.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      binaryCount++;
    }
  }
  return binaryCount > 10;
}
async function tryDecodeKgLyric(lyric) {
  if (!lyric) {
    return { lyric: "", tlyric: "", rlyric: "", lxlyric: "" };
  }
  if (isKgCompressedLyric(lyric)) {
    console.log("[kgLyricDecoder] 检测到酷狗压缩格式歌词");
    const decoded = await decodeKrcLyric(lyric);
    if (decoded) {
      return parseKgLyric(decoded);
    }
    return { lyric: "", tlyric: "", rlyric: "", lxlyric: "" };
  }
  return { lyric, tlyric: "", rlyric: "", lxlyric: lyric };
}
exports.isKgCompressedLyric = isKgCompressedLyric;
exports.tryDecodeKgLyric = tryDecodeKgLyric;
