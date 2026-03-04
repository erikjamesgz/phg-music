"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_crypto_wy = require("../crypto/wy.js");
async function getKuwoListDetail(id, page = 1) {
  let realId = id;
  if (id.includes("__")) {
    const parts = id.split("__");
    parts[0].replace("digest-", "");
    realId = parts[1];
  }
  const limit = 1e3;
  const url = `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${realId}&pn=${page - 1}&rn=${limit}&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1&vipver=MUSIC_9.0.5.0_W1&newver=1`;
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const body = res.data;
          if (body.result !== "ok") {
            reject(new Error("获取歌单失败"));
            return;
          }
          if (!body.musiclist || body.musiclist.length === 0) {
            console.log("[Kuwo] 歌单为空或不存在:", realId);
            console.log("[Kuwo] 歌单信息:", {
              title: body.title,
              ispub: body.ispub,
              total: body.total,
              validtotal: body.validtotal
            });
          }
          const formatPlayCount2 = (num) => {
            if (!num)
              return "0";
            if (num > 1e8)
              return parseInt(num / 1e7) / 10 + "亿";
            if (num > 1e4)
              return parseInt(num / 1e3) / 10 + "万";
            return num.toString();
          };
          const formatPlayTime2 = (time) => {
            if (!time)
              return "0:00";
            const m = Math.floor(time / 60);
            const s = Math.floor(time % 60);
            return `${m}:${s.toString().padStart(2, "0")}`;
          };
          const musicList = body.musiclist || [];
          const list = musicList.map((item) => {
            var _a;
            const types = [];
            const _types = {};
            if (item.N_MINFO) {
              const infoArr = item.N_MINFO.split(";");
              for (let info of infoArr) {
                const match = info.match(/level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/);
                if (match) {
                  const bitrate = match[2];
                  const size = (_a = match[4]) == null ? void 0 : _a.toUpperCase();
                  switch (bitrate) {
                    case "4000":
                      types.push({ type: "flac24bit", size });
                      _types.flac24bit = { size };
                      break;
                    case "2000":
                      types.push({ type: "flac", size });
                      _types.flac = { size };
                      break;
                    case "320":
                      types.push({ type: "320k", size });
                      _types["320k"] = { size };
                      break;
                    case "128":
                      types.push({ type: "128k", size });
                      _types["128k"] = { size };
                      break;
                  }
                }
              }
            }
            types.reverse();
            return {
              id: item.id,
              name: item.name,
              singer: item.artist,
              ar: item.artist ? item.artist.split("、").map((name) => ({ name })) : [],
              album: item.album,
              al: { name: item.album, picUrl: item.albumPic || item.pic },
              albumName: item.album,
              albumPic: item.albumPic || item.pic,
              songmid: item.id,
              source: "kw",
              interval: formatPlayTime2(item.duration),
              dt: item.duration * 1e3,
              img: item.albumPic || item.pic,
              types,
              _types,
              typeUrl: {},
              quality: types.some((t) => t.type === "flac" || t.type === "flac24bit") ? "SQ" : types.some((t) => t.type === "320k") ? "HQ" : "128k"
            };
          });
          resolve({
            list,
            page,
            limit: body.rn || limit,
            total: body.total || list.length,
            source: "kw",
            info: {
              name: body.title || "未知歌单",
              img: body.pic || "",
              desc: body.info || "",
              author: body.uname || "",
              play_count: formatPlayCount2(body.playnum)
            }
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
      }
    });
  });
}
async function getKugouListDetailByCode(code) {
  console.log("[Kugou] 通过酷狗码获取歌单:", code);
  const codeUrl = "http://t.kugou.com/command/";
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: codeUrl,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "KG-RC": "1",
        "KG-THash": "network_super_call.cpp:3676261689:379",
        "User-Agent": ""
      },
      data: {
        appid: 1001,
        clientver: 9020,
        mid: "21511157a05844bd085308bc76ef3343",
        clienttime: 640612895,
        key: "36164c4015e704673c588ee202b9ecb8",
        data: code
      },
      success: (res) => {
        var _a;
        console.log("[Kugou] 酷狗码响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          console.log("[Kugou] 酷狗码返回状态:", data.status);
          if (data.status !== 1) {
            reject(new Error("获取歌单信息失败"));
            return;
          }
          const info = (_a = data.data) == null ? void 0 : _a.info;
          if (!info) {
            reject(new Error("歌单信息为空"));
            return;
          }
          console.log("[Kugou] 歌单类型:", info.type, "歌单ID:", info.id);
          if (info.type === 2 || info.type === 4) {
            if (info.userid && info.id) {
              getKugouListByUserId(info.id, info.userid, info.count, info).then(resolve).catch(reject);
            } else if (info.id) {
              getKugouListDetailBySpecialId(info.id).then(resolve).catch(reject);
            } else {
              reject(new Error("无法获取歌单ID"));
            }
          } else if (info.type === 1) {
            reject(new Error("这是单曲，不是歌单"));
          } else {
            reject(new Error("不支持的歌单类型: " + info.type));
          }
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
      }
    });
  });
}
async function getKugouListDetailBySpecialId(specialId) {
  console.log("[Kugou] 通过specialid获取歌单:", specialId);
  const url = `http://www2.kugou.kugou.com/yueku/v9/special/single/${specialId}-5-9999.html`;
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "GET",
      success: (res) => {
        console.log("[Kugou] 响应状态:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const html = res.data;
          let listDataMatch = html.match(/global\.data\s*=\s*(\[.+?\]);/s);
          if (!listDataMatch) {
            listDataMatch = html.match(/global\.data\s*=\s*(\[.+?\])\s*$/m);
          }
          if (!listDataMatch) {
            listDataMatch = html.match(/var\s+global\s*=\s*{[\s\S]*?data\s*:\s*(\[.+?\])/);
          }
          let listInfoMatch = html.match(/global\s*=\s*{[\s\S]*?name\s*:\s*["']([^"']+)["'][\s\S]*?pic\s*:\s*["']([^"']+)["']/);
          if (!listInfoMatch) {
            listInfoMatch = html.match(/name\s*:\s*["']([^"']+)["'][\s\S]*?pic\s*:\s*["']([^"']+)["']/);
          }
          if (!listDataMatch) {
            reject(new Error("未匹配到歌曲数据"));
            return;
          }
          try {
            const songList = JSON.parse(listDataMatch[1]);
            console.log("[Kugou] 歌曲数量:", songList.length);
            let name = "";
            let pic = "";
            if (listInfoMatch) {
              name = listInfoMatch[1];
              pic = listInfoMatch[2];
            }
            const list = formatKugouSongList(songList);
            resolve({
              list,
              page: 1,
              limit: 1e4,
              total: list.length,
              source: "kg",
              info: {
                name: name || "未知歌单",
                img: pic || "",
                desc: "",
                author: songList.length > 0 ? songList[0].nickname || "" : "",
                play_count: songList.length > 0 ? formatPlayCount(songList[0].play_count || songList[0].total_play_count) : "0"
              }
            });
          } catch (e) {
            reject(new Error("解析歌单数据失败"));
          }
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败"));
      }
    });
  });
}
async function getKugouListByUserId(id, userid, count, listInfo = {}) {
  console.log("[Kugou] 通过userid获取歌单:", id, userid, count);
  const url = "http://www2.kugou.kugou.com/apps/kucodeAndShare/app/";
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "KG-RC": "1",
        "KG-THash": "network_super_call.cpp:3676261689:379",
        "User-Agent": ""
      },
      data: {
        appid: 1001,
        clientver: 9020,
        mid: "21511157a05844bd085308bc76ef3343",
        clienttime: 640612895,
        key: "36164c4015e704673c588ee202b9ecb8",
        data: {
          id,
          type: 3,
          userid,
          collect_type: 0,
          page: 1,
          pagesize: count || 1e3
        }
      },
      success: async (res) => {
        console.log("[Kugou] userid API响应:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.status !== 1) {
            reject(new Error("获取歌单失败"));
            return;
          }
          const songList = data.data || [];
          console.log("[Kugou] 获取到歌曲数量:", songList.length);
          const albumMap = await getKugouMusicInfos(songList);
          console.log("[Kugou] 获取到专辑信息数量:", Object.keys(albumMap).length);
          const list = songList.map((item) => {
            const durationMs = item.duration || 0;
            const durationSec = Math.floor(durationMs / 1e3);
            let songName = item.filename ? item.filename.replace(/\.mp3$/, "") : "";
            let singerName = item.singername || "";
            if (!singerName && songName && songName.includes(" - ")) {
              const parts = songName.split(" - ");
              if (parts.length >= 2) {
                singerName = parts[0];
                songName = parts.slice(1).join(" - ");
              }
            }
            const albumName = albumMap[item.hash] || item.album_name || item.album || "";
            return {
              id: item.hash,
              name: songName,
              singer: singerName,
              ar: singerName ? singerName.split("、").map((name) => ({ name })) : [],
              album: albumName,
              al: { name: albumName, picUrl: "" },
              albumName,
              albumPic: "",
              hash: item.hash,
              songmid: item.hash,
              source: "kg",
              interval: formatPlayTime(durationSec),
              dt: durationMs,
              img: "",
              quality: item.bitrate >= 320 ? "HQ" : "128k"
            };
          });
          const playlistName = listInfo.name || "我喜欢的音乐";
          const playlistImg = listInfo.img || "";
          const playlistAuthor = listInfo.username || userid;
          resolve({
            list,
            page: 1,
            limit: count || 1e3,
            total: list.length,
            source: "kg",
            info: {
              name: playlistName,
              img: playlistImg,
              desc: "",
              author: playlistAuthor,
              play_count: "0"
            }
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
      }
    });
  });
}
async function getKugouMusicInfos(songList) {
  console.log("[Kugou] 获取歌曲详细信息，歌曲数量:", songList.length);
  if (!songList || songList.length === 0) {
    return {};
  }
  const url = "http://gateway.kugou.com/v3/album_audio/audio";
  const batchSize = 100;
  const batches = [];
  for (let i = 0; i < songList.length; i += batchSize) {
    const batch = songList.slice(i, i + batchSize);
    const hashs = batch.map((item) => ({ hash: item.hash || item.id }));
    batches.push(hashs);
  }
  console.log("[Kugou] 分批获取专辑信息，总批次数:", batches.length);
  const promises = batches.map((hashs, index) => {
    return new Promise((resolve, reject) => {
      const requestData = {
        area_code: "1",
        show_privilege: 1,
        show_album_info: "1",
        is_publish: "",
        appid: 1005,
        clientver: 11451,
        mid: "1",
        dfid: "-",
        clienttime: Date.now(),
        key: "OIlwieks28dk2k092lksi2UIkp",
        fields: "album_info,author_name,audio_info,ori_audio_name,base,songname,classification",
        data: hashs
      };
      common_vendor.index.request({
        url,
        method: "POST",
        data: requestData,
        header: {
          "Content-Type": "application/json",
          "KG-THash": "13a3164",
          "KG-RC": "1",
          "KG-Fake": "0",
          "KG-RF": "00869891",
          "User-Agent": "Android712-AndroidPhone-11451-376-0-FeeCacheUpdate-wifi",
          "x-router": "kmr.service.kugou.com"
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            let musicInfos = [];
            if (Array.isArray(res.data)) {
              musicInfos = res.data;
            } else if (res.data.data && Array.isArray(res.data.data)) {
              musicInfos = res.data.data;
            } else if (res.data.status === 1 && res.data.data) {
              musicInfos = Array.isArray(res.data.data) ? res.data.data : [];
            } else if (typeof res.data === "object") {
              const keys = Object.keys(res.data);
              for (const key of keys) {
                if (Array.isArray(res.data[key])) {
                  musicInfos = res.data[key];
                  break;
                }
              }
            }
            const allArrays = musicInfos.filter((item) => Array.isArray(item));
            if (allArrays.length === musicInfos.length && musicInfos.length > 1) {
              musicInfos = [];
              allArrays.forEach((arr) => {
                musicInfos.push(...arr);
              });
            } else if (musicInfos.length > 0 && Array.isArray(musicInfos[0])) {
              musicInfos = musicInfos[0];
            }
            resolve(musicInfos);
          } else {
            resolve([]);
          }
        },
        fail: (err) => {
          resolve([]);
        }
      });
    });
  });
  const allResults = await Promise.all(promises);
  const allMusicInfos = allResults.flat();
  const albumMap = {};
  allMusicInfos.forEach((item) => {
    var _a;
    if (item && item.audio_info) {
      const hash = item.audio_info.hash;
      const albumName = ((_a = item.album_info) == null ? void 0 : _a.album_name) || "";
      albumMap[hash] = albumName;
    }
  });
  return albumMap;
}
function formatPlayTime(time) {
  if (!time)
    return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function formatKugouSongList(songList) {
  const formatPlayTime2 = (time) => {
    if (!time)
      return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  return songList.map((item) => {
    const durationMs = item.duration || 0;
    const durationSec = Math.floor(durationMs / 1e3);
    let songName = item.songname || item.name;
    let singerName = item.singername || item.singer;
    if (!singerName && songName && songName.includes(" - ")) {
      const parts = songName.split(" - ");
      if (parts.length >= 2) {
        singerName = parts[0];
        songName = parts.slice(1).join(" - ");
      }
    }
    return {
      id: item.hash || item.id,
      name: songName,
      singer: singerName,
      ar: singerName ? singerName.split("、").map((name) => ({ name })) : [],
      album: item.album_name || item.album,
      al: { name: item.album_name || item.album, picUrl: item.album_img || item.img },
      albumName: item.album_name || item.album,
      albumPic: item.album_img || item.img,
      hash: item.hash,
      songmid: item.hash,
      source: "kg",
      interval: formatPlayTime2(durationSec),
      dt: durationMs,
      img: item.album_img || item.img,
      quality: item.islossless ? "SQ" : item.is320 ? "HQ" : "128k"
    };
  });
}
async function getKugouListDetail(id, page = 1, tryNum = 0) {
  if (tryNum > 2) {
    return Promise.reject(new Error("try max num"));
  }
  console.log("[Kugou] 获取歌单详情, id:", id);
  if (/^\d+$/.test(id)) {
    console.log("[Kugou] 检测到酷狗码，使用酷狗码接口");
    return getKugouListDetailByCode(id);
  } else if (id.startsWith("id_")) {
    const realId = id.replace("id_", "");
    console.log("[Kugou] 移除id_前缀:", realId);
    return getKugouListDetailBySpecialId(realId);
  } else {
    console.log("[Kugou] 作为specialid处理");
    return getKugouListDetailBySpecialId(id);
  }
}
async function getQQListDetail(id, page = 1, songBegin = 0, tryNum = 0) {
  if (tryNum > 2) {
    return Promise.reject(new Error("try max num"));
  }
  const url = "https://u.y.qq.com/cgi-bin/musicu.fcg";
  const requestData = {
    comm: {
      uin: "0",
      ct: 25
    },
    playlist: {
      module: "srf_diss_info.DissInfoServer",
      method: "CgiGetDiss",
      param: {
        disstid: parseInt(id),
        tag: 1,
        userinfo: 1,
        song_begin: songBegin,
        onlysonglist: 0,
        orderlist: 1
      }
    }
  };
  return new Promise((resolve, reject) => {
    console.log("[QQ] 请求URL:", url);
    console.log("[QQ] 请求数据:", JSON.stringify(requestData));
    common_vendor.index.request({
      url,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
      },
      data: requestData,
      success: (res) => {
        var _a;
        console.log("[QQ] 响应状态:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          console.log("[QQ] data.code:", data.code);
          console.log("[QQ] playlist.code:", (_a = data.playlist) == null ? void 0 : _a.code);
          if (data.code !== 0) {
            console.log("[QQ] 返回码错误，重试...:", data.code);
            return getQQListDetail(id, page, songBegin, tryNum + 1).then(resolve).catch(reject);
          }
          if (!data.playlist || data.playlist.code !== 0) {
            console.log("[QQ] playlist错误:", data.playlist);
            reject(new Error("获取歌单失败"));
            return;
          }
          const playlistData = data.playlist.data;
          if (!playlistData || playlistData.code !== 0) {
            console.log("[QQ] 数据错误:", playlistData == null ? void 0 : playlistData.msg);
            reject(new Error("获取歌单失败: " + ((playlistData == null ? void 0 : playlistData.msg) || "未知错误")));
            return;
          }
          const dirinfo = playlistData.dirinfo;
          const songList = playlistData.songlist || [];
          console.log("[QQ] 歌单名称:", dirinfo.title);
          console.log("[QQ] 歌曲数量:", songList.length);
          const formatPlayCount2 = (num) => {
            if (!num)
              return "0";
            if (num > 1e8)
              return parseInt(num / 1e7) / 10 + "亿";
            if (num > 1e4)
              return parseInt(num / 1e3) / 10 + "万";
            return num.toString();
          };
          const formatPlayTime2 = (time) => {
            if (!time)
              return "0:00";
            const m = Math.floor(time / 60);
            const s = Math.floor(time % 60);
            return `${m}:${s.toString().padStart(2, "0")}`;
          };
          const list = songList.map((item) => {
            var _a2, _b;
            const singer = item.singer || [];
            const album = item.album || {};
            return {
              id: item.mid,
              name: item.name,
              singer: singer.map((s) => s.name).join("、"),
              ar: singer.map((s) => ({ name: s.name, mid: s.mid })),
              album: album.name || "",
              al: {
                name: album.name || "",
                picUrl: album.pmid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${album.pmid}.jpg` : ""
              },
              albumName: album.name || "",
              albumPic: album.pmid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${album.pmid}.jpg` : "",
              songmid: item.mid,
              mid: item.mid,
              source: "tx",
              interval: formatPlayTime2(item.interval),
              dt: item.interval * 1e3,
              img: album.pmid ? `https://y.gtimg.cn/music/photo_new/T002R500x500M000${album.pmid}.jpg` : singer.length ? `https://y.gtimg.cn/music/photo_new/T001R500x500M000${singer[0].mid}.jpg` : "",
              quality: ((_a2 = item.file) == null ? void 0 : _a2.size_flac) ? "SQ" : ((_b = item.file) == null ? void 0 : _b.size_320mp3) ? "HQ" : "128k",
              file: item.file
            };
          });
          resolve({
            list,
            page,
            limit: songList.length,
            total: dirinfo.songnum || songList.length,
            source: "tx",
            info: {
              name: dirinfo.title || "未知歌单",
              img: dirinfo.picurl || "",
              desc: dirinfo.desc || "",
              author: dirinfo.host_nick || "",
              play_count: formatPlayCount2(dirinfo.listennum)
            }
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
      }
    });
  });
}
async function getNeteaseSongDetail(ids) {
  console.log("[Netease] 获取歌曲详情, ids数量:", ids.length);
  const url = "https://music.163.com/weapi/v3/song/detail";
  const data = utils_crypto_wy.weapi({
    c: "[" + ids.map((id) => '{"id":' + id + "}").join(",") + "]",
    ids: "[" + ids.join(",") + "]"
  });
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://music.163.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      data: `params=${encodeURIComponent(data.params)}&encSecKey=${encodeURIComponent(data.encSecKey)}`,
      success: (res) => {
        console.log("[Netease] 歌曲详情响应状态:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const result = res.data;
          if (result.code !== 200) {
            reject(new Error("获取歌曲详情失败"));
            return;
          }
          const songs = result.songs || [];
          const privileges = result.privileges || [];
          const formatPlayTime2 = (time) => {
            if (!time)
              return "0:00";
            const m = Math.floor(time / 6e4);
            const s = Math.floor(time % 6e4 / 1e3);
            return `${m}:${s.toString().padStart(2, "0")}`;
          };
          const list = songs.map((item, index) => {
            const privilege = privileges.find((p) => p.id === item.id) || privileges[index];
            const artists = item.ar || [];
            const album = item.al || {};
            return {
              id: item.id,
              name: item.name,
              singer: artists.map((a) => a.name).join("、"),
              ar: artists,
              album: album.name,
              al: { name: album.name, picUrl: album.picUrl },
              albumName: album.name,
              albumPic: album.picUrl,
              songmid: item.id,
              source: "wy",
              interval: formatPlayTime2(item.dt),
              dt: item.dt,
              img: album.picUrl,
              quality: (privilege == null ? void 0 : privilege.maxbr) >= 999e3 ? "SQ" : (privilege == null ? void 0 : privilege.maxbr) >= 32e4 ? "HQ" : "128k"
            };
          });
          resolve(list);
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
      }
    });
  });
}
async function getNeteaseListDetail(id, page = 1) {
  const limit = 1e3;
  const offset = (page - 1) * limit;
  const url = `https://music.163.com/api/v3/playlist/detail?id=${id}`;
  console.log("[Netease] 请求歌单详情URL:", url);
  const formatPlayCount2 = (num) => {
    if (!num)
      return "0";
    if (num > 1e8)
      return parseInt(num / 1e7) / 10 + "亿";
    if (num > 1e4)
      return parseInt(num / 1e3) / 10 + "万";
    return num.toString();
  };
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "GET",
      header: {
        "Referer": "https://music.163.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      success: async (res) => {
        var _a;
        console.log("[Netease] 歌单详情响应状态:", res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          if (data.code !== 200) {
            console.log("[Netease] 返回码错误:", data.code);
            reject(new Error("获取歌单失败"));
            return;
          }
          const playlist = data.playlist || {};
          const trackIds = playlist.trackIds || [];
          const tracks = playlist.tracks || [];
          console.log("[Netease] 歌单歌曲总数:", playlist.trackCount);
          console.log("[Netease] trackIds数量:", trackIds.length);
          console.log("[Netease] tracks数量:", tracks.length);
          const pageTrackIds = trackIds.slice(offset, offset + limit).map((t) => t.id);
          console.log("[Netease] 当前页需要获取的歌曲数:", pageTrackIds.length);
          let list = [];
          if (page === 1 && tracks.length >= pageTrackIds.length) {
            console.log("[Netease] 使用返回的 tracks 数据");
            const formatPlayTime2 = (time) => {
              if (!time)
                return "0:00";
              const m = Math.floor(time / 6e4);
              const s = Math.floor(time % 6e4 / 1e3);
              return `${m}:${s.toString().padStart(2, "0")}`;
            };
            list = tracks.map((item) => {
              const artists = item.ar || [];
              const album = item.al || {};
              return {
                id: item.id,
                name: item.name,
                singer: artists.map((a) => a.name).join("、"),
                ar: artists,
                album: album.name,
                al: { name: album.name, picUrl: album.picUrl },
                albumName: album.name,
                albumPic: album.picUrl,
                songmid: item.id,
                source: "wy",
                interval: formatPlayTime2(item.dt),
                dt: item.dt,
                img: album.picUrl,
                quality: "128k"
              };
            });
          } else if (pageTrackIds.length > 0) {
            console.log("[Netease] 需要获取歌曲详情");
            const batchSize = 500;
            for (let i = 0; i < pageTrackIds.length; i += batchSize) {
              const batch = pageTrackIds.slice(i, i + batchSize);
              console.log(`[Netease] 获取第 ${Math.floor(i / batchSize) + 1} 批歌曲, 数量: ${batch.length}`);
              try {
                const batchList = await getNeteaseSongDetail(batch);
                list = list.concat(batchList);
              } catch (err) {
                console.error("[Netease] 获取歌曲详情失败:", err);
              }
            }
          }
          console.log("[Netease] 最终歌曲数量:", list.length);
          resolve({
            list,
            page,
            limit,
            total: playlist.trackCount || trackIds.length,
            source: "wy",
            info: {
              name: playlist.name || "未知歌单",
              img: playlist.coverImgUrl || "",
              desc: playlist.description || "",
              author: ((_a = playlist.creator) == null ? void 0 : _a.nickname) || "",
              play_count: formatPlayCount2(playlist.playCount)
            }
          });
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error("网络请求失败: " + (err.errMsg || "未知错误")));
      }
    });
  });
}
async function getMiguListDetail(id, page = 1, tryNum = 0) {
  var _a, _b, _c;
  if (tryNum > 2) {
    return Promise.reject(new Error("try max num"));
  }
  let realId = id;
  if (/\/playlist[/?]/.test(id)) {
    const match = id.match(/(?:playlistId|id)=(\d+)/);
    if (match) {
      realId = match[1];
    }
  }
  const limit = 50;
  const listUrl = `https://app.c.nf.migu.cn/MIGUM3.0/resource/playlist/song/v2.0?pageNo=${page}&pageSize=${limit}&playlistId=${realId}`;
  const infoUrl = `https://c.musicapp.migu.cn/MIGUM3.0/resource/playlist/v2.0?playlistId=${realId}`;
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    "Referer": "https://m.music.migu.cn/"
  };
  console.log("[Migu] 请求歌曲列表URL:", listUrl);
  console.log("[Migu] 请求歌单信息URL:", infoUrl);
  const formatPlayCount2 = (num) => {
    if (!num)
      return "0";
    if (num > 1e8)
      return parseInt(num / 1e7) / 10 + "亿";
    if (num > 1e4)
      return parseInt(num / 1e3) / 10 + "万";
    return num.toString();
  };
  const formatPlayTime2 = (time) => {
    if (!time)
      return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const getSongList = () => {
    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: listUrl,
        method: "GET",
        header: defaultHeaders,
        success: (res) => {
          console.log("[Migu] 歌曲列表响应:", res.statusCode);
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error("获取歌曲列表失败"));
          }
        },
        fail: reject
      });
    });
  };
  const getPlaylistInfo = () => {
    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        url: infoUrl,
        method: "GET",
        header: defaultHeaders,
        success: (res) => {
          console.log("[Migu] 歌单信息响应:", res.statusCode);
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error("获取歌单信息失败"));
          }
        },
        fail: reject
      });
    });
  };
  try {
    const [listData, infoData] = await Promise.all([getSongList(), getPlaylistInfo()]);
    console.log("[Migu] listData.code:", listData.code);
    console.log("[Migu] infoData.code:", infoData.code);
    if (listData.code !== "000000") {
      console.log("[Migu] 歌曲列表返回码错误，重试...");
      return getMiguListDetail(id, page, tryNum + 1);
    }
    if (infoData.code !== "000000") {
      console.log("[Migu] 歌单信息返回码错误，重试...");
      return getMiguListDetail(id, page, tryNum + 1);
    }
    const songList = ((_a = listData.data) == null ? void 0 : _a.songList) || [];
    const info = infoData.data || {};
    console.log("[Migu] 歌曲数量:", songList.length);
    console.log("[Migu] 歌单名称:", info.title);
    const list = songList.map((item) => {
      const singers = item.singerList || [];
      const singerNames = singers.map((s) => s.name).join("、");
      const types = [];
      const _types = {};
      const formats = item.audioFormats || [];
      formats.forEach((fmt) => {
        if (fmt.formatType === "PQ") {
          types.push({ type: "128k", size: fmt.asize });
          _types["128k"] = { size: fmt.asize };
        } else if (fmt.formatType === "HQ") {
          types.push({ type: "320k", size: fmt.asize });
          _types["320k"] = { size: fmt.asize };
        } else if (fmt.formatType === "SQ") {
          types.push({ type: "flac", size: fmt.asize });
          _types["flac"] = { size: fmt.asize };
        }
      });
      let imgUrl = "";
      if (item.img1) {
        imgUrl = item.img1.startsWith("http") ? item.img1 : `https://d.musicapp.migu.cn${item.img1}`;
      } else if (item.img2) {
        imgUrl = item.img2.startsWith("http") ? item.img2 : `https://d.musicapp.migu.cn${item.img2}`;
      } else if (item.img3) {
        imgUrl = item.img3.startsWith("http") ? item.img3 : `https://d.musicapp.migu.cn${item.img3}`;
      }
      return {
        id: item.copyrightId || item.songId,
        name: item.songName || item.name,
        singer: singerNames,
        ar: singers,
        album: item.album,
        al: {
          name: item.album,
          picUrl: imgUrl
        },
        albumName: item.album,
        albumPic: imgUrl,
        // 咪咕音乐播放需要 copyrightId 和 songId 两个字段
        // copyrightId 用于获取播放URL，songId 作为 songmid
        songmid: item.songId,
        copyrightId: item.copyrightId,
        source: "mg",
        interval: formatPlayTime2(item.duration),
        dt: item.duration * 1e3,
        img: imgUrl,
        types,
        _types,
        typeUrl: {},
        quality: formats.some((f) => f.formatType === "SQ") ? "SQ" : formats.some((f) => f.formatType === "HQ") ? "HQ" : "128k"
      };
    });
    const opNumItem = info.opNumItem || {};
    return {
      list,
      page,
      limit,
      total: ((_b = listData.data) == null ? void 0 : _b.totalCount) || list.length,
      source: "mg",
      info: {
        name: info.title || "未知歌单",
        img: ((_c = info.imgItem) == null ? void 0 : _c.img) || info.originalImgUrl || "",
        desc: info.summary || "",
        author: info.ownerName || "",
        play_count: formatPlayCount2(opNumItem.playNum)
      }
    };
  } catch (error) {
    console.error("[Migu] 请求失败:", error);
    if (tryNum < 2) {
      return getMiguListDetail(id, page, tryNum + 1);
    }
    throw error;
  }
}
async function getListDetailDirect(source, id, page = 1) {
  console.log("[songlist-direct] 获取歌单详情:", source, id, page);
  switch (source) {
    case "kw":
      return getKuwoListDetail(id, page);
    case "kg":
      return getKugouListDetail(id, page);
    case "tx":
      return getQQListDetail(id, page);
    case "wy":
      return getNeteaseListDetail(id, page);
    case "mg":
      return getMiguListDetail(id, page);
    default:
      throw new Error(`不支持的音源: ${source}`);
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
exports.getListDetailDirect = getListDetailDirect;
