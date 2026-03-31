"use strict";
const common_vendor = require("../common/vendor.js");
const store_modules_list = require("../store/modules/list.js");
const store_modules_player = require("../store/modules/player.js");
const store_modules_system = require("../store/modules/system.js");
const utils_api_music = require("./api/music.js");
const utils_musicUrlCache = require("./musicUrlCache.js");
const utils_lyricCache = require("./lyricCache.js");
const utils_musicParams = require("./musicParams.js");
const playSongCommon = async (song, options = {}) => {
  var _a, _b, _c, _d, _e, _f;
  if (!song || !song.id) {
    console.error("[playSongCommon] 歌曲信息无效");
    return false;
  }
  const {
    listId = store_modules_list.LIST_IDS.DEFAULT,
    addToDefaultList = true,
    source = song.source || "tx"
  } = options;
  console.log("[playSongCommon] ========== 开始播放歌曲 ==========");
  console.log("[playSongCommon] 歌曲ID:", song.id);
  console.log("[playSongCommon] 歌曲名称:", song.name);
  console.log("[playSongCommon] 列表ID:", listId);
  console.log("[playSongCommon] 是否添加到试听列表:", addToDefaultList);
  try {
    const quality = store_modules_system.systemStore.getState().audioQuality || "128k";
    console.log("[playSongCommon] 使用音质:", quality);
    const previousSongId = (_a = store_modules_player.playerStore.state.currentSong) == null ? void 0 : _a.id;
    console.log("[playSongCommon] 之前播放的歌曲ID:", previousSongId);
    console.log("[playSongCommon] 原始专辑信息:", {
      album: song.album,
      albumType: typeof song.album,
      albumName: song.albumName,
      al: song.al
    });
    let albumNameForList = "";
    if (typeof song.album === "string") {
      albumNameForList = song.album;
    } else if (song.album && typeof song.album === "object") {
      albumNameForList = song.album.name || "";
    } else if (song.albumName) {
      albumNameForList = song.albumName;
    } else if (song.al && song.al.name) {
      albumNameForList = song.al.name;
    }
    console.log("[playSongCommon] 提取的专辑名称:", albumNameForList);
    let singerStr = "";
    let singerArr = [];
    if (song.singer && typeof song.singer === "string") {
      singerStr = song.singer;
      singerArr = song.singer.split("/").map((name) => ({ name: name.trim() }));
    } else if (song.ar && Array.isArray(song.ar)) {
      singerArr = song.ar;
      singerStr = song.ar.map((a) => a.name).join("/");
    } else if (song.artists && Array.isArray(song.artists)) {
      singerArr = song.artists;
      singerStr = song.artists.map((a) => a.name).join("/");
    }
    let alObjForList = null;
    if (song.al && typeof song.al === "object") {
      alObjForList = song.al;
    } else if (song.album && typeof song.album === "object" && song.album.picUrl) {
      alObjForList = { picUrl: song.album.picUrl };
    } else if (song.picUrl || song.img) {
      alObjForList = { picUrl: song.picUrl || song.img };
    }
    if (addToDefaultList && listId === store_modules_list.LIST_IDS.DEFAULT) {
      const songToAdd = {
        id: song.id,
        name: song.name,
        singer: singerStr,
        ar: singerArr,
        album: albumNameForList || song.albumName || ((_b = song.al) == null ? void 0 : _b.name) || "",
        al: alObjForList,
        duration: song.dt || song.interval || song.duration,
        source,
        songmid: song.songmid,
        hash: song.hash,
        copyrightId: song.copyrightId,
        img: song.img || song.albumPic || ((_c = song.al) == null ? void 0 : _c.picUrl) || ""
      };
      const defaultList = store_modules_list.listStore.state.defaultList.list;
      const existingIds = new Set(defaultList.map((s) => s.id));
      if (!existingIds.has(songToAdd.id)) {
        store_modules_list.listStore.addListMusics(store_modules_list.LIST_IDS.DEFAULT, [songToAdd], "top");
        console.log("[playSongCommon] 已添加歌曲到试听列表:", songToAdd.name);
      } else {
        console.log("[playSongCommon] 歌曲已在试听列表中:", songToAdd.name);
      }
    }
    store_modules_list.listStore.setPlayerListId(listId);
    let albumName = "";
    if (typeof song.album === "string") {
      albumName = song.album;
    } else if (song.album && typeof song.album === "object") {
      albumName = song.album.name || "";
    }
    let alObj = null;
    if (song.al && typeof song.al === "object") {
      alObj = song.al;
    } else if (song.album && typeof song.album === "object" && song.album.picUrl) {
      alObj = { picUrl: song.album.picUrl };
    } else if (song.picUrl || song.img) {
      alObj = { picUrl: song.picUrl || song.img };
    }
    const initialMusicInfo = {
      id: song.id,
      name: song.name,
      singer: singerStr,
      ar: singerArr,
      album: albumName || song.albumName || ((_d = song.al) == null ? void 0 : _d.name) || "",
      al: alObj,
      duration: song.dt || song.interval || song.duration,
      source,
      songmid: song.songmid,
      hash: song.hash,
      copyrightId: song.copyrightId,
      img: song.img || song.albumPic || ((_e = song.al) == null ? void 0 : _e.picUrl) || "",
      url: "",
      playUrl: "",
      quality,
      lyric: "",
      tlyric: "",
      rlyric: "",
      lxlyric: ""
    };
    store_modules_list.listStore.setPlayMusicInfo(listId, initialMusicInfo, false);
    store_modules_player.playerStore.setCurrentSong(initialMusicInfo, true);
    store_modules_player.playerStore.setStatusText("正在获取播放链接...", 0);
    console.log("[playSongCommon] 已设置歌曲信息，MiniPlayer 将显示");
    const isSameSong = previousSongId === song.id;
    console.log("[playSongCommon] 是否是同一首歌:", isSameSong);
    if (isSameSong) {
      console.log("[playSongCommon] 同一首歌，切换播放/暂停状态");
      store_modules_player.playerStore.clearStatusText();
      if (store_modules_player.playerStore.state.isPlaying) {
        store_modules_player.playerStore.pause();
      } else {
        store_modules_player.playerStore.resume();
      }
      return true;
    }
    let cachedUrl = await utils_musicUrlCache.getCachedMusicUrl(song.id, quality, source);
    let playUrl = cachedUrl;
    let lyricData = null;
    let actualSource = source;
    if (cachedUrl) {
      console.log("[playSongCommon] 使用缓存的播放URL (source:", source, ")");
      store_modules_player.playerStore.setUsingCachedUrl(true);
      const cachedLyric = await utils_lyricCache.getCachedLyric(song.id, source);
      if (cachedLyric) {
        lyricData = cachedLyric;
        console.log("[playSongCommon] 从缓存获取歌词");
      } else {
        lyricData = {};
      }
      actualSource = source;
    } else {
      console.log("[playSongCommon] 调用API获取播放URL");
      const songForRequest = {
        ...song,
        source
      };
      const requestData = utils_musicParams.buildMusicRequestParams(songForRequest, quality);
      if (!requestData) {
        throw new Error("构建请求参数失败");
      }
      console.log("[playSongCommon] 请求参数:", JSON.stringify(requestData));
      let musicUrlData;
      try {
        musicUrlData = await utils_api_music.getMusicUrl(requestData);
        console.log("[playSongCommon] API返回数据");
      } catch (apiError) {
        console.error("[playSongCommon] API调用失败:", apiError);
        throw new Error("获取播放链接失败: " + (apiError.message || "网络请求失败"));
      }
      playUrl = musicUrlData == null ? void 0 : musicUrlData.url;
      if (!playUrl) {
        console.error("[playSongCommon] API返回数据中没有URL");
        throw new Error("无法获取播放链接，该歌曲可能不可用");
      }
      console.log("[playSongCommon] 获取到的播放URL:", playUrl);
      const cacheSource = ((_f = musicUrlData.fallback) == null ? void 0 : _f.newSource) || source;
      actualSource = cacheSource;
      const qualities = ["128k", "320k", "flac"];
      for (const q of qualities) {
        await utils_musicUrlCache.setCachedMusicUrl(song.id, q, playUrl, source);
      }
      console.log("[playSongCommon] 播放URL已缓存 (原始source):", song.id, "source:", source, "所有音质");
      if (cacheSource !== source) {
        for (const q of qualities) {
          await utils_musicUrlCache.setCachedMusicUrl(song.id, q, playUrl, cacheSource);
        }
        console.log("[playSongCommon] 播放URL已缓存 (换源后source):", song.id, "source:", cacheSource, "所有音质");
      }
      lyricData = {
        lyric: musicUrlData.lyric || "",
        tlyric: musicUrlData.tlyric || "",
        rlyric: musicUrlData.rlyric || "",
        lxlyric: musicUrlData.lxlyric || ""
      };
      if (lyricData.lyric || lyricData.tlyric || lyricData.rlyric || lyricData.lxlyric) {
        await utils_lyricCache.setCachedLyric(song.id, source, lyricData);
        console.log("[playSongCommon] 歌词已缓存 (原始source):", song.id, "source:", source);
        if (cacheSource !== source) {
          await utils_lyricCache.setCachedLyric(song.id, cacheSource, lyricData);
          console.log("[playSongCommon] 歌词已缓存 (换源后source):", song.id, "source:", cacheSource);
        }
      }
      if (musicUrlData.fallback && musicUrlData.fallback.toggled) {
        console.log("[playSongCommon] 检测到换源:", {
          originalSource: musicUrlData.fallback.originalSource,
          newSource: musicUrlData.fallback.newSource
        });
        initialMusicInfo.source = musicUrlData.fallback.newSource;
        initialMusicInfo._toggleMusicInfo = {
          originalSource: musicUrlData.fallback.originalSource,
          newSource: musicUrlData.fallback.newSource,
          matchedSong: musicUrlData.fallback.matchedSong,
          toggleTime: Date.now()
        };
        if (musicUrlData.fallback.matchedSong) {
          initialMusicInfo.songmid = musicUrlData.fallback.matchedSong.songmid || song.songmid;
          initialMusicInfo.hash = musicUrlData.fallback.matchedSong.hash || song.hash;
          initialMusicInfo.copyrightId = musicUrlData.fallback.matchedSong.copyrightId || song.copyrightId;
        }
        console.log("[playSongCommon] 已更新歌曲换源信息");
      }
    }
    const finalMusicInfo = {
      ...initialMusicInfo,
      // 确保使用实际的 source（可能是换源后的）
      source: actualSource,
      // 设置url和playUrl为获取到的URL（缓存的或新获取的）
      url: playUrl || "",
      playUrl: playUrl || "",
      lyric: (lyricData == null ? void 0 : lyricData.lyric) || "",
      tlyric: (lyricData == null ? void 0 : lyricData.tlyric) || "",
      rlyric: (lyricData == null ? void 0 : lyricData.rlyric) || "",
      lxlyric: (lyricData == null ? void 0 : lyricData.lxlyric) || ""
    };
    console.log("[playSongCommon] 最终歌曲信息:", finalMusicInfo.name, "URL:", playUrl ? "有" : "无", "使用缓存:", !!cachedUrl);
    store_modules_list.listStore.setPlayMusicInfo(listId, finalMusicInfo, false);
    store_modules_player.playerStore.playSong(finalMusicInfo);
    console.log("[playSongCommon] 播放完成");
    return true;
  } catch (error) {
    console.error("[playSongCommon] 播放失败:", error);
    store_modules_player.playerStore.clearStatusText();
    common_vendor.index.showToast({
      title: "播放失败: " + (error.message || "未知错误"),
      icon: "none"
    });
    return false;
  }
};
exports.playSongCommon = playSongCommon;
