"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_config = require("../config.js");
const utils_musicParams = require("../musicParams.js");
const utils_lyricCache = require("../lyricCache.js");
const pendingMusicUrlRequests = /* @__PURE__ */ new Map();
const REQUEST_TIMEOUT = 15e3;
let requestIdCounter = 0;
let lastRequestInfo = {
  requestId: 0,
  requestKey: "",
  timestamp: 0
};
function getMusicUrl(params, quality = "320k") {
  var _a, _b, _c;
  let requestParams = params;
  if (!params.musicInfo) {
    requestParams = utils_musicParams.buildMusicRequestParams(params, quality);
    console.log("[getMusicUrl] 从歌曲对象构建请求参数:", {
      songId: params.id,
      songmid: params.songmid,
      source: params.source,
      hasRequestParams: !!requestParams,
      requestParamsSource: requestParams == null ? void 0 : requestParams.source,
      interval: (_a = requestParams == null ? void 0 : requestParams.musicInfo) == null ? void 0 : _a.interval
    });
  }
  if (!requestParams) {
    console.error("[getMusicUrl] requestParams 为 null，无法继续");
    return Promise.reject(new Error("请求参数构建失败"));
  }
  if (requestParams.musicInfo && !requestParams.musicInfo.interval) {
    const song = params;
    requestParams.musicInfo.interval = utils_musicParams.formatDuration(song.dt || song.duration || song.interval);
    console.log("[getMusicUrl] 补充 interval 字段:", requestParams.musicInfo.interval);
  }
  const songId = ((_b = requestParams.musicInfo) == null ? void 0 : _b.id) || requestParams.id;
  const source = requestParams.source;
  const actualQuality = requestParams.quality || quality;
  const requestKey = `${source}_${songId}_${actualQuality}`;
  const currentRequestId = ++requestIdCounter;
  lastRequestInfo = {
    requestId: currentRequestId,
    requestKey,
    timestamp: Date.now()
  };
  console.log("[getMusicUrl] 新请求:", {
    requestId: currentRequestId,
    requestKey,
    interval: (_c = requestParams.musicInfo) == null ? void 0 : _c.interval
  });
  if (pendingMusicUrlRequests.has(requestKey)) {
    console.log("[getMusicUrl] 复用正在进行的请求:", requestKey);
    return pendingMusicUrlRequests.get(requestKey);
  }
  const requestPromise = new Promise((resolve, reject) => {
    var _a2;
    let timeoutTimer = null;
    let isResolved = false;
    timeoutTimer = setTimeout(() => {
      if (!isResolved) {
        console.log("[getMusicUrl] 请求超时:", requestKey);
        if (lastRequestInfo.requestId === currentRequestId) {
          isResolved = true;
          pendingMusicUrlRequests.delete(requestKey);
          reject(new Error("请求超时，请重试"));
        }
      }
    }, REQUEST_TIMEOUT);
    console.log("[getMusicUrl] 创建新请求:", requestKey, "interval:", (_a2 = requestParams.musicInfo) == null ? void 0 : _a2.interval);
    console.log("[getMusicUrl] 实际发送的请求参数:", JSON.stringify(requestParams));
    common_vendor.index.request({
      //   url: `https://erikjamesgz-dn-phg-musi-39.deno.dev/api/music/url`,
      url: `${utils_config.getServerUrl()}/api/music/url`,
      // url: `http://localhost:8080/api/music/url`,
      method: "POST",
      data: requestParams,
      header: {
        "Content-Type": "application/json"
      },
      success: async (res) => {
        var _a3, _b2, _c2, _d, _e;
        if (lastRequestInfo.requestId !== currentRequestId) {
          console.log("[getMusicUrl] 忽略过期响应:", {
            currentRequestId,
            lastRequestId: lastRequestInfo.requestId
          });
          return;
        }
        if (isResolved)
          return;
        isResolved = true;
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const data = res.data.data;
          const songId2 = ((_a3 = requestParams.musicInfo) == null ? void 0 : _a3.id) || requestParams.id;
          const source2 = requestParams.source;
          console.log("[getMusicUrl] API返回数据:", {
            id: songId2,
            source: source2,
            hasUrl: !!data.url,
            hasLyric: !!data.lyric,
            hasTlyric: !!data.tlyric,
            hasRlyric: !!data.rlyric,
            hasLxlyric: !!data.lxlyric,
            lyricLength: (_b2 = data.lyric) == null ? void 0 : _b2.length,
            tlyricLength: (_c2 = data.tlyric) == null ? void 0 : _c2.length,
            hasFallback: !!data.fallback
          });
          if (data.fallback && data.fallback.toggled) {
            const originalSource = data.fallback.originalSource;
            const newSource = data.fallback.newSource;
            const matchedSong = data.fallback.matchedSong;
            const sourceNameMap = {
              "tx": "QQ音乐",
              "wy": "网易云音乐",
              "kg": "酷狗音乐",
              "kw": "酷我音乐",
              "mg": "咪咕音乐"
            };
            const originalName = sourceNameMap[originalSource] || originalSource;
            const newName = sourceNameMap[newSource] || newSource;
            console.log(`[getMusicUrl] 换源播放: ${originalName} -> ${newName}`);
            console.log("[getMusicUrl] 换源详情:", {
              originalSource,
              newSource,
              matchedSongId: matchedSong == null ? void 0 : matchedSong.id,
              matchedSongSongmid: matchedSong == null ? void 0 : matchedSong.songmid
            });
          }
          if (data && (data.lyric || data.tlyric || data.rlyric || data.lxlyric)) {
            const lyricInfo = {
              lyric: data.lyric || "",
              tlyric: data.tlyric || "",
              rlyric: data.rlyric || "",
              lxlyric: data.lxlyric || ""
            };
            if (lyricInfo.lyric || lyricInfo.tlyric || lyricInfo.rlyric || lyricInfo.lxlyric) {
              const lyricSource = ((_d = data.fallback) == null ? void 0 : _d.newSource) || source2;
              await utils_lyricCache.setCachedLyric(songId2, lyricSource, lyricInfo);
              console.log("[getMusicUrl] 歌词已缓存:", songId2, lyricSource);
            }
          } else {
            console.log("[getMusicUrl] API没有返回歌词:", songId2, source2);
          }
          resolve({
            url: data.url,
            lyric: data.lyric || "",
            tlyric: data.tlyric || "",
            rlyric: data.rlyric || "",
            lxlyric: data.lxlyric || "",
            fallback: data.fallback || null
          });
        } else {
          reject(new Error(((_e = res.data) == null ? void 0 : _e.msg) || "获取播放URL失败"));
        }
      },
      fail: (err) => {
        if (lastRequestInfo.requestId !== currentRequestId) {
          console.log("[getMusicUrl] 忽略过期错误:", {
            currentRequestId,
            lastRequestId: lastRequestInfo.requestId
          });
          return;
        }
        if (isResolved)
          return;
        isResolved = true;
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }
        reject(new Error(err.errMsg || "网络请求失败"));
      }
    });
  }).finally(() => {
    pendingMusicUrlRequests.delete(requestKey);
    console.log("[getMusicUrl] 请求完成，移除 pending:", requestKey);
  });
  pendingMusicUrlRequests.set(requestKey, requestPromise);
  return requestPromise;
}
exports.getMusicUrl = getMusicUrl;
