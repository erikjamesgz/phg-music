"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_musicSourceStorage = require("../../utils/musicSourceStorage.js");
const utils_system = require("../../utils/system.js");
const utils_config = require("../../utils/config.js");
require("../../store/modules/list.js");
require("../../store/modules/player.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "../../uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  _easycom_roc_icon_plus();
}
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const currentTime = common_vendor.ref("9:41");
    const currentSourceId = common_vendor.ref(null);
    const isDarkMode = common_vendor.ref(false);
    const checkDarkMode = () => {
      const followSystem = common_vendor.index.getStorageSync("followSystem");
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      const darkMode = common_vendor.index.getStorageSync("darkMode") === "true";
      if (isFollowSystem) {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        if (systemInfo.theme) {
          isDarkMode.value = systemInfo.theme === "dark";
        } else {
          isDarkMode.value = darkMode;
        }
      } else {
        isDarkMode.value = darkMode;
      }
      console.log("[music-sources] checkDarkMode:", isDarkMode.value, "isFollowSystem:", isFollowSystem);
    };
    const handleThemeChange = (data) => {
      console.log("[music-sources] 收到主题变化事件:", data);
      if (data && typeof data.isDark === "boolean") {
        isDarkMode.value = data.isDark;
      }
    };
    const handleSystemThemeChange = (data) => {
      console.log("[music-sources] 收到系统主题变化事件:", data);
      const followSystem = common_vendor.index.getStorageSync("followSystem");
      const isFollowSystem = followSystem !== "false" && followSystem !== false;
      if (isFollowSystem && data && typeof data.isDark === "boolean") {
        isDarkMode.value = data.isDark;
        console.log("[music-sources] handleSystemThemeChange - isFollowSystem:", isFollowSystem, "isDarkMode:", isDarkMode.value);
      }
    };
    const statusBarHeight = common_vendor.ref(utils_system.getStatusBarHeight());
    const statusBarStyle = common_vendor.computed(() => ({
      height: `${statusBarHeight.value}px`,
      width: "100%",
      backgroundColor: "transparent"
    }));
    const showOnlineImport = common_vendor.ref(false);
    const sources = common_vendor.ref([]);
    const isLoading = common_vendor.ref(true);
    const activities = common_vendor.ref([]);
    const initDefaultSources = () => {
      const hasInitialized = common_vendor.index.getStorageSync("music_sources_initialized");
      if (!hasInitialized) {
        common_vendor.index.setStorageSync("music_sources_initialized", true);
      }
    };
    const startClock = () => {
      const updateTime = () => {
        const now = /* @__PURE__ */ new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        currentTime.value = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
      };
      updateTime();
      setInterval(updateTime, 6e4);
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const fetchMusicSources = () => {
      isLoading.value = true;
      const serverUrl = utils_config.getServerUrl();
      common_vendor.index.request({
        url: `${serverUrl}/api/scripts/loaded`,
        method: "GET",
        success: (res) => {
          if (res.data && res.data.code === 200) {
            const apiSources = res.data.data || [];
            console.log("[音源管理] 获取音源列表成功:", apiSources);
            sources.value = apiSources.map((source) => ({
              id: source.id,
              name: source.name,
              version: source.version || "1.0.0",
              developer: source.author || "未知开发者",
              updateDate: source.updateTime || (/* @__PURE__ */ new Date()).toLocaleDateString(),
              createdAt: source.createdAt || "",
              description: source.description || "远程音源",
              isDefault: source.isDefault || false,
              selected: source.isDefault || false,
              successRate: source.successRate || 0,
              isCircuitBroken: source.isCircuitBroken || false,
              totalRequests: source.totalRequests || 0,
              failCount: source.failCount || 0
            }));
            utils_musicSourceStorage.saveMusicSources(sources.value);
          } else {
            console.error("[音源管理] 获取音源列表失败:", res.data);
            sources.value = utils_musicSourceStorage.getMusicSources();
          }
          isLoading.value = false;
        },
        fail: (err) => {
          console.error("[音源管理] 获取音源列表请求失败:", err);
          sources.value = utils_musicSourceStorage.getMusicSources();
          isLoading.value = false;
        }
      });
    };
    const selectSource = async (sourceId) => {
      const serverUrl = utils_config.getServerUrl();
      common_vendor.index.showLoading({
        title: "设置中...",
        mask: true
      });
      try {
        const response = await common_vendor.index.request({
          url: `${serverUrl}/api/scripts/default`,
          method: "POST",
          header: {
            "Content-Type": "application/json"
          },
          data: {
            id: sourceId
          }
        });
        common_vendor.index.hideLoading();
        const result = response.data;
        if (result.code === 200 && result.data && result.data.success) {
          const selectedSource = sources.value.find((source) => source.id === sourceId);
          const sourceName = selectedSource ? selectedSource.name : "未知音源";
          sources.value = sources.value.map((source) => ({
            ...source,
            selected: source.id === sourceId,
            isDefault: source.id === sourceId
          }));
          utils_musicSourceStorage.saveMusicSources(sources.value);
          const activity = {
            type: "update",
            text: `设置默认音源 ${sourceName}`,
            textHtml: `设置默认音源 <strong>${sourceName}</strong>`,
            time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
          };
          activities.value.unshift(activity);
          utils_musicSourceStorage.addActivity(activity);
          common_vendor.index.showToast({
            title: "设置成功",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: result.msg || "设置失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        console.error("[音源管理] 设置默认音源失败:", error);
        common_vendor.index.showToast({
          title: "设置失败，请检查网络",
          icon: "none"
        });
      }
    };
    const openSourceActions = (source) => {
      currentSourceId.value = source.id;
      common_vendor.index.showActionSheet({
        itemList: ["删除音源"],
        itemColor: "#ff4d4f",
        success: (res) => {
          if (res.tapIndex === 0) {
            deleteSource(source);
          }
        }
      });
    };
    const deleteSource = async (source) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除音源"${source.name}"吗？`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          if (res.confirm) {
            const sourceName = `${source.name} ${source.version}`;
            common_vendor.index.showLoading({
              title: "删除中...",
              mask: true
            });
            try {
              const response = await common_vendor.index.request({
                url: `${utils_config.getServerUrl()}/api/scripts/delete`,
                method: "POST",
                header: {
                  "Content-Type": "application/json"
                },
                data: {
                  id: source.id
                }
              });
              common_vendor.index.hideLoading();
              const result = response.data;
              if (result.code === 200 && result.data && result.data.success) {
                if (result.data.scripts) {
                  sources.value = result.data.scripts.map((s) => ({
                    id: s.id,
                    name: s.name,
                    type: s.isDefault ? "official" : "custom",
                    version: s.version || "1.0.0",
                    developer: s.author || "未知开发者",
                    updateDate: s.createdAt || (/* @__PURE__ */ new Date()).toLocaleDateString(),
                    description: s.description || "远程音源",
                    updateNotify: true,
                    selected: s.isDefault
                  }));
                  utils_musicSourceStorage.saveMusicSources(sources.value);
                }
                const activity = {
                  type: "delete",
                  text: `删除音源 ${sourceName}`,
                  textHtml: `删除音源 <strong>${sourceName}</strong>`,
                  time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
                };
                activities.value.unshift(activity);
                utils_musicSourceStorage.addActivity(activity);
                common_vendor.index.showToast({
                  title: result.msg || "删除成功",
                  icon: "success"
                });
              } else {
                common_vendor.index.showToast({
                  title: result.msg || "删除失败",
                  icon: "none"
                });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              console.error("删除音源失败:", error);
              common_vendor.index.showToast({
                title: "删除失败，请检查网络",
                icon: "none"
              });
            }
          }
        }
      });
    };
    const importUrl = common_vendor.ref("");
    const urlValid = common_vendor.ref(true);
    const urlError = common_vendor.ref("");
    const importing = common_vendor.ref(false);
    const importOnline = () => {
      importUrl.value = "";
      urlValid.value = true;
      urlError.value = "";
      importing.value = false;
      showOnlineImport.value = true;
    };
    const importLocal = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "此功能暂不支持",
        showCancel: false,
        confirmText: "确定"
      });
    };
    const getActivityIcon = (type) => {
      const iconMap = {
        "add": "plus",
        "update": "sync",
        "edit": "edit",
        "delete": "trash-alt",
        "share": "share-alt"
      };
      return iconMap[type] || "circle";
    };
    const closeOnlineImportPopup = () => {
      showOnlineImport.value = false;
    };
    const startImport = async () => {
      if (!importUrl.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入音源URL",
          icon: "none"
        });
        return;
      }
      importing.value = true;
      try {
        const response = await common_vendor.index.request({
          url: `${utils_config.getServerUrl()}/api/scripts/import/url`,
          method: "POST",
          header: {
            "Content-Type": "application/json"
          },
          data: {
            url: importUrl.value.trim()
          }
        });
        const result = response.data;
        if (result.code === 200 && result.data && result.data.success) {
          if (result.data.scripts) {
            sources.value = result.data.scripts.map((s) => ({
              id: s.id,
              name: s.name,
              type: s.isDefault ? "official" : "custom",
              version: s.version || "1.0.0",
              developer: s.author || "未知开发者",
              updateDate: s.createdAt || (/* @__PURE__ */ new Date()).toLocaleDateString(),
              description: s.description || "远程音源",
              updateNotify: true,
              selected: s.isDefault
            }));
            utils_musicSourceStorage.saveMusicSources(sources.value);
          }
          const activity = {
            type: "add",
            text: `导入音源成功`,
            textHtml: `导入音源 <strong>成功</strong>`,
            time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
          };
          activities.value.unshift(activity);
          utils_musicSourceStorage.addActivity(activity);
          common_vendor.index.showToast({
            title: result.msg || "导入成功",
            icon: "success"
          });
          closeOnlineImportPopup();
        } else {
          common_vendor.index.showToast({
            title: result.msg || "导入失败",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("导入音源失败:", error);
        common_vendor.index.showModal({
          title: "导入失败",
          content: error.message || "网络错误，请检查网络连接",
          showCancel: false,
          confirmText: "确定"
        });
      } finally {
        importing.value = false;
      }
    };
    common_vendor.onMounted(() => {
      startClock();
      checkDarkMode();
      common_vendor.index.$on("themeChanged", handleThemeChange);
      common_vendor.index.$on("systemThemeChange", handleSystemThemeChange);
      fetchMusicSources();
      activities.value = utils_musicSourceStorage.getActivities();
      initDefaultSources();
      utils_system.setStatusBarTextColor("black");
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("themeChanged", handleThemeChange);
      common_vendor.index.$off("systemThemeChange", handleSystemThemeChange);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.s(statusBarStyle.value),
        b: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "20",
          color: "#4b5563"
        }),
        c: common_vendor.o(goBack, "4d"),
        d: isLoading.value
      }, isLoading.value ? {
        e: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "24",
          color: "#00d7cd"
        })
      } : sources.value.length === 0 ? {
        g: common_vendor.p({
          type: "fas",
          name: "music",
          size: "48",
          color: "#00d7cd"
        })
      } : {
        h: common_vendor.f(sources.value, (source, index, i0) => {
          return common_vendor.e({
            a: "06660d5b-3-" + i0,
            b: common_vendor.t(source.name),
            c: common_vendor.t(source.version),
            d: source.isCircuitBroken
          }, source.isCircuitBroken ? {} : {}, {
            e: "06660d5b-4-" + i0,
            f: common_vendor.t(source.developer || "未知"),
            g: "06660d5b-5-" + i0,
            h: common_vendor.t(source.createdAt || source.updateDate),
            i: source.description
          }, source.description ? {
            j: "06660d5b-6-" + i0,
            k: common_vendor.p({
              type: "fas",
              name: "comment-alt",
              size: "12",
              color: "#999"
            }),
            l: common_vendor.t(source.description)
          } : {}, {
            m: "06660d5b-7-" + i0,
            n: common_vendor.p({
              type: "fas",
              name: "chart-line",
              size: "12",
              color: source.successRate >= 80 ? "#10b981" : source.successRate >= 50 ? "#f59e0b" : "#ef4444"
            }),
            o: common_vendor.t((source.successRate * 100).toFixed(2)),
            p: "06660d5b-8-" + i0,
            q: common_vendor.t(source.totalRequests),
            r: common_vendor.t(source.failCount),
            s: source.isCircuitBroken
          }, source.isCircuitBroken ? {} : {}, {
            t: source.selected
          }, source.selected ? {
            v: "06660d5b-9-" + i0,
            w: common_vendor.p({
              type: "fas",
              name: "check-circle",
              size: "18",
              color: "#6dc380"
            })
          } : {}, {
            x: common_vendor.o(($event) => openSourceActions(source), source.id),
            y: source.id,
            z: source.selected ? 1 : "",
            A: common_vendor.o(($event) => selectSource(source.id), source.id)
          });
        }),
        i: common_vendor.p({
          type: "fas",
          name: "music",
          size: "20",
          color: "#00d7cd"
        }),
        j: common_vendor.p({
          type: "fas",
          name: "user",
          size: "12",
          color: "#999"
        }),
        k: common_vendor.p({
          type: "fas",
          name: "calendar-alt",
          size: "12",
          color: "#999"
        }),
        l: common_vendor.p({
          type: "fas",
          name: "exchange-alt",
          size: "12",
          color: "#999"
        })
      }, {
        f: sources.value.length === 0,
        m: common_vendor.p({
          type: "fas",
          name: "cloud-download-alt",
          size: "20",
          color: "#0084ff"
        }),
        n: common_vendor.o(importOnline, "68"),
        o: common_vendor.p({
          type: "fas",
          name: "file-import",
          size: "20",
          color: "#00d7cd"
        }),
        p: common_vendor.o(importLocal, "ad"),
        q: activities.value.length === 0
      }, activities.value.length === 0 ? {
        r: common_vendor.p({
          type: "fas",
          name: "history",
          size: "48",
          color: "#7b68ee"
        })
      } : {
        s: common_vendor.f(activities.value, (activity, index, i0) => {
          return {
            a: "06660d5b-13-" + i0,
            b: common_vendor.p({
              type: "fas",
              name: getActivityIcon(activity.type),
              size: "14"
            }),
            c: common_vendor.n(activity.type),
            d: activity.textHtml,
            e: common_vendor.t(activity.time),
            f: index
          };
        })
      }, {
        t: showOnlineImport.value
      }, showOnlineImport.value ? common_vendor.e({
        v: common_vendor.p({
          type: "fas",
          name: "times",
          size: "20",
          color: "#999"
        }),
        w: common_vendor.o(closeOnlineImportPopup, "5b"),
        x: importing.value,
        y: importUrl.value,
        z: common_vendor.o(($event) => importUrl.value = $event.detail.value, "e5"),
        A: common_vendor.o(closeOnlineImportPopup, "e9"),
        B: importing.value ? 1 : "",
        C: importing.value
      }, importing.value ? {
        D: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "16",
          color: "#fff"
        })
      } : {}, {
        E: common_vendor.o(startImport, "e7"),
        F: importing.value || !importUrl.value.trim() ? 1 : "",
        G: common_vendor.o(() => {
        }, "af"),
        H: common_vendor.o(closeOnlineImportPopup, "fe")
      }) : {}, {
        I: isDarkMode.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-06660d5b"]]);
wx.createPage(MiniProgramPage);
