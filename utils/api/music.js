"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_config = require("../config.js");
const utils_musicParams = require("../musicParams.js");
const utils_mesh_meshApi = require("../mesh/meshApi.js");
const utils_lyricCache = require("../lyricCache.js");
const pendingMusicUrlRequests = /* @__PURE__ */ new Map();
const MAX_REQUEST_REUSE_AGE = 1e4;
const REQUEST_TIMEOUT = 3e4;
let requestIdCounter = 0;
let lastRequestInfo = {
  requestId: 0,
  requestKey: "",
  timestamp: 0
};
function getMusicUrl(params, quality = "320k") {
  var _a, _b, _c;
  try {
    const mode = utils_config.getMeshMode();
    if (!mode) {
      console.log("[getMusicUrl] Mesh 模式未选择，触发弹窗检查");
      common_vendor.index.$emit("checkMeshModeBeforeRequest");
      return Promise.reject(new Error("请先选择服务器模式"));
    } else if (mode === "own") {
      if (!utils_config.hasOwnServer()) {
        console.log("[getMusicUrl] own 模式但未设置服务器地址，触发弹窗检查");
        common_vendor.index.$emit("checkMeshModeBeforeRequest");
        return Promise.reject(new Error("请先设置服务器地址"));
      }
    } else if (mode === "free") {
      if (!utils_config.hasLocalScripts()) {
        console.log("[getMusicUrl] free 模式但无本地脚本，触发弹窗检查");
        common_vendor.index.$emit("checkMeshModeBeforeRequest");
        return Promise.reject(new Error("请先导入音源插件"));
      }
    }
  } catch (e) {
    console.log("[getMusicUrl] Mesh 检查异常:", e);
  }
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
    const existingRequest = pendingMusicUrlRequests.get(requestKey);
    const requestAge = Date.now() - existingRequest.createTime;
    if (requestAge > MAX_REQUEST_REUSE_AGE) {
      console.log("[getMusicUrl] 旧请求已过期（" + Math.round(requestAge / 1e3) + "s），丢弃并重新发起:", requestKey);
      pendingMusicUrlRequests.delete(requestKey);
    } else {
      console.log("[getMusicUrl] 复用正在进行的请求:", requestKey, "已存在", Math.round(requestAge / 1e3) + "s");
      return existingRequest.promise;
    }
  }
  const requestPromise = new Promise((resolve, reject) => {
    var _a2;
    let timeoutTimer = null;
    let isResolved = false;
    const resetTimeout = () => {
      if (timeoutTimer)
        clearTimeout(timeoutTimer);
      console.log(`[getMusicUrl] 🔄 重置超时计时器: ${REQUEST_TIMEOUT / 1e3}秒 (节点切换)`);
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
    };
    resetTimeout();
    console.log("[getMusicUrl] 创建新请求:", requestKey, "interval:", (_a2 = requestParams.musicInfo) == null ? void 0 : _a2.interval);
    console.log("[getMusicUrl] 实际发送的请求参数:", JSON.stringify(requestParams));
    const mode = utils_config.getMeshMode();
    if (mode === "free") {
      console.log("[getMusicUrl] 免费模式，走 Mesh 节点");
      if (!utils_config.hasLocalScripts()) {
        if (isResolved)
          return;
        isResolved = true;
        if (timeoutTimer)
          clearTimeout(timeoutTimer);
        resolve({ url: null, error: true, errorMsg: "无可用本地音源脚本" });
        return;
      }
      utils_mesh_meshApi.getMusicUrlFromMesh(requestParams, null, "shared", null, resetTimeout).then((meshResult) => {
        var _a3;
        if (isResolved)
          return;
        isResolved = true;
        if (timeoutTimer)
          clearTimeout(timeoutTimer);
        if (meshResult && meshResult.url) {
          console.log("[getMusicUrl] 免费模式获取成功:", meshResult.nodeUrl);
          if (meshResult.lyric || meshResult.tlyric || meshResult.rlyric || meshResult.lxlyric) {
            const lyricSongId = requestParams.originalSongId || ((_a3 = requestParams.musicInfo) == null ? void 0 : _a3.id) || requestParams.id;
            const lyricSource = meshResult.source || requestParams.source;
            utils_lyricCache.setCachedLyric(lyricSongId, lyricSource, {
              lyric: meshResult.lyric || "",
              tlyric: meshResult.tlyric || "",
              rlyric: meshResult.rlyric || "",
              lxlyric: meshResult.lxlyric || ""
            }).then(() => {
              console.log("[getMusicUrl] 免费模式歌词已缓存:", lyricSongId, lyricSource);
            }).catch((e) => {
              console.error("[getMusicUrl] 免费模式歌词缓存失败:", e);
            });
          }
          resolve({
            url: meshResult.url,
            lyric: meshResult.lyric || "",
            tlyric: meshResult.tlyric || "",
            rlyric: meshResult.rlyric || "",
            lxlyric: meshResult.lxlyric || "",
            fallback: { toggled: meshResult.source !== requestParams.source, originalSource: requestParams.source, newSource: meshResult.source, fromMesh: true },
            fromMesh: true,
            meshNodeUrl: meshResult.nodeUrl,
            meshContributor: meshResult.contributorName,
            scriptName: meshResult.scriptName || ""
          });
        } else {
          resolve({ url: null, error: true, errorMsg: "公共服务器获取失败，请稍后重试" });
        }
      }).catch((err) => {
        if (isResolved)
          return;
        isResolved = true;
        if (timeoutTimer)
          clearTimeout(timeoutTimer);
        resolve({ url: null, error: true, errorMsg: err.message || "公共服务器请求失败" });
      });
      return;
    }
    common_vendor.index.request({
      url: `${utils_config.getServerUrl()}/api/music/url`,
      method: "POST",
      data: requestParams,
      header: {
        "Content-Type": "application/json"
      },
      success: async (res) => {
        var _a3, _b2, _c2, _d, _e, _f, _g;
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
              const lyricSongId = requestParams.originalSongId || songId2;
              await utils_lyricCache.setCachedLyric(lyricSongId, lyricSource, lyricInfo);
              console.log("[getMusicUrl] 歌词已缓存:", lyricSongId, lyricSource);
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
            fallback: data.fallback || null,
            scriptName: ((_e = res.data.data) == null ? void 0 : _e.scriptName) || ""
          });
        } else {
          console.log("[getMusicUrl] 自有服务器返回错误:", res.statusCode, (_f = res.data) == null ? void 0 : _f.msg, "尝试 Mesh 降级");
          const statusCode = res.statusCode;
          const isNoScripts = statusCode === 410;
          const isSourceUnsupported = statusCode === 411 || statusCode === 412;
          if (isNoScripts) {
            console.log("[getMusicUrl] 服务器未导入任何音源脚本，触发导入提醒");
            common_vendor.index.$emit("needImportScripts");
          }
          if (!isNoScripts && !isSourceUnsupported) {
            if (utils_config.hasLocalScripts()) {
              try {
                const meshResult = await utils_mesh_meshApi.getMusicUrlFromMesh(requestParams, null, "shared", null, resetTimeout);
                if (meshResult && meshResult.url) {
                  console.log("[getMusicUrl] Mesh 降级成功（服务器返回错误后）:", meshResult.nodeUrl);
                  resolve({
                    url: meshResult.url,
                    lyric: meshResult.lyric || "",
                    tlyric: meshResult.tlyric || "",
                    rlyric: meshResult.rlyric || "",
                    lxlyric: meshResult.lxlyric || "",
                    fallback: { toggled: meshResult.source !== requestParams.source, originalSource: requestParams.source, newSource: meshResult.source, fromMesh: true },
                    fromMesh: true,
                    meshNodeUrl: meshResult.nodeUrl,
                    meshContributor: meshResult.contributorName,
                    scriptName: meshResult.scriptName || ""
                  });
                  return;
                }
              } catch (meshErr) {
                console.log("[getMusicUrl] Mesh 降级异常（服务器返回错误后）:", meshErr);
              }
            }
          }
          resolve({
            url: null,
            error: true,
            errorMsg: ((_g = res.data) == null ? void 0 : _g.msg) || "获取播放URL失败",
            errorStatusCode: statusCode,
            needImportScripts: isNoScripts,
            sourceUnsupported: isSourceUnsupported
          });
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
        console.log("[getMusicUrl] 自有服务器请求失败，尝试 Mesh 降级:", err.errMsg);
        if (utils_config.hasLocalScripts()) {
          utils_mesh_meshApi.getMusicUrlFromMesh(requestParams, null, "shared", null, resetTimeout).then((meshResult) => {
            if (meshResult && meshResult.url) {
              console.log("[getMusicUrl] Mesh 降级成功，来源节点:", meshResult.nodeUrl);
              resolve({
                url: meshResult.url,
                lyric: meshResult.lyric || "",
                tlyric: meshResult.tlyric || "",
                rlyric: meshResult.rlyric || "",
                lxlyric: meshResult.lxlyric || "",
                fallback: { toggled: meshResult.source !== requestParams.source, originalSource: requestParams.source, newSource: meshResult.source, fromMesh: true },
                fromMesh: true,
                meshNodeUrl: meshResult.nodeUrl,
                meshContributor: meshResult.contributorName,
                scriptName: meshResult.scriptName || ""
              });
            } else {
              console.log("[getMusicUrl] Mesh 降级也失败");
              reject(new Error(err.errMsg || "网络请求失败"));
            }
          }).catch((meshErr) => {
            console.log("[getMusicUrl] Mesh 降级异常:", meshErr);
            reject(new Error(err.errMsg || "网络请求失败"));
          });
        } else {
          reject(new Error(err.errMsg || "网络请求失败"));
        }
      }
    });
  }).finally(() => {
    pendingMusicUrlRequests.delete(requestKey);
    console.log("[getMusicUrl] 请求完成，移除 pending:", requestKey);
  });
  pendingMusicUrlRequests.set(requestKey, {
    promise: requestPromise,
    createTime: Date.now()
  });
  return requestPromise;
}
exports.getMusicUrl = getMusicUrl;
