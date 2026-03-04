"use strict";
const common_vendor = require("../common/vendor.js");
const utils_cache = require("./cache.js");
const pendingPicRequests = /* @__PURE__ */ new Map();
const picApis = {
  // 网易云音乐 - 从歌曲详情获取
  wy: {
    getPicUrl(songInfo) {
      var _a, _b;
      return ((_a = songInfo.al) == null ? void 0 : _a.picUrl) || ((_b = songInfo.album) == null ? void 0 : _b.picUrl) || songInfo.img || null;
    }
  },
  // QQ音乐
  tx: {
    getPicUrl(songInfo) {
      var _a, _b, _c, _d;
      const albumId = songInfo.albumId || ((_a = songInfo.al) == null ? void 0 : _a.id) || ((_b = songInfo.album) == null ? void 0 : _b.id);
      if (albumId) {
        return `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumId}.jpg`;
      }
      return songInfo.img || ((_c = songInfo.al) == null ? void 0 : _c.picUrl) || ((_d = songInfo.album) == null ? void 0 : _d.picUrl) || null;
    }
  },
  // 酷狗音乐
  kg: {
    getPicUrl(songInfo) {
      var _a, _b;
      return songInfo.img || ((_a = songInfo.al) == null ? void 0 : _a.picUrl) || ((_b = songInfo.album) == null ? void 0 : _b.picUrl) || null;
    },
    // 异步获取图片URL
    async fetchPicUrl(songInfo) {
      return new Promise((resolve, reject) => {
        var _a, _b;
        const hash = songInfo.hash || songInfo.songmid;
        const albumId = songInfo.albumId || ((_a = songInfo.album) == null ? void 0 : _a.id);
        const audioId = songInfo.audioId;
        const songmid = songInfo.songmid;
        console.log("[KuGouPic] 开始获取图片:", {
          hash,
          songmid,
          audioId,
          albumId,
          name: songInfo.name
        });
        if (!hash && !audioId && !songmid) {
          console.log("[KuGouPic] 缺少必要参数");
          resolve(null);
          return;
        }
        let albumAudioId;
        if (songmid && songmid.length === 32) {
          albumAudioId = audioId ? audioId.split("_")[0] : "";
        } else {
          albumAudioId = songmid || hash;
        }
        const requestData = {
          appid: 1001,
          area_code: "1",
          behavior: "play",
          clientver: "9020",
          need_hash_offset: 1,
          relate: 1,
          resource: [{
            album_audio_id: albumAudioId,
            album_id: albumId || 0,
            hash: hash || songmid,
            id: 0,
            name: `${songInfo.singer || ((_b = songInfo.artists) == null ? void 0 : _b.map((a) => a.name).join("/")) || "未知歌手"} - ${songInfo.name}.mp3`,
            type: "audio"
          }],
          token: "",
          userid: 2626431536,
          vip: 1
        };
        console.log("[KuGouPic] 请求参数:", JSON.stringify(requestData));
        common_vendor.index.request({
          url: "http://media.store.kugou.com/v1/get_res_privilege",
          method: "POST",
          header: {
            "KG-RC": 1,
            "KG-THash": "expand_search_manager.cpp:852736169:451",
            "User-Agent": "KuGou2012-9020-ExpandSearchManager",
            "Content-Type": "application/json"
          },
          data: requestData,
          success: (res) => {
            var _a2;
            console.log("[KuGouPic] 响应:", res.statusCode, JSON.stringify(res.data).substring(0, 500));
            if (res.data && res.data.error_code === 0 && res.data.data && res.data.data[0]) {
              const info = res.data.data[0].info;
              const img = info.imgsize ? info.image.replace("{size}", info.imgsize[0]) : info.image;
              console.log("[KuGouPic] 获取到图片:", img);
              resolve(img);
            } else {
              console.log("[KuGouPic] 获取图片失败:", (_a2 = res.data) == null ? void 0 : _a2.error_code);
              resolve(null);
            }
          },
          fail: (err) => {
            console.log("[KuGouPic] 请求失败:", err);
            resolve(null);
          }
        });
      });
    }
  },
  // 酷我音乐
  kw: {
    getPicUrl(songInfo) {
      var _a, _b;
      return songInfo.img || ((_a = songInfo.al) == null ? void 0 : _a.picUrl) || ((_b = songInfo.album) == null ? void 0 : _b.picUrl) || null;
    },
    // 异步获取图片URL（KuWo 需要先请求 API 获取真实图片 URL）
    async fetchPicUrl(songInfo) {
      return new Promise((resolve, reject) => {
        const songmid = songInfo.songmid || songInfo.id;
        console.log("[KuWoPic] 开始获取图片:", { songmid, name: songInfo.name });
        if (!songmid) {
          console.log("[KuWoPic] 缺少 songmid");
          resolve(null);
          return;
        }
        const apiUrl = `http://artistpicserver.kuwo.cn/pic.web?corp=kuwo&type=rid_pic&pictype=500&size=500&rid=${songmid}`;
        console.log("[KuWoPic] 请求API:", apiUrl);
        common_vendor.index.request({
          url: apiUrl,
          method: "GET",
          success: (res) => {
            console.log("[KuWoPic] API响应:", res.statusCode, res.data);
            if (res.statusCode === 200 && res.data) {
              let imgUrl = res.data;
              if (typeof imgUrl === "string" && /^http/.test(imgUrl)) {
                console.log("[KuWoPic] 获取到真实图片URL:", imgUrl);
                resolve(imgUrl);
              } else {
                console.log("[KuWoPic] 返回的不是有效图片URL:", imgUrl);
                resolve(null);
              }
            } else {
              console.log("[KuWoPic] 获取图片失败");
              resolve(null);
            }
          },
          fail: (err) => {
            console.log("[KuWoPic] 请求失败:", err);
            resolve(null);
          }
        });
      });
    }
  },
  // 咪咕音乐
  mg: {
    getPicUrl(songInfo) {
      var _a, _b;
      return songInfo.img || ((_a = songInfo.al) == null ? void 0 : _a.picUrl) || ((_b = songInfo.album) == null ? void 0 : _b.picUrl) || null;
    },
    async fetchPicUrl(songInfo) {
      return new Promise((resolve, reject) => {
        const songId = songInfo.songmid || songInfo.id;
        if (!songId) {
          resolve(null);
          return;
        }
        common_vendor.index.request({
          url: `http://music.migu.cn/v3/api/music/audioPlayer/getSongPic?songId=${songId}`,
          header: {
            Referer: "http://music.migu.cn/v3/music/player/audio?from=migu"
          },
          success: (res) => {
            if (res.data && res.data.returnCode === "000000") {
              let url = res.data.largePic || res.data.mediumPic || res.data.smallPic;
              if (url && !/https?:/.test(url)) {
                url = "http:" + url;
              }
              resolve(url);
            } else {
              resolve(null);
            }
          },
          fail: () => {
            resolve(null);
          }
        });
      });
    }
  },
  // 百度音乐
  bd: {
    getPicUrl(songInfo) {
      var _a, _b;
      return songInfo.img || ((_a = songInfo.al) == null ? void 0 : _a.picUrl) || ((_b = songInfo.album) == null ? void 0 : _b.picUrl) || null;
    }
  }
};
function getSongPicUrl(songInfo, source) {
  var _a, _b, _c;
  if (!songInfo)
    return null;
  const picUrl = ((_a = songInfo.meta) == null ? void 0 : _a.picUrl) || ((_b = songInfo.al) == null ? void 0 : _b.picUrl) || ((_c = songInfo.album) == null ? void 0 : _c.picUrl) || songInfo.img || songInfo.pic;
  if (picUrl) {
    return picUrl;
  }
  const sourceId = source || songInfo.sourceId || songInfo.source;
  if (!sourceId) {
    return null;
  }
  const songId = songInfo.id || songInfo.songmid;
  const cachedUrl = utils_cache.getCachedPicUrl(songId, sourceId);
  if (cachedUrl) {
    return cachedUrl;
  }
  if (picApis[sourceId]) {
    const apiPicUrl = picApis[sourceId].getPicUrl(songInfo);
    if (apiPicUrl) {
      utils_cache.setCachedPicUrl(songId, sourceId, apiPicUrl);
      return apiPicUrl;
    }
  }
  return null;
}
async function fetchSongPicUrl(songInfo, source) {
  if (!songInfo)
    return null;
  const syncUrl = getSongPicUrl(songInfo, source);
  if (syncUrl) {
    return syncUrl;
  }
  const sourceId = source || songInfo.sourceId || songInfo.source;
  const songId = songInfo.id || songInfo.songmid;
  const requestKey = `${sourceId}_${songId}`;
  if (pendingPicRequests.has(requestKey)) {
    return pendingPicRequests.get(requestKey);
  }
  if (!sourceId || !picApis[sourceId] || !picApis[sourceId].fetchPicUrl) {
    return null;
  }
  const requestPromise = (async () => {
    try {
      const url = await picApis[sourceId].fetchPicUrl(songInfo);
      if (url) {
        utils_cache.setCachedPicUrl(songId, sourceId, url);
      }
      return url;
    } catch (e) {
      console.error("[fetchSongPicUrl] 获取图片失败:", e);
      return null;
    } finally {
      pendingPicRequests.delete(requestKey);
    }
  })();
  pendingPicRequests.set(requestKey, requestPromise);
  return requestPromise;
}
exports.fetchSongPicUrl = fetchSongPicUrl;
exports.getSongPicUrl = getSongPicUrl;
