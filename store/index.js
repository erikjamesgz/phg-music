"use strict";
const store_modules_user = require("./modules/user.js");
const store_modules_playlist = require("./modules/playlist.js");
const store_modules_player = require("./modules/player.js");
const store_modules_system = require("./modules/system.js");
const store_modules_list = require("./modules/list.js");
const store_modules_comment = require("./modules/comment.js");
async function initializeStores() {
  console.log("开始初始化stores...");
  try {
    console.log("开始恢复用户状态...");
    store_modules_user.userStore.restoreState();
    console.log("开始恢复播放列表状态...");
    store_modules_playlist.playlistStore.restoreState();
    console.log("开始恢复列表管理状态...");
    store_modules_list.listStore.restoreState();
    console.log("开始恢复播放器状态...");
    store_modules_player.playerStore.restoreState();
    console.log("开始恢复系统状态...");
    store_modules_system.systemStore.restoreState();
    console.log("开始初始化评论状态...");
    store_modules_comment.commentStore.initDanmaku();
    console.log("状态恢复完成");
    console.log("所有stores初始化完成");
    return {
      userStore: store_modules_user.userStore,
      playlistStore: store_modules_playlist.playlistStore,
      playerStore: store_modules_player.playerStore,
      systemStore: store_modules_system.systemStore,
      listStore: store_modules_list.listStore,
      commentStore: store_modules_comment.commentStore
    };
  } catch (error) {
    console.error("初始化stores失败:", error);
    throw error;
  }
}
exports.initializeStores = initializeStores;
