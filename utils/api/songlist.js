"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_config = require("../config.js");
const platformNameMap = {
  "wy": "网易云音乐",
  "kg": "酷狗音乐",
  "kw": "酷我音乐",
  "tx": "QQ音乐",
  "mg": "咪咕音乐"
};
async function getListDetail(source, link, page = 1) {
  var _a, _b, _c, _d, _e, _f;
  try {
    const response = await new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: `${utils_config.getServerUrl()}/api/songlist/detail/by-link`,
        method: "POST",
        header: {
          "Content-Type": "application/json"
        },
        data: {
          link,
          source
        },
        success: (res) => {
          var _a2;
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error(((_a2 = res.data) == null ? void 0 : _a2.message) || "获取歌单失败"));
          }
        },
        fail: (err) => {
          reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
        }
      });
    });
    const data = response.data || response;
    const songList = data.list || data.songs || [];
    if (songList.length > 0) {
      console.log("[songlist.js] 第一首歌完整数据:", JSON.stringify(songList[0]));
      console.log("[songlist.js] 第一首歌字段:", Object.keys(songList[0]).join(", "));
      if (source === "mg") {
        const firstSong = songList[0];
        console.log("[songlist.js] 咪咕音乐歌曲关键字段:", {
          id: firstSong.id,
          songmid: firstSong.songmid,
          songId: firstSong.songId,
          copyrightId: firstSong.copyrightId,
          name: firstSong.name
        });
      }
    }
    return {
      list: songList,
      page: data.page || 1,
      limit: data.limit || 1e3,
      total: data.total || songList.length || 0,
      source: data.source || source,
      sourceName: platformNameMap[source] || "未知平台",
      id: ((_a = data.parsed) == null ? void 0 : _a.id) || data.id || "",
      info: {
        name: ((_b = data.info) == null ? void 0 : _b.name) || data.name || "未知歌单",
        img: ((_c = data.info) == null ? void 0 : _c.img) || data.img || data.cover || "",
        desc: ((_d = data.info) == null ? void 0 : _d.desc) || data.desc || data.description || "",
        author: ((_e = data.info) == null ? void 0 : _e.author) || data.author || data.creator || "",
        play_count: ((_f = data.info) == null ? void 0 : _f.play_count) || data.play_count || data.playCount || "0"
      }
    };
  } catch (error) {
    console.error("[getListDetail] 获取歌单详情失败:", error);
    throw error;
  }
}
function formatPlayCount(count) {
  if (!count)
    return "0";
  if (typeof count === "string") {
    return count;
  }
  if (count >= 1e8) {
    return (count / 1e8).toFixed(1) + "亿";
  } else if (count >= 1e4) {
    return (count / 1e4).toFixed(1) + "万";
  }
  return count.toString();
}
function formatDuration(duration) {
  if (!duration)
    return "0:00";
  if (typeof duration === "string" && duration.includes(":")) {
    return duration;
  }
  const minutes = Math.floor(duration / 6e4);
  const seconds = Math.floor(duration % 6e4 / 1e3);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
exports.formatDuration = formatDuration;
exports.formatPlayCount = formatPlayCount;
exports.getListDetail = getListDetail;
