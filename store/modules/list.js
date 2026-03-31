"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const LIST_IDS = {
  DEFAULT: "default",
  // 试听列表
  LOVE: "love",
  // 我的收藏
  TEMP: "temp",
  // 临时列表（歌单播放用）
  DOWNLOAD: "download"
  // 下载列表
};
const PLAY_MODE = {
  listLoop: "listLoop",
  // 列表循环
  random: "random",
  // 随机播放
  list: "list",
  // 顺序播放
  singleLoop: "singleLoop",
  // 单曲循环
  none: "none"
  // 禁用（播放结束后不自动播放下一首）
};
const PLAY_MODE_LIST = [
  PLAY_MODE.listLoop,
  PLAY_MODE.random,
  PLAY_MODE.list,
  PLAY_MODE.singleLoop,
  PLAY_MODE.none
];
const state = common_vendor.reactive({
  // 试听列表 - 对应洛雪音乐的 DEFAULT
  defaultList: {
    id: LIST_IDS.DEFAULT,
    name: "试听列表",
    list: []
  },
  // 我的收藏 - 对应洛雪音乐的 LOVE
  loveList: {
    id: LIST_IDS.LOVE,
    name: "我的收藏",
    list: []
  },
  // 临时列表 - 对应洛雪音乐的 TEMP，用于歌单详情页播放
  tempList: {
    id: LIST_IDS.TEMP,
    name: "",
    // 临时列表名称随歌单变化
    list: [],
    meta: {
      // 元数据，记录来源歌单信息
      id: "",
      // 原始歌单ID
      source: "",
      // 来源平台
      name: ""
      // 歌单名称
    }
  },
  // 用户自定义列表
  userLists: [],
  // 已播放列表 - 用于随机模式回溯
  playedList: [],
  // 稍后播放列表 - 优先级最高
  tempPlayList: [],
  // 当前播放信息
  playInfo: {
    playIndex: -1,
    // 在当前列表中的索引
    playerListId: null,
    // 当前播放的列表ID
    playerPlayIndex: -1
    // 在播放器中的索引（过滤后）
  },
  // 当前播放歌曲信息
  playMusicInfo: {
    listId: null,
    // 歌曲所属的列表ID
    musicInfo: null,
    // 歌曲信息
    isTempPlay: false
    // 是否临时播放
  }
});
const STORAGE_PREFIX = {
  defaultList: "@list_default",
  loveList: "@list_love",
  userLists: "@user_lists",
  playInfo: "@play_info"
};
function generateMusicId(musicInfo) {
  if (musicInfo.id)
    return String(musicInfo.id);
  const name = musicInfo.name || "";
  const singer = musicInfo.singer || "";
  return `${name}_${singer}_${Date.now()}`;
}
function normalizeMusicInfo(musicInfo) {
  var _a, _b, _c, _d;
  if (!musicInfo)
    return null;
  return {
    id: generateMusicId(musicInfo),
    name: musicInfo.name || "未知歌曲",
    singer: musicInfo.singer || ((_a = musicInfo.ar) == null ? void 0 : _a.map((a) => a.name).join("/")) || "未知歌手",
    albumName: musicInfo.albumName || ((_b = musicInfo.al) == null ? void 0 : _b.name) || "",
    album: musicInfo.album || musicInfo.al || { picUrl: "" },
    al: musicInfo.al || musicInfo.album || { picUrl: "" },
    ar: musicInfo.ar || [{ name: musicInfo.singer || "未知歌手" }],
    duration: musicInfo.duration || musicInfo.dt || 0,
    dt: musicInfo.dt || musicInfo.duration || 0,
    picUrl: musicInfo.picUrl || ((_c = musicInfo.al) == null ? void 0 : _c.picUrl) || ((_d = musicInfo.album) == null ? void 0 : _d.picUrl) || "",
    img: musicInfo.img || musicInfo.picUrl || "",
    source: musicInfo.source || musicInfo.sourceId || "",
    sourceId: musicInfo.sourceId || musicInfo.source || "",
    quality: musicInfo.quality || "",
    types: musicInfo.types || [],
    // 保留平台特定的ID字段（如QQ音乐的songmid）
    songmid: musicInfo.songmid || musicInfo.songMid || musicInfo.mid || "",
    hash: musicInfo.hash || "",
    // 歌词数据不存储在列表中，避免数据过大
    lyric: musicInfo.lyric || "",
    tlyric: musicInfo.tlyric || "",
    rlyric: musicInfo.rlyric || "",
    lxlyric: musicInfo.lxlyric || ""
  };
}
function serializeMusicInfo(musicInfo) {
  if (!musicInfo)
    return null;
  return {
    id: musicInfo.id,
    name: musicInfo.name,
    singer: musicInfo.singer,
    albumName: musicInfo.albumName,
    al: musicInfo.al ? { picUrl: musicInfo.al.picUrl } : { picUrl: "" },
    ar: musicInfo.ar ? musicInfo.ar.map((a) => ({ name: a.name })) : [{ name: musicInfo.singer || "未知歌手" }],
    dt: musicInfo.dt || musicInfo.duration || 0,
    picUrl: musicInfo.picUrl,
    source: musicInfo.source,
    sourceId: musicInfo.sourceId,
    quality: musicInfo.quality,
    // 保留平台特定的ID字段（用于获取评论等功能）
    songmid: musicInfo.songmid || musicInfo.songMid || musicInfo.mid || "",
    hash: musicInfo.hash || ""
    // 不存储歌词数据到本地，歌词单独缓存
  };
}
function getList(listId) {
  switch (listId) {
    case LIST_IDS.DEFAULT:
      return state.defaultList.list;
    case LIST_IDS.LOVE:
      return state.loveList.list;
    case LIST_IDS.TEMP:
      return state.tempList.list;
    default:
      const userList = state.userLists.find((l) => l.id === listId);
      return userList ? userList.list : [];
  }
}
function getPlayIndex(listId, musicInfo, isTempPlay) {
  console.log("[getPlayIndex] 开始 - listId:", listId, "musicInfo:", musicInfo == null ? void 0 : musicInfo.name, "isTempPlay:", isTempPlay);
  console.log("[getPlayIndex] 当前 playerListId:", state.playInfo.playerListId, "playerPlayIndex:", state.playInfo.playerPlayIndex);
  const effectivePlayerListId = state.playInfo.playerListId || listId;
  const playerList = getList(effectivePlayerListId);
  const list = getList(listId);
  console.log("[getPlayIndex] playerList长度:", playerList.length, "list长度:", list.length);
  let playIndex = -1;
  let playerPlayIndex = -1;
  if (playerList.length) {
    playerPlayIndex = Math.min(state.playInfo.playerPlayIndex, playerList.length - 1);
  }
  if (list.length && musicInfo) {
    const currentId = musicInfo.id;
    playIndex = list.findIndex((m) => m.id === currentId);
    console.log("[getPlayIndex] 查找歌曲索引:", currentId, "结果:", playIndex);
    if (!isTempPlay) {
      if (playIndex < 0) {
        playerPlayIndex = playerPlayIndex < 1 ? list.length - 1 : playerPlayIndex - 1;
      } else {
        playerPlayIndex = playIndex;
      }
    }
  }
  console.log("[getPlayIndex] 返回 - playIndex:", playIndex, "playerPlayIndex:", playerPlayIndex);
  return { playIndex, playerPlayIndex };
}
const readonlyState = common_vendor.readonly(state);
const currentTempListId = common_vendor.computed(() => {
  var _a;
  if (state.playInfo.playerListId === "temp" && ((_a = state.tempList.meta) == null ? void 0 : _a.id)) {
    return state.tempList.meta.id;
  }
  return "";
});
const currentTempListLink = common_vendor.computed(() => {
  var _a;
  if (state.playInfo.playerListId === "temp" && ((_a = state.tempList.meta) == null ? void 0 : _a.link)) {
    return state.tempList.meta.link;
  }
  return "";
});
const listStore = {
  // 获取响应式状态（返回缓存的 readonly 对象）
  get state() {
    return readonlyState;
  },
  // 获取状态（兼容旧代码）
  getState() {
    return state;
  },
  // 获取当前临时列表ID（响应式）
  getCurrentTempListId() {
    return currentTempListId.value;
  },
  // 获取当前临时列表link（响应式）
  getCurrentTempListLink() {
    return currentTempListLink.value;
  },
  /**
   * 获取列表
   * @param {String} listId 列表ID
   * @returns {Array} 歌曲列表
   */
  getList(listId) {
    return getList(listId);
  },
  // ========== 列表操作 ==========
  /**
   * 添加歌曲到试听列表
   * @param {Object|Array} musicInfo 歌曲信息或歌曲数组
   * @param {String} addMusicLocationType 添加位置：'top'(顶部), 'bottom'(底部)
   * @returns {Number} 添加后的歌曲在列表中的索引
   */
  addToDefaultList(musicInfo, addMusicLocationType = "bottom") {
    const list = Array.isArray(musicInfo) ? musicInfo : [musicInfo];
    const normalizedList = list.map(normalizeMusicInfo).filter(Boolean);
    normalizedList.forEach((song) => {
      const existIndex = state.defaultList.list.findIndex((m) => m.id === song.id);
      if (existIndex > -1) {
        state.defaultList.list.splice(existIndex, 1);
      }
    });
    if (addMusicLocationType === "top") {
      state.defaultList.list.unshift(...normalizedList);
    } else {
      state.defaultList.list.push(...normalizedList);
    }
    const MAX_DEFAULT_LIST_SIZE = 500;
    if (state.defaultList.list.length > MAX_DEFAULT_LIST_SIZE) {
      state.defaultList.list = state.defaultList.list.slice(-MAX_DEFAULT_LIST_SIZE);
    }
    this.saveDefaultList();
    const firstSong = normalizedList[0];
    return state.defaultList.list.findIndex((m) => m.id === firstSong.id);
  },
  /**
   * 从试听列表移除歌曲
   * @param {String} musicId 歌曲ID
   */
  removeFromDefaultList(musicId) {
    const index = state.defaultList.list.findIndex((m) => m.id === musicId);
    if (index > -1) {
      state.defaultList.list.splice(index, 1);
      this.saveDefaultList();
    }
  },
  /**
   * 清空试听列表
   */
  clearDefaultList() {
    state.defaultList.list = [];
    this.saveDefaultList();
  },
  /**
   * 添加歌曲到我的收藏
   * @param {Object} musicInfo 歌曲信息
   * @returns {Boolean} 是否添加成功
   */
  addToLoveList(musicInfo) {
    const normalizedSong = normalizeMusicInfo(musicInfo);
    if (!normalizedSong)
      return false;
    const existIndex = state.loveList.list.findIndex((m) => m.id === normalizedSong.id);
    if (existIndex > -1) {
      return false;
    }
    state.loveList.list.push(normalizedSong);
    this.saveLoveList();
    return true;
  },
  /**
   * 从我的收藏移除歌曲
   * @param {String} musicId 歌曲ID
   */
  removeFromLoveList(musicId) {
    const index = state.loveList.list.findIndex((m) => m.id === musicId);
    if (index > -1) {
      state.loveList.list.splice(index, 1);
      this.saveLoveList();
    }
  },
  /**
   * 检查歌曲是否在收藏列表
   * @param {String} musicId 歌曲ID
   * @returns {Boolean}
   */
  isInLoveList(musicId) {
    return state.loveList.list.some((m) => m.id === musicId);
  },
  /**
   * 切换收藏状态
   * @param {Object} musicInfo 歌曲信息
   * @returns {Boolean} 切换后的收藏状态
   */
  toggleLove(musicInfo) {
    const normalizedSong = normalizeMusicInfo(musicInfo);
    if (!normalizedSong)
      return false;
    if (this.isInLoveList(normalizedSong.id)) {
      this.removeFromLoveList(normalizedSong.id);
      return false;
    } else {
      this.addToLoveList(normalizedSong);
      return true;
    }
  },
  /**
   * 设置临时列表（歌单播放用）
   * @param {String} listId 歌单ID
   * @param {Array} list 歌曲列表
   * @param {Object} meta 元数据
   */
  setTempList(listId, list, meta = {}) {
    state.tempList.id = listId;
    const existingSongs = /* @__PURE__ */ new Map();
    state.tempList.list.forEach((song) => {
      if (song.id) {
        existingSongs.set(song.id, song);
      }
    });
    state.tempList.list = list.map((song) => {
      const normalized = normalizeMusicInfo(song);
      if (!normalized)
        return null;
      const existing = existingSongs.get(normalized.id);
      if (existing && existing._toggleMusicInfo) {
        console.log("[setTempList] 保留换源信息:", normalized.name, "source:", existing.source);
        return {
          ...normalized,
          source: existing.source,
          songmid: existing.songmid,
          hash: existing.hash,
          copyrightId: existing.copyrightId,
          _toggleMusicInfo: existing._toggleMusicInfo
        };
      }
      return normalized;
    }).filter(Boolean);
    state.tempList.meta = {
      id: meta.id || listId,
      source: meta.source || "",
      name: meta.name || "临时列表",
      link: meta.link || ""
    };
  },
  /**
   * 清空临时列表
   */
  clearTempList() {
    state.tempList.list = [];
    state.tempList.meta = { id: "", source: "", name: "" };
  },
  // ========== 稍后播放列表 ==========
  /**
   * 添加歌曲到稍后播放列表（兼容旧接口）
   * @param {Object} musicInfo 歌曲信息
   * @param {String} listId 列表ID
   * @param {Boolean} isTempPlay 是否临时播放
   */
  addTempPlayList(musicInfo, listId = LIST_IDS.DEFAULT, isTempPlay = false) {
    const normalizedSong = normalizeMusicInfo(musicInfo);
    if (!normalizedSong)
      return;
    state.tempPlayList.push({
      listId,
      musicInfo: normalizedSong,
      isTempPlay
    });
  },
  /**
   * 添加歌曲到稍后播放列表
   * @param {Object} playMusicInfo 播放信息 { listId, musicInfo, isTempPlay }
   */
  addTempPlay(playMusicInfo) {
    state.tempPlayList.push(playMusicInfo);
  },
  /**
   * 获取下一首稍后播放的歌曲
   * @returns {Object|null}
   */
  getNextTempPlay() {
    if (state.tempPlayList.length === 0)
      return null;
    return state.tempPlayList.shift();
  },
  /**
   * 清空稍后播放列表
   */
  clearTempPlayList() {
    state.tempPlayList = [];
  },
  // ========== 已播放列表 ==========
  /**
   * 添加歌曲到已播放列表
   * @param {Object} playMusicInfo 播放信息
   */
  addPlayedList(playMusicInfo) {
    state.playedList.push(playMusicInfo);
    if (state.playedList.length > 1e3) {
      state.playedList = state.playedList.slice(-500);
    }
  },
  /**
   * 从已播放列表移除歌曲
   * @param {Number} index 索引
   */
  removePlayedList(index) {
    if (index >= 0 && index < state.playedList.length) {
      state.playedList.splice(index, 1);
    }
  },
  /**
   * 清空已播放列表
   */
  clearPlayedList() {
    state.playedList = [];
  },
  /**
   * 获取上一首已播放的歌曲
   * @returns {Object|null}
   */
  getPrevPlayed() {
    var _a;
    if (state.playedList.length < 2)
      return null;
    const currentId = (_a = state.playMusicInfo.musicInfo) == null ? void 0 : _a.id;
    if (!currentId)
      return null;
    const currentIndex = state.playedList.findIndex((m) => m.musicInfo.id === currentId);
    if (currentIndex <= 0)
      return null;
    return state.playedList[currentIndex - 1];
  },
  // ========== 播放信息 ==========
  /**
   * 设置当前播放歌曲信息
   * @param {String} listId 列表ID
   * @param {Object} musicInfo 歌曲信息
   * @param {Boolean} isTempPlay 是否临时播放
   */
  setPlayMusicInfo(listId, musicInfo, isTempPlay = false) {
    console.log("[listStore] setPlayMusicInfo 开始:", listId, musicInfo == null ? void 0 : musicInfo.name, "ID:", musicInfo == null ? void 0 : musicInfo.id);
    console.log("[listStore] musicInfo.ar:", musicInfo == null ? void 0 : musicInfo.ar);
    console.log("[listStore] musicInfo.singer:", musicInfo == null ? void 0 : musicInfo.singer);
    console.log("[listStore] musicInfo完整数据:", JSON.stringify(musicInfo));
    const normalizedMusicInfo = musicInfo ? normalizeMusicInfo(musicInfo) : null;
    state.playMusicInfo = {
      listId,
      musicInfo: normalizedMusicInfo,
      isTempPlay
    };
    console.log("[listStore] normalizeMusicInfo后:", JSON.stringify(state.playMusicInfo.musicInfo));
    state.playInfo.playerListId = listId;
    if (normalizedMusicInfo) {
      const { playIndex, playerPlayIndex } = getPlayIndex(listId, normalizedMusicInfo, isTempPlay);
      console.log("[listStore] 计算播放索引 - playIndex:", playIndex, "playerPlayIndex:", playerPlayIndex);
      state.playInfo.playIndex = playIndex;
      state.playInfo.playerPlayIndex = playerPlayIndex;
    } else {
      state.playInfo.playIndex = -1;
      state.playInfo.playerPlayIndex = -1;
    }
    console.log("[listStore] setPlayMusicInfo 完成 - playInfo:", JSON.stringify(state.playInfo));
  },
  /**
   * 更新播放索引
   */
  updatePlayIndex() {
    const { playIndex, playerPlayIndex } = getPlayIndex(
      state.playMusicInfo.listId,
      state.playMusicInfo.musicInfo,
      state.playMusicInfo.isTempPlay
    );
    state.playInfo.playIndex = playIndex;
    state.playInfo.playerPlayIndex = playerPlayIndex;
  },
  /**
   * 根据歌曲ID更新播放索引
   * @param {String} listId 列表ID
   * @param {String} songId 歌曲ID
   */
  updatePlayIndexByListId(listId, songId) {
    const list = getList(listId);
    if (!list || !list.length)
      return;
    const playIndex = list.findIndex((s) => s.id === songId);
    console.log("[listStore] updatePlayIndexByListId:", listId, "songId:", songId, "playIndex:", playIndex);
    if (playIndex !== -1) {
      state.playInfo.playIndex = playIndex;
      state.playInfo.playerPlayIndex = playIndex;
      state.playInfo.playerListId = listId;
    }
  },
  /**
   * 设置播放器列表ID
   * @param {String} listId 列表ID
   */
  setPlayerListId(listId) {
    console.log("[listStore] setPlayerListId:", listId, "当前:", state.playInfo.playerListId);
    state.playInfo.playerListId = listId;
    console.log("[listStore] setPlayerListId 完成:", state.playInfo.playerListId);
  },
  /**
   * 更新歌单中的歌曲信息
   * @param {Object} song 更新后的歌曲信息
   * @returns {Object|null} 返回更新后的歌曲信息，如果没有更新则返回null
   */
  updateSongInList(song) {
    var _a;
    if (!song || !song.id)
      return null;
    console.log("[listStore] updateSongInList:", song.name, "ID:", song.id, "source:", song.source, "has _toggleMusicInfo:", !!song._toggleMusicInfo);
    console.log("[listStore] tempList.list 长度:", state.tempList.list.length);
    let updatedSong = null;
    const updateList = (list) => {
      const index = list.findIndex((item) => item.id === song.id);
      if (index !== -1) {
        console.log("[listStore] 更新列表中的歌曲，索引:", index, "歌曲ID:", song.id);
        list[index] = { ...list[index], ...song };
        updatedSong = list[index];
      } else {
        console.log("[listStore] 未找到歌曲，歌曲ID:", song.id, "列表长度:", list.length);
      }
    };
    updateList(state.defaultList.list);
    updateList(state.loveList.list);
    updateList(state.tempList.list);
    state.userLists.forEach((userList) => {
      updateList(userList.list);
    });
    if (((_a = state.playMusicInfo.musicInfo) == null ? void 0 : _a.id) === song.id) {
      console.log("[listStore] 更新播放信息中的歌曲");
      state.playMusicInfo.musicInfo = { ...state.playMusicInfo.musicInfo, ...song };
    }
    console.log("[listStore] updateSongInList 完成，返回:", updatedSong == null ? void 0 : updatedSong.name, updatedSong == null ? void 0 : updatedSong.source);
    return updatedSong;
  },
  // ========== 播放控制 ==========
  /**
   * 获取下一首歌曲
   * @param {String} togglePlayMethod 切换模式: 'listLoop', 'random', 'list', 'singleLoop', 'none'
   * @param {Boolean} isAutoToggle 是否自动切换
   * @returns {Object|null} 下一首歌曲信息
   */
  getNextSong(togglePlayMethod = "listLoop", isAutoToggle = false) {
    console.log("[listStore] ========== getNextSong 开始 ==========");
    console.log("[listStore] togglePlayMethod:", togglePlayMethod, "isAutoToggle:", isAutoToggle);
    console.log("[listStore] playerListId:", state.playInfo.playerListId);
    console.log("[listStore] playerPlayIndex:", state.playInfo.playerPlayIndex);
    const tempPlayItem = this.getNextTempPlay();
    console.log("[listStore] 稍后播放列表检查:", tempPlayItem ? "有歌曲" : "无歌曲");
    if (tempPlayItem) {
      return tempPlayItem;
    }
    const currentListId = state.playInfo.playerListId;
    console.log("[listStore] 当前列表ID:", currentListId);
    if (!currentListId) {
      console.log("[listStore] 错误: 没有当前列表ID");
      return null;
    }
    const currentList = getList(currentListId);
    console.log("[listStore] 当前列表长度:", currentList == null ? void 0 : currentList.length);
    if (!currentList || !currentList.length) {
      console.log("[listStore] 错误: 当前列表为空");
      return null;
    }
    let currentIndex = state.playInfo.playerPlayIndex;
    console.log("[listStore] 当前播放索引:", currentIndex);
    if (currentIndex < 0 || currentIndex >= currentList.length) {
      console.log("[listStore] 索引越界，重置为0");
      currentIndex = 0;
    }
    let nextIndex = currentIndex;
    switch (togglePlayMethod) {
      case "random":
        nextIndex = Math.floor(Math.random() * currentList.length);
        console.log("[listStore] 随机模式，下一首索引:", nextIndex);
        break;
      case "list":
        if (currentIndex >= currentList.length - 1) {
          console.log("[listStore] 顺序播放模式，已是最后一首，返回 null");
          return null;
        }
        nextIndex = currentIndex + 1;
        console.log("[listStore] 顺序播放模式，下一首索引:", nextIndex);
        break;
      case "singleLoop":
        nextIndex = currentIndex;
        console.log("[listStore] 单曲循环模式，重复当前歌曲");
        break;
      case "listLoop":
      default:
        nextIndex = (currentIndex + 1) % currentList.length;
        console.log("[listStore] 列表循环模式，当前索引:", currentIndex, "下一首索引:", nextIndex);
        break;
    }
    if (nextIndex < 0 || nextIndex >= currentList.length) {
      console.log("[listStore] 错误: 下一首索引越界:", nextIndex);
      return null;
    }
    const nextSong = currentList[nextIndex];
    console.log("[listStore] 下一首歌曲:", nextSong == null ? void 0 : nextSong.name, "ID:", nextSong == null ? void 0 : nextSong.id);
    console.log("[listStore] ========== getNextSong 结束 ==========");
    return {
      listId: currentListId,
      musicInfo: nextSong,
      isTempPlay: false
    };
  },
  /**
   * 获取上一首歌曲
   * @param {String} togglePlayMethod 切换模式: 'listLoop', 'random', 'list', 'singleLoop'
   * @returns {Object|null} 上一首歌曲信息
   */
  getPrevSong(togglePlayMethod = "listLoop") {
    const prevPlayed = this.getPrevPlayed();
    if (prevPlayed) {
      return prevPlayed;
    }
    const currentListId = state.playInfo.playerListId;
    if (!currentListId)
      return null;
    const currentList = getList(currentListId);
    if (!currentList.length)
      return null;
    let currentIndex = state.playInfo.playerPlayIndex;
    if (currentIndex < 0 || currentIndex >= currentList.length) {
      currentIndex = 0;
    }
    let prevIndex = currentIndex;
    switch (togglePlayMethod) {
      case "random":
        prevIndex = Math.floor(Math.random() * currentList.length);
        break;
      case "singleLoop":
        prevIndex = currentIndex;
        break;
      case "list":
      case "listLoop":
      default:
        prevIndex = currentIndex <= 0 ? currentList.length - 1 : currentIndex - 1;
        break;
    }
    if (prevIndex < 0 || prevIndex >= currentList.length) {
      return null;
    }
    return {
      listId: currentListId,
      musicInfo: currentList[prevIndex],
      isTempPlay: false
    };
  },
  // ========== 持久化 ==========
  /**
   * 保存试听列表到本地存储
   */
  saveDefaultList() {
    try {
      const serializedList = state.defaultList.list.map(serializeMusicInfo);
      console.log("[listStore] 保存试听列表，数量:", serializedList.length);
      const dataStr = JSON.stringify(serializedList);
      const sizeInKB = (dataStr.length / 1024).toFixed(2);
      console.log("[listStore] 试听列表数据大小:", sizeInKB, "KB");
      if (dataStr.length > 900 * 1024) {
        console.warn("[listStore] 试听列表数据过大，可能需要清理");
      }
      const result = utils_storage.setStorage(STORAGE_PREFIX.defaultList, serializedList);
      if (!result) {
        console.error("[listStore] 保存试听列表失败");
      } else {
        console.log("[listStore] 试听列表保存成功");
      }
    } catch (error) {
      console.error("[listStore] 保存试听列表出错:", error);
    }
  },
  /**
   * 保存收藏列表到本地存储
   */
  saveLoveList() {
    try {
      const serializedList = state.loveList.list.map(serializeMusicInfo);
      console.log("[listStore] 保存收藏列表，数量:", serializedList.length);
      const dataStr = JSON.stringify(serializedList);
      const sizeInKB = (dataStr.length / 1024).toFixed(2);
      console.log("[listStore] 收藏列表数据大小:", sizeInKB, "KB");
      const result = utils_storage.setStorage(STORAGE_PREFIX.loveList, serializedList);
      if (!result) {
        console.error("[listStore] 保存收藏列表失败");
      } else {
        console.log("[listStore] 收藏列表保存成功");
      }
    } catch (error) {
      console.error("[listStore] 保存收藏列表出错:", error);
    }
  },
  /**
   * 保存播放信息到本地存储
   */
  savePlayInfo() {
    const playInfoToSave = {
      playIndex: state.playInfo.playIndex,
      playerListId: state.playInfo.playerListId,
      playerPlayIndex: state.playInfo.playerPlayIndex,
      playMusicInfo: state.playMusicInfo
    };
    utils_storage.setStorage(STORAGE_PREFIX.playInfo, playInfoToSave);
  },
  /**
   * 从本地存储恢复状态
   */
  restoreState() {
    console.log("[listStore] ========== 开始恢复状态 ==========");
    try {
      console.log("[listStore] 尝试恢复试听列表，键名:", STORAGE_PREFIX.defaultList);
      const defaultList = utils_storage.getStorage(STORAGE_PREFIX.defaultList);
      console.log("[listStore] 从存储读取的试听列表:", defaultList ? `数组长度 ${defaultList.length}` : "null");
      if (defaultList && Array.isArray(defaultList)) {
        state.defaultList.list = defaultList;
        console.log("[listStore] 试听列表恢复完成，数量:", state.defaultList.list.length);
      } else {
        console.log("[listStore] 试听列表为空或格式不正确，初始化为空数组");
        state.defaultList.list = [];
      }
      console.log("[listStore] 尝试恢复收藏列表，键名:", STORAGE_PREFIX.loveList);
      const loveList = utils_storage.getStorage(STORAGE_PREFIX.loveList);
      console.log("[listStore] 从存储读取的收藏列表:", loveList ? `数组长度 ${loveList.length}` : "null");
      if (loveList && Array.isArray(loveList)) {
        state.loveList.list = loveList;
        console.log("[listStore] 收藏列表恢复完成，数量:", state.loveList.list.length);
      } else {
        console.log("[listStore] 收藏列表为空或格式不正确，初始化为空数组");
        state.loveList.list = [];
      }
      console.log("[listStore] 尝试恢复播放信息，键名:", STORAGE_PREFIX.playInfo);
      const playInfo = utils_storage.getStorage(STORAGE_PREFIX.playInfo);
      if (playInfo) {
        console.log("[listStore] 播放信息恢复成功");
        state.playInfo.playIndex = playInfo.playIndex ?? -1;
        state.playInfo.playerListId = playInfo.playerListId ?? null;
        state.playInfo.playerPlayIndex = playInfo.playerPlayIndex ?? -1;
        if (playInfo.playMusicInfo) {
          state.playMusicInfo = playInfo.playMusicInfo;
        }
      } else {
        console.log("[listStore] 播放信息为空");
      }
      console.log("[listStore] 尝试恢复用户自定义列表，键名:", STORAGE_PREFIX.userLists);
      const userLists = utils_storage.getStorage(STORAGE_PREFIX.userLists);
      console.log("[listStore] 从存储读取的用户自定义列表:", userLists ? `数组长度 ${userLists.length}` : "null");
      if (userLists && Array.isArray(userLists)) {
        state.userLists = userLists;
        console.log("[listStore] 用户自定义列表恢复完成，数量:", state.userLists.length);
        state.userLists.forEach((l, i) => {
          var _a;
          console.log(`[listStore] restoreState - [${i}] id="${l.id}" name="${l.name}" songs=${((_a = l.list) == null ? void 0 : _a.length) || 0}`);
        });
      } else {
        console.log("[listStore] 用户自定义列表为空或格式不正确，初始化为空数组");
        state.userLists = [];
      }
    } catch (error) {
      console.error("[listStore] 恢复状态出错:", error);
    }
    console.log("[listStore] ========== 状态恢复完成 ==========");
  },
  // ========== 工具方法 ==========
  /**
   * 获取所有列表信息
   * @returns {Array}
   */
  getAllListsInfo() {
    return [
      { id: LIST_IDS.DEFAULT, name: state.defaultList.name, count: state.defaultList.list.length },
      { id: LIST_IDS.LOVE, name: state.loveList.name, count: state.loveList.list.length },
      ...state.userLists.map((l) => ({ id: l.id, name: l.name, count: l.list.length }))
    ];
  },
  /**
   * 添加歌曲到指定列表（通用方法）
   * @param {String} listId 列表ID
   * @param {Object|Array} musicInfo 歌曲信息或歌曲数组
   * @param {String} addMusicLocationType 添加位置：'top'(顶部), 'bottom'(底部)
   * @returns {Boolean} 是否添加成功
   */
  addListMusics(listId, musicInfo, addMusicLocationType = "bottom") {
    const list = Array.isArray(musicInfo) ? musicInfo : [musicInfo];
    const normalizedList = list.map(normalizeMusicInfo).filter(Boolean);
    if (normalizedList.length === 0)
      return false;
    let targetList;
    let saveMethod;
    switch (listId) {
      case LIST_IDS.DEFAULT:
        targetList = state.defaultList.list;
        saveMethod = () => this.saveDefaultList();
        break;
      case LIST_IDS.LOVE:
        targetList = state.loveList.list;
        saveMethod = () => this.saveLoveList();
        break;
      case LIST_IDS.TEMP:
        targetList = state.tempList.list;
        saveMethod = null;
        break;
      default:
        const userList = state.userLists.find((l) => l.id === listId);
        if (!userList)
          return false;
        targetList = userList.list;
        saveMethod = () => this.saveUserLists();
        break;
    }
    normalizedList.forEach((song) => {
      const existIndex = targetList.findIndex((m) => m.id === song.id);
      if (existIndex > -1) {
        targetList.splice(existIndex, 1);
      }
    });
    if (addMusicLocationType === "top") {
      targetList.unshift(...normalizedList);
    } else {
      targetList.push(...normalizedList);
    }
    if (saveMethod)
      saveMethod();
    return true;
  },
  /**
   * 从指定列表移除歌曲
   * @param {String} listId 列表ID
   * @param {String|Array} musicIds 歌曲ID或ID数组
   * @returns {Boolean} 是否移除成功
   */
  removeListMusics(listId, musicIds) {
    const ids = Array.isArray(musicIds) ? musicIds : [musicIds];
    let targetList;
    let saveMethod;
    switch (listId) {
      case LIST_IDS.DEFAULT:
        targetList = state.defaultList.list;
        saveMethod = () => this.saveDefaultList();
        break;
      case LIST_IDS.LOVE:
        targetList = state.loveList.list;
        saveMethod = () => this.saveLoveList();
        break;
      case LIST_IDS.TEMP:
        targetList = state.tempList.list;
        saveMethod = null;
        break;
      default:
        const userList = state.userLists.find((l) => l.id === listId);
        if (userList) {
          targetList = userList.list;
          saveMethod = () => this.saveUserLists();
          break;
        }
        try {
          const importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
          const playlistIndex = importedPlaylists.findIndex((p) => p.id === listId);
          if (playlistIndex > -1) {
            targetList = importedPlaylists[playlistIndex].songs || [];
            saveMethod = () => {
              common_vendor.index.setStorageSync("imported_playlists", importedPlaylists);
              console.log("[ListStore] removeListMusics 已保存导入歌单:", listId);
            };
            break;
          }
        } catch (e) {
          console.error("[ListStore] removeListMusics 读取导入歌单失败:", e);
        }
        console.warn("[ListStore] removeListMusics 未找到列表:", listId);
        return false;
    }
    ids.forEach((id) => {
      const index = targetList.findIndex((m) => m.id === id);
      if (index > -1) {
        targetList.splice(index, 1);
      }
    });
    if (saveMethod)
      saveMethod();
    return true;
  },
  /**
   * 保存用户自定义列表
   */
  saveUserLists() {
    try {
      const userListsData = state.userLists.map((l) => ({
        id: l.id,
        name: l.name,
        coverImgUrl: l.coverImgUrl || "",
        list: l.list.map(serializeMusicInfo)
      }));
      console.log("[listStore] saveUserLists - 列表数量:", userListsData.length);
      console.log("[listStore] saveUserLists - 存储键名:", STORAGE_PREFIX.userLists);
      userListsData.forEach((l, i) => {
        console.log(`[listStore] saveUserLists - [${i}] id="${l.id}" name="${l.name}" songs=${l.list.length}`);
      });
      const result = utils_storage.setStorage(STORAGE_PREFIX.userLists, userListsData);
      console.log("[listStore] saveUserLists - 保存结果:", result);
      const verifyData = utils_storage.getStorage(STORAGE_PREFIX.userLists);
      console.log("[listStore] saveUserLists - 验证读取:", verifyData ? `数量=${verifyData.length}` : "null");
    } catch (error) {
      console.error("[listStore] 保存用户列表出错:", error);
    }
  },
  /**
   * 创建用户自定义列表
   * @param {String} name 列表名称
   * @returns {Object|null} 创建的列表信息
   */
  createUserList(name) {
    const id = `userlist_${Date.now()}`;
    const newList = {
      id,
      name,
      coverImgUrl: "",
      list: []
    };
    state.userLists.push(newList);
    this.saveUserLists();
    return newList;
  },
  /**
   * 更新用户自定义列表信息
   * @param {Array} listInfos 列表信息数组 [{ id, name, coverImgUrl }]
   */
  updateUserList(listInfos) {
    console.log("[listStore] updateUserList - 开始更新，列表数量:", listInfos.length);
    for (const info of listInfos) {
      const index = state.userLists.findIndex((l) => l.id === info.id);
      if (index > -1) {
        console.log(`[listStore] updateUserList - 找到列表 "${state.userLists[index].name}"，更新为 "${info.name}"`);
        state.userLists[index] = {
          ...state.userLists[index],
          name: info.name,
          coverImgUrl: info.coverImgUrl || state.userLists[index].coverImgUrl
        };
      } else {
        console.warn(`[listStore] updateUserList - 未找到列表:`, info.id);
      }
    }
    this.saveUserLists();
    console.log("[listStore] updateUserList - 更新完成");
  },
  /**
   * 移除用户自定义列表
   * @param {Array} ids 要移除的列表ID数组
   */
  removeUserList(ids) {
    console.log("[listStore] removeUserList - 开始移除，ID数量:", ids.length);
    const removedIds = [];
    for (const id of ids) {
      const index = state.userLists.findIndex((l) => l.id === id);
      if (index > -1) {
        const removedName = state.userLists[index].name;
        state.userLists.splice(index, 1);
        removedIds.push(id);
        console.log(`[listStore] removeUserList - 已移除列表: "${removedName}" (${id})`);
      } else {
        console.warn(`[listStore] removeUserList - 未找到列表:`, id);
      }
    }
    this.saveUserLists();
    console.log("[listStore] removeUserList - 移除完成，共移除:", removedIds.length);
    return removedIds;
  },
  /**
   * 获取所有可用列表（用于添加到歌单）
   * @returns {Array}
   */
  getAllAvailableLists() {
    let importedPlaylists = [];
    try {
      importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
    } catch (e) {
      console.error("[listStore] 获取歌单列表失败:", e);
    }
    return [
      { id: LIST_IDS.LOVE, name: state.loveList.name, type: "love" },
      ...state.userLists.map((l) => ({ id: l.id, name: l.name, type: "user" })),
      ...importedPlaylists.map((l) => ({ id: l.id, name: l.name, type: "imported" }))
    ];
  },
  /**
   * 添加歌曲到指定列表（支持所有列表类型）
   * @param {String} listId 列表ID
   * @param {Object} musicInfo 歌曲信息
   * @param {String} addMusicLocationType 添加位置
   * @returns {Boolean}
   */
  addMusicToAnyList(listId, musicInfo, addMusicLocationType = "top") {
    if (listId === LIST_IDS.DEFAULT || listId === LIST_IDS.LOVE) {
      return this.addListMusics(listId, musicInfo, addMusicLocationType);
    }
    const userList = state.userLists.find((l) => l.id === listId);
    if (userList) {
      return this.addListMusics(listId, musicInfo, addMusicLocationType);
    }
    try {
      const importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
      const playlist = importedPlaylists.find((p) => p.id === listId);
      if (playlist) {
        const normalizedSong = Array.isArray(musicInfo) ? musicInfo : [musicInfo];
        normalizedSong.forEach((song) => {
          const existIndex = playlist.songs.findIndex((m) => m.id === song.id);
          if (existIndex > -1) {
            playlist.songs.splice(existIndex, 1);
          }
        });
        if (addMusicLocationType === "top") {
          playlist.songs.unshift(...normalizedSong);
        } else {
          playlist.songs.push(...normalizedSong);
        }
        playlist.trackCount = playlist.songs.length;
        common_vendor.index.setStorageSync("imported_playlists", importedPlaylists);
        return true;
      }
    } catch (e) {
      console.error("[listStore] 添加到导入歌单失败:", e);
    }
    return false;
  },
  /**
   * 获取列表歌曲数量（支持所有列表类型）
   * @param {String} listId 列表ID
   * @returns {Number}
   */
  getListCount(listId) {
    var _a;
    if (listId === LIST_IDS.DEFAULT) {
      return state.defaultList.list.length;
    }
    if (listId === LIST_IDS.LOVE) {
      return state.loveList.list.length;
    }
    if (listId === LIST_IDS.TEMP) {
      return state.tempList.list.length;
    }
    const userList = state.userLists.find((l) => l.id === listId);
    if (userList) {
      return userList.list.length;
    }
    try {
      const importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
      const playlist = importedPlaylists.find((p) => p.id === listId);
      return playlist ? ((_a = playlist.songs) == null ? void 0 : _a.length) || 0 : 0;
    } catch (e) {
      return 0;
    }
  },
  /**
   * 检查歌曲是否在指定列表中
   * @param {String} listId 列表ID
   * @param {String} musicId 歌曲ID
   * @returns {Boolean}
   */
  checkSongInList(listId, musicId) {
    var _a;
    if (listId === LIST_IDS.DEFAULT) {
      return state.defaultList.list.some((m) => m.id === musicId);
    }
    if (listId === LIST_IDS.LOVE) {
      return state.loveList.list.some((m) => m.id === musicId);
    }
    if (listId === LIST_IDS.TEMP) {
      return state.tempList.list.some((m) => m.id === musicId);
    }
    const userList = state.userLists.find((l) => l.id === listId);
    if (userList) {
      return userList.list.some((m) => m.id === musicId);
    }
    try {
      const importedPlaylists = common_vendor.index.getStorageSync("imported_playlists") || [];
      const playlist = importedPlaylists.find((p) => p.id === listId);
      return playlist ? (_a = playlist.songs) == null ? void 0 : _a.some((m) => m.id === musicId) : false;
    } catch (e) {
      return false;
    }
  }
};
exports.LIST_IDS = LIST_IDS;
exports.PLAY_MODE = PLAY_MODE;
exports.PLAY_MODE_LIST = PLAY_MODE_LIST;
exports.listStore = listStore;
