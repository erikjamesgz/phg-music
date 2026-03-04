"use strict";
const common_vendor = require("../../common/vendor.js");
require("./list.js");
const state = {
  // 推荐歌单列表
  recommendPlaylists: [],
  // 用户创建的歌单列表
  userPlaylists: [],
  // 用户收藏的歌单列表
  favoritePlaylists: [],
  // 当前查看的歌单详情
  currentPlaylist: null,
  // 歌单加载状态
  loading: false,
  // 歌单加载错误信息
  error: null
};
const playlistStore = {
  // 获取状态
  getState() {
    return state;
  },
  // 设置状态
  setState(newState) {
    Object.assign(state, newState);
  },
  // 安全解析JSON，处理可能已是对象的情况
  safeParse(data, defaultValue = []) {
    if (!data)
      return defaultValue;
    if (typeof data === "string") {
      try {
        return JSON.parse(data) || defaultValue;
      } catch (e) {
        console.error("[playlistStore] JSON parse error:", e);
        return defaultValue;
      }
    }
    if (Array.isArray(data))
      return data;
    if (typeof data === "object")
      return data;
    return defaultValue;
  },
  // 获取所有歌曲总数（排除试听列表和临时列表）
  getAllSongCount() {
    let totalCount = 0;
    try {
      const userLists = this.safeParse(common_vendor.index.getStorageSync("@user_lists"), []);
      const loveList = this.safeParse(common_vendor.index.getStorageSync("@list_love"), []);
      const importedPlaylists = this.safeParse(common_vendor.index.getStorageSync("imported_playlists"), []);
      if (Array.isArray(loveList)) {
        totalCount += loveList.length;
      }
      if (Array.isArray(userLists)) {
        for (const list of userLists) {
          if (list && list.list && Array.isArray(list.list)) {
            totalCount += list.list.length;
          }
        }
      }
      if (Array.isArray(importedPlaylists)) {
        for (const playlist of importedPlaylists) {
          if (playlist && playlist.songs && Array.isArray(playlist.songs)) {
            totalCount += playlist.songs.length;
          }
        }
      }
      console.log("[playlistStore] getAllSongCount result:", {
        loveListCount: Array.isArray(loveList) ? loveList.length : 0,
        userListsCount: Array.isArray(userLists) ? userLists.length : 0,
        importedPlaylistsCount: Array.isArray(importedPlaylists) ? importedPlaylists.length : 0,
        totalCount
      });
    } catch (e) {
      console.error("[playlistStore] getAllSongCount error:", e);
    }
    return totalCount;
  },
  // 获取所有歌单列表
  get allPlaylists() {
    return [
      ...state.userPlaylists,
      ...state.favoritePlaylists
    ];
  },
  // 获取当前歌单中的歌曲数量
  get currentPlaylistSongCount() {
    return state.currentPlaylist ? state.currentPlaylist.songs.length : 0;
  },
  // 获取推荐歌单
  async fetchRecommendPlaylists() {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      state.recommendPlaylists = [
        {
          id: "rec1",
          name: "流行热歌",
          coverUrl: "/static/images/playlist_cover1.png",
          description: "最热门的流行歌曲集合",
          creator: { id: "official", name: "拼好歌官方" },
          playCount: 125e4,
          songCount: 50,
          createTime: "2023-01-01"
        },
        {
          id: "rec2",
          name: "轻音乐放松",
          coverUrl: "/static/images/playlist_cover2.png",
          description: "舒缓的轻音乐，让你放松身心",
          creator: { id: "official", name: "拼好歌官方" },
          playCount: 98e4,
          songCount: 40,
          createTime: "2023-01-15"
        },
        {
          id: "rec3",
          name: "经典老歌",
          coverUrl: "/static/images/playlist_cover3.png",
          description: "永不过时的经典歌曲",
          creator: { id: "official", name: "拼好歌官方" },
          playCount: 156e4,
          songCount: 60,
          createTime: "2023-02-01"
        },
        {
          id: "rec4",
          name: "电音派对",
          coverUrl: "/static/images/playlist_cover4.png",
          description: "动感电音，点燃你的激情",
          creator: { id: "official", name: "拼好歌官方" },
          playCount: 89e4,
          songCount: 45,
          createTime: "2023-02-15"
        },
        {
          id: "rec5",
          name: "民谣精选",
          coverUrl: "/static/images/playlist_cover5.png",
          description: "治愈系民谣，温暖你的心灵",
          creator: { id: "official", name: "拼好歌官方" },
          playCount: 76e4,
          songCount: 35,
          createTime: "2023-03-01"
        },
        {
          id: "rec6",
          name: "摇滚经典",
          coverUrl: "/static/images/playlist_cover6.png",
          description: "经典摇滚，燃爆你的耳朵",
          creator: { id: "official", name: "拼好歌官方" },
          playCount: 65e4,
          songCount: 30,
          createTime: "2023-03-15"
        }
      ];
    } catch (err) {
      state.error = err.message || "获取推荐歌单失败";
      console.error("获取推荐歌单失败:", err);
    } finally {
      state.loading = false;
    }
  },
  // 获取用户创建的歌单
  async fetchUserPlaylists() {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      state.userPlaylists = [
        {
          id: "user1",
          name: "我喜欢的音乐",
          coverUrl: "/static/images/playlist_cover_like.png",
          description: "我收藏的所有喜欢的歌曲",
          creator: { id: "1", name: "青釉用户" },
          playCount: 120,
          songCount: 25,
          createTime: "2023-04-01",
          isDefault: true
        },
        {
          id: "user2",
          name: "我的私人歌单",
          coverUrl: "/static/images/playlist_cover_private.png",
          description: "私人定制的歌曲集合",
          creator: { id: "1", name: "青釉用户" },
          playCount: 85,
          songCount: 18,
          createTime: "2023-04-15",
          isDefault: false
        }
      ];
    } catch (err) {
      state.error = err.message || "获取用户歌单失败";
      console.error("获取用户歌单失败:", err);
    } finally {
      state.loading = false;
    }
  },
  // 获取用户收藏的歌单
  async fetchFavoritePlaylists() {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      state.favoritePlaylists = [
        {
          id: "fav1",
          name: "热门华语",
          coverUrl: "/static/images/playlist_cover_chinese.png",
          description: "最热门的华语歌曲集合",
          creator: { id: "other1", name: "音乐达人" },
          playCount: 45e4,
          songCount: 42,
          createTime: "2023-03-10"
        },
        {
          id: "fav2",
          name: "欧美经典",
          coverUrl: "/static/images/playlist_cover_western.png",
          description: "经典欧美歌曲精选",
          creator: { id: "other2", name: "音乐收藏家" },
          playCount: 38e4,
          songCount: 38,
          createTime: "2023-03-20"
        }
      ];
    } catch (err) {
      state.error = err.message || "获取收藏歌单失败";
      console.error("获取收藏歌单失败:", err);
    } finally {
      state.loading = false;
    }
  },
  // 获取歌单详情
  async fetchPlaylistDetail(id) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      let playlist = null;
      const allPlaylists = [
        ...state.recommendPlaylists,
        ...state.userPlaylists,
        ...state.favoritePlaylists
      ];
      playlist = allPlaylists.find((p) => p.id === id);
      if (!playlist) {
        throw new Error("歌单不存在");
      }
      state.currentPlaylist = {
        ...playlist,
        songs: [
          {
            id: "s1",
            name: "青釉之梦",
            artist: "青釉乐队",
            album: "青釉",
            duration: 240,
            // 秒
            coverUrl: "/static/images/song_cover1.png"
          },
          {
            id: "s2",
            name: "流动的旋律",
            artist: "陶音",
            album: "陶音集",
            duration: 210,
            coverUrl: "/static/images/song_cover2.png"
          },
          {
            id: "s3",
            name: "釉色天空",
            artist: "青釉乐队",
            album: "青釉",
            duration: 180,
            coverUrl: "/static/images/song_cover3.png"
          },
          {
            id: "s4",
            name: "陶艺人生",
            artist: "陶音",
            album: "陶音集",
            duration: 195,
            coverUrl: "/static/images/song_cover4.png"
          },
          {
            id: "s5",
            name: "青色记忆",
            artist: "青釉乐队",
            album: "青釉",
            duration: 225,
            coverUrl: "/static/images/song_cover5.png"
          }
        ]
      };
    } catch (err) {
      state.error = err.message || "获取歌单详情失败";
      console.error("获取歌单详情失败:", err);
    } finally {
      state.loading = false;
    }
  },
  // 创建新歌单
  async createPlaylist(playlistData) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const id = "user" + Date.now();
      const newPlaylist = {
        id,
        name: playlistData.name,
        coverUrl: playlistData.coverUrl || "/static/images/playlist_cover_default.png",
        description: playlistData.description || "",
        creator: { id: "1", name: "青釉用户" },
        playCount: 0,
        songCount: 0,
        createTime: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        isDefault: false,
        songs: []
      };
      state.userPlaylists.push(newPlaylist);
      this.saveState();
      return newPlaylist;
    } catch (err) {
      state.error = err.message || "创建歌单失败";
      console.error("创建歌单失败:", err);
      throw err;
    } finally {
      state.loading = false;
    }
  },
  // 更新歌单信息
  async updatePlaylist(id, playlistData) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const index = state.userPlaylists.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error("歌单不存在或无权限修改");
      }
      state.userPlaylists[index] = {
        ...state.userPlaylists[index],
        name: playlistData.name || state.userPlaylists[index].name,
        coverUrl: playlistData.coverUrl || state.userPlaylists[index].coverUrl,
        description: playlistData.description !== void 0 ? playlistData.description : state.userPlaylists[index].description
      };
      if (state.currentPlaylist && state.currentPlaylist.id === id) {
        state.currentPlaylist = {
          ...state.currentPlaylist,
          name: playlistData.name || state.currentPlaylist.name,
          coverUrl: playlistData.coverUrl || state.currentPlaylist.coverUrl,
          description: playlistData.description !== void 0 ? playlistData.description : state.currentPlaylist.description
        };
      }
      this.saveState();
      return state.userPlaylists[index];
    } catch (err) {
      state.error = err.message || "更新歌单失败";
      console.error("更新歌单失败:", err);
      throw err;
    } finally {
      state.loading = false;
    }
  },
  // 删除歌单
  async deletePlaylist(id) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const index = state.userPlaylists.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error("歌单不存在或无权限删除");
      }
      if (state.userPlaylists[index].isDefault) {
        throw new Error("默认歌单不能删除");
      }
      state.userPlaylists.splice(index, 1);
      if (state.currentPlaylist && state.currentPlaylist.id === id) {
        state.currentPlaylist = null;
      }
      this.saveState();
      return true;
    } catch (err) {
      state.error = err.message || "删除歌单失败";
      console.error("删除歌单失败:", err);
      throw err;
    } finally {
      state.loading = false;
    }
  },
  // 收藏/取消收藏歌单
  async toggleFavoritePlaylist(id) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const index = state.favoritePlaylists.findIndex((p) => p.id === id);
      const playlist = state.recommendPlaylists.find((p) => p.id === id);
      if (!playlist) {
        throw new Error("歌单不存在");
      }
      if (index === -1) {
        state.favoritePlaylists.push(playlist);
        this.saveState();
        return { isFavorite: true };
      } else {
        state.favoritePlaylists.splice(index, 1);
        this.saveState();
        return { isFavorite: false };
      }
    } catch (err) {
      state.error = err.message || "操作歌单收藏失败";
      console.error("操作歌单收藏失败:", err);
      throw err;
    } finally {
      state.loading = false;
    }
  },
  // 添加歌曲到歌单
  async addSongToPlaylist(playlistId, song) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const playlist = state.userPlaylists.find((p) => p.id === playlistId);
      if (!playlist) {
        throw new Error("歌单不存在或无权限修改");
      }
      if (!playlist.songs) {
        playlist.songs = [];
      }
      const songExists = playlist.songs.some((s) => s.id === song.id);
      if (songExists) {
        return { message: "歌曲已存在于歌单中" };
      }
      playlist.songs.push(song);
      playlist.songCount = playlist.songs.length;
      if (state.currentPlaylist && state.currentPlaylist.id === playlistId) {
        if (!state.currentPlaylist.songs) {
          state.currentPlaylist.songs = [];
        }
        state.currentPlaylist.songs.push(song);
        state.currentPlaylist.songCount = state.currentPlaylist.songs.length;
      }
      this.saveState();
      return { message: "已添加到歌单" };
    } catch (err) {
      state.error = err.message || "添加歌曲到歌单失败";
      console.error("添加歌曲到歌单失败:", err);
      throw err;
    } finally {
      state.loading = false;
    }
  },
  // 从歌单中移除歌曲
  async removeSongFromPlaylist(playlistId, songId) {
    state.loading = true;
    state.error = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const playlist = state.userPlaylists.find((p) => p.id === playlistId);
      if (!playlist || !playlist.songs) {
        throw new Error("歌单不存在或无权限修改");
      }
      const songIndex = playlist.songs.findIndex((s) => s.id === songId);
      if (songIndex === -1) {
        return { message: "歌曲不在歌单中" };
      }
      playlist.songs.splice(songIndex, 1);
      playlist.songCount = playlist.songs.length;
      if (state.currentPlaylist && state.currentPlaylist.id === playlistId) {
        const currentSongIndex = state.currentPlaylist.songs.findIndex((s) => s.id === songId);
        if (currentSongIndex !== -1) {
          state.currentPlaylist.songs.splice(currentSongIndex, 1);
          state.currentPlaylist.songCount = state.currentPlaylist.songs.length;
        }
      }
      this.saveState();
      return { message: "已从歌单中移除" };
    } catch (err) {
      state.error = err.message || "从歌单中移除歌曲失败";
      console.error("从歌单中移除歌曲失败:", err);
      throw err;
    } finally {
      state.loading = false;
    }
  },
  // 从本地存储恢复状态
  restoreState() {
    const userPlaylists = common_vendor.index.getStorageSync("userPlaylists");
    if (userPlaylists) {
      state.userPlaylists = userPlaylists;
    }
    const favoritePlaylists = common_vendor.index.getStorageSync("favoritePlaylists");
    if (favoritePlaylists) {
      state.favoritePlaylists = favoritePlaylists;
    }
  },
  // 保存状态到本地存储
  saveState() {
    common_vendor.index.setStorageSync("userPlaylists", state.userPlaylists);
    common_vendor.index.setStorageSync("favoritePlaylists", state.favoritePlaylists);
  }
};
exports.playlistStore = playlistStore;
