"use strict";
const common_vendor = require("./common/vendor.js");
const utils_musicSourceStorage = require("./utils/musicSourceStorage.js");
const utils_system = require("./utils/system.js");
const utils_config = require("./utils/config.js");
require("./store/modules/list.js");
require("./store/modules/player.js");
const utils_mesh_meshApi = require("./utils/mesh/meshApi.js");
if (!Array) {
  const _easycom_roc_icon_plus2 = common_vendor.resolveComponent("roc-icon-plus");
  _easycom_roc_icon_plus2();
}
const _easycom_roc_icon_plus = () => "./uni_modules/roc-icon-plus/components/roc-icon-plus/roc-icon-plus.js";
if (!Math) {
  _easycom_roc_icon_plus();
}
const _sfc_main = {
  __name: "index",
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    function parseScriptInfo(scriptContent) {
      const result = { name: "", version: "", author: "", description: "", homepage: "" };
      if (!scriptContent)
        return result;
      try {
        const commentMatch = /^\/\*[\s\S]+?\*\//.exec(scriptContent);
        if (commentMatch) {
          const commentBlock = commentMatch[0];
          const infoArr = commentBlock.split(/\r?\n/);
          const rxp = /^\s?\*\s?@(\w+)\s(.+)$/;
          const INFO_NAMES = { name: 24, description: 36, author: 56, homepage: 1024, version: 36 };
          for (const info of infoArr) {
            const match = rxp.exec(info);
            if (!match)
              continue;
            const key = match[1];
            const value = match[2].trim();
            if (INFO_NAMES[key] == null)
              continue;
            result[key] = value.length > INFO_NAMES[key] ? value.substring(0, INFO_NAMES[key]) + "..." : value;
          }
        }
        if (!result.name && !result.author && !result.description) {
          const nameMatch = scriptContent.match(/@name\s+([^\n\r\*]+)/);
          const versionMatch = scriptContent.match(/@version\s+([^\n\r\*]+)/);
          const authorMatch = scriptContent.match(/@author\s+([^\n\r\*]+)/);
          const descMatch = scriptContent.match(/@description\s+([^\n\r\*]+)/);
          const homeMatch = scriptContent.match(/@homepage\s+([^\n\r\*]+)/);
          if (nameMatch)
            result.name = nameMatch[1].trim();
          if (versionMatch)
            result.version = versionMatch[1].trim();
          if (authorMatch)
            result.author = authorMatch[1].trim();
          if (descMatch)
            result.description = descMatch[1].trim();
          if (homeMatch)
            result.homepage = homeMatch[1].trim();
        }
      } catch (e) {
        console.error("[音源插件] 解析脚本元信息失败:", e);
      }
      return result;
    }
    function decodeBase64(base64) {
      if (!base64)
        return "";
      try {
        if (typeof atob === "function") {
          const binary = atob(base64);
          const bytes2 = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes2[i] = binary.charCodeAt(i);
          }
          return new TextDecoder("utf-8").decode(bytes2);
        }
        const arr = common_vendor.index.base64ToArrayBuffer(base64);
        const bytes = new Uint8Array(arr);
        return new TextDecoder("utf-8").decode(bytes);
      } catch (e) {
        console.error("[音源插件] Base64解码失败:", e);
        try {
          if (typeof atob === "function") {
            return decodeURIComponent(escape(atob(base64)));
          }
        } catch (e2) {
          console.error("[音源插件] Base64降级解码也失败:", e2);
        }
        return "";
      }
    }
    const emit = __emit;
    const isTablet = common_vendor.ref(false);
    const checkIsTablet = () => {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        const width = systemInfo.windowWidth || systemInfo.screenWidth || 0;
        const height = systemInfo.windowHeight || systemInfo.screenHeight || 0;
        const TABLET_ASPECT_RATIO = 0.85;
        const TABLET_MIN_WIDTH = 400;
        const aspectRatio = width / height;
        isTablet.value = aspectRatio >= TABLET_ASPECT_RATIO && width >= TABLET_MIN_WIDTH;
      } catch (e) {
        isTablet.value = false;
      }
    };
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
    const showActionSheet = common_vendor.ref(false);
    const showDeleteConfirm = common_vendor.ref(false);
    const showAlertModal = common_vendor.ref(false);
    const currentActionSource = common_vendor.ref(null);
    const alertModalConfig = common_vendor.ref({ title: "", content: "", confirmText: "确定" });
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
      console.log("[MusicSources] goBack 被调用, isTablet:", isTablet.value);
      if (isTablet.value) {
        console.log("[MusicSources] 平板模式，触发 close 事件");
        emit("close");
      } else {
        console.log("[MusicSources] 非平板模式，调用 navigateBack");
        common_vendor.index.navigateBack();
      }
    };
    const meshMode = common_vendor.ref(null);
    const fetchMusicSources = () => {
      isLoading.value = true;
      meshMode.value = utils_config.getMeshMode();
      if (!meshMode.value) {
        console.log("[音源插件] 未选择服务器模式");
        sources.value = [];
        isLoading.value = false;
        return;
      }
      if (meshMode.value === "free") {
        console.log("[音源插件] 公共服务器模式，加载本地脚本");
        const localScripts = utils_config.getLocalScripts();
        sources.value = localScripts.map((s) => {
          let scriptName = s.name || "未知音源插件";
          let scriptVersion = s.version || "1.0";
          let scriptAuthor = s.author || "";
          let scriptDescription = s.description || "";
          if ((!scriptAuthor || !scriptDescription) && s.content) {
            try {
              const rawContent = decodeBase64(s.content);
              if (rawContent) {
                const parsed = parseScriptInfo(rawContent);
                if (parsed.name)
                  scriptName = parsed.name;
                if (parsed.version)
                  scriptVersion = parsed.version;
                if (parsed.author)
                  scriptAuthor = parsed.author;
                if (parsed.description)
                  scriptDescription = parsed.description;
              }
            } catch (e) {
              console.log("[音源插件] 解析脚本元信息失败:", e);
            }
          }
          return {
            id: s.id,
            name: scriptName + "（本地保存）",
            version: scriptVersion,
            developer: scriptAuthor || "本地导入",
            updateDate: new Date(s.addedAt || Date.now()).toLocaleDateString(),
            createdAt: "",
            description: scriptDescription || "本地音源插件",
            isDefault: s.isDefault || false,
            selected: s.isDefault || false,
            successRate: 0,
            isCircuitBroken: false,
            totalRequests: 0,
            failCount: 0
          };
        });
        utils_musicSourceStorage.saveMusicSources(sources.value);
        isLoading.value = false;
      } else {
        const serverUrl = utils_config.getServerUrl();
        common_vendor.index.request({
          url: `${serverUrl}/api/scripts/loaded`,
          method: "GET",
          success: (res) => {
            if (res.data && res.data.code === 200) {
              const apiSources = res.data.data || [];
              console.log("[音源插件] 获取音源插件列表成功:", apiSources);
              sources.value = apiSources.map((source) => ({
                id: source.id,
                name: source.name,
                version: source.version || "1.0.0",
                developer: source.author || "未知开发者",
                updateDate: source.updateTime || (/* @__PURE__ */ new Date()).toLocaleDateString(),
                createdAt: source.createdAt || "",
                description: source.description || "远程音源插件",
                isDefault: source.isDefault || false,
                selected: source.isDefault || false,
                successRate: source.successRate || 0,
                isCircuitBroken: source.isCircuitBroken || false,
                totalRequests: source.totalRequests || 0,
                failCount: source.failCount || 0
              }));
              utils_musicSourceStorage.saveMusicSources(sources.value);
            } else {
              console.error("[音源插件] 获取音源插件列表失败:", res.data);
              sources.value = utils_musicSourceStorage.getMusicSources();
            }
            isLoading.value = false;
          },
          fail: (err) => {
            console.error("[音源插件] 获取音源插件列表请求失败:", err);
            sources.value = utils_musicSourceStorage.getMusicSources();
            isLoading.value = false;
          }
        });
      }
    };
    const selectSource = async (sourceId) => {
      if (meshMode.value === "free") {
        utils_config.setDefaultLocalScript(sourceId);
        sources.value = sources.value.map((source) => ({
          ...source,
          selected: source.id === sourceId,
          isDefault: source.id === sourceId
        }));
        utils_musicSourceStorage.saveMusicSources(sources.value);
        common_vendor.index.showToast({ title: "设置成功", icon: "success" });
        return;
      }
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
          const sourceName = selectedSource ? selectedSource.name : "未知音源插件";
          sources.value = sources.value.map((source) => ({
            ...source,
            selected: source.id === sourceId,
            isDefault: source.id === sourceId
          }));
          utils_musicSourceStorage.saveMusicSources(sources.value);
          const activity = {
            type: "update",
            text: `设置默认音源插件 ${sourceName}`,
            textHtml: `设置默认音源插件 <strong>${sourceName}</strong>`,
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
        console.error("[音源插件] 设置默认音源插件失败:", error);
        common_vendor.index.showToast({
          title: "设置失败，请检查网络",
          icon: "none"
        });
      }
    };
    const openSourceActions = (source) => {
      currentSourceId.value = source.id;
      currentActionSource.value = source;
      showActionSheet.value = true;
    };
    const closeActionSheet = () => {
      showActionSheet.value = false;
    };
    const onActionDelete = () => {
      showActionSheet.value = false;
      showDeleteConfirm.value = true;
    };
    const closeDeleteConfirm = () => {
      showDeleteConfirm.value = false;
    };
    const confirmDeleteSource = async () => {
      showDeleteConfirm.value = false;
      const source = currentActionSource.value;
      if (!source)
        return;
      const sourceName = `${source.name} ${source.version}`;
      if (meshMode.value === "free") {
        utils_config.removeLocalScript(source.id);
        sources.value = sources.value.filter((s) => s.id !== source.id);
        utils_musicSourceStorage.saveMusicSources(sources.value);
        const activity = {
          type: "delete",
          text: `删除音源插件 ${sourceName}`,
          textHtml: `删除音源插件 <strong>${sourceName}</strong>`,
          time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
        };
        activities.value.unshift(activity);
        utils_musicSourceStorage.addActivity(activity);
        common_vendor.index.showToast({ title: "删除成功", icon: "success" });
        return;
      }
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
              description: s.description || "远程音源插件",
              updateNotify: true,
              selected: s.isDefault
            }));
            utils_musicSourceStorage.saveMusicSources(sources.value);
          }
          const activity = {
            type: "delete",
            text: `删除音源插件 ${sourceName}`,
            textHtml: `删除音源插件 <strong>${sourceName}</strong>`,
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
        console.error("删除音源插件失败:", error);
        common_vendor.index.showToast({
          title: "删除失败，请检查网络",
          icon: "none"
        });
      }
    };
    const closeAlertModal = () => {
      showAlertModal.value = false;
    };
    const showAlert = (title, content, confirmText = "确定") => {
      alertModalConfig.value = { title, content, confirmText };
      showAlertModal.value = true;
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
      showAlert("提示", "此功能暂不支持", "确定");
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
        common_vendor.index.showToast({ title: "请输入音源插件URL", icon: "none" });
        return;
      }
      importing.value = true;
      try {
        if (meshMode.value === "free") {
          const scriptUrl = importUrl.value.trim();
          console.log("[音源插件] 公共服务器模式本地导入:", scriptUrl);
          const downloadResponse = await new Promise((resolve, reject) => {
            common_vendor.index.request({
              url: scriptUrl,
              method: "GET",
              timeout: 15e3,
              success: (res) => resolve(res),
              fail: (err) => reject(err)
            });
          });
          if (downloadResponse.statusCode !== 200 || !downloadResponse.data) {
            common_vendor.index.showToast({ title: "下载脚本失败", icon: "none" });
            importing.value = false;
            return;
          }
          const scriptContent = typeof downloadResponse.data === "string" ? downloadResponse.data : JSON.stringify(downloadResponse.data);
          let base64Content = "";
          try {
            if (typeof btoa === "function") {
              base64Content = btoa(unescape(encodeURIComponent(scriptContent)));
            } else {
              base64Content = common_vendor.index.arrayBufferToBase64(
                new Uint8Array([...scriptContent].map((c) => c.charCodeAt(0))).buffer
              );
            }
          } catch (e) {
            console.error("Base64编码失败:", e);
            common_vendor.index.showToast({ title: "脚本编码失败", icon: "none" });
            importing.value = false;
            return;
          }
          common_vendor.index.showLoading({ title: "验证脚本中...", mask: true });
          const verifyResult = await utils_mesh_meshApi.verifyScriptWithMesh(base64Content, "导入脚本");
          common_vendor.index.hideLoading();
          if (!verifyResult.success) {
            common_vendor.index.showToast({ title: verifyResult.message, icon: "none", duration: 3e3 });
            importing.value = false;
            return;
          }
          const scriptId = "local_" + Date.now();
          const existingScripts = utils_config.getLocalScripts();
          const isDefault = existingScripts.length === 0;
          const scriptInfo = parseScriptInfo(scriptContent);
          console.log("[音源插件] 解析脚本元信息:", scriptInfo);
          console.log("[音源插件] 脚本内容前200字符:", scriptContent.substring(0, 200));
          utils_config.addLocalScript({
            id: scriptId,
            name: scriptInfo.name || "本地音源插件_" + (/* @__PURE__ */ new Date()).toLocaleString(),
            content: base64Content,
            isDefault,
            version: scriptInfo.version || "1.0",
            author: scriptInfo.author || "",
            description: scriptInfo.description || "",
            addedAt: Date.now()
          });
          fetchMusicSources();
          const activity = {
            type: "add",
            text: `导入音源插件成功（本地验证）`,
            textHtml: `导入音源插件 <strong>成功</strong>（本地验证）`,
            time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
          };
          activities.value.unshift(activity);
          utils_musicSourceStorage.addActivity(activity);
          common_vendor.index.showToast({ title: "导入成功", icon: "success" });
          closeOnlineImportPopup();
        } else {
          const response = await common_vendor.index.request({
            url: `${utils_config.getServerUrl()}/api/scripts/import/url`,
            method: "POST",
            header: { "Content-Type": "application/json" },
            data: { url: importUrl.value.trim() }
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
                description: s.description || "远程音源插件",
                updateNotify: true,
                selected: s.isDefault
              }));
              utils_musicSourceStorage.saveMusicSources(sources.value);
            }
            const activity = {
              type: "add",
              text: `导入音源插件成功`,
              textHtml: `导入音源插件 <strong>成功</strong>`,
              time: (/* @__PURE__ */ new Date()).toLocaleTimeString()
            };
            activities.value.unshift(activity);
            utils_musicSourceStorage.addActivity(activity);
            common_vendor.index.showToast({ title: result.msg || "导入成功", icon: "success" });
            closeOnlineImportPopup();
          } else {
            common_vendor.index.showToast({ title: result.msg || "导入失败", icon: "none" });
          }
        }
      } catch (error) {
        console.error("导入音源插件失败:", error);
        showAlert("导入失败", error.message || "网络错误，请检查网络连接", "确定");
      } finally {
        importing.value = false;
      }
    };
    common_vendor.onMounted(() => {
      console.log("[MusicSources] onMounted 被调用");
      startClock();
      checkDarkMode();
      checkIsTablet();
      console.log("[MusicSources] onMounted 后 isTablet:", isTablet.value);
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
      var _a;
      return common_vendor.e({
        a: common_vendor.s(statusBarStyle.value),
        b: common_vendor.p({
          type: "fas",
          name: "chevron-left",
          size: "20",
          color: isDarkMode.value ? "#f3f4f6" : "#4b5563"
        }),
        c: common_vendor.o(goBack, "13"),
        d: common_vendor.o(goBack, "60"),
        e: isTablet.value ? 1 : "",
        f: meshMode.value === "own"
      }, meshMode.value === "own" ? {} : meshMode.value === "free" ? {} : {}, {
        g: meshMode.value === "free",
        h: meshMode.value && !isLoading.value && sources.value.length < 2
      }, meshMode.value && !isLoading.value && sources.value.length < 2 ? common_vendor.e({
        i: sources.value.length === 0
      }, sources.value.length === 0 ? {} : {}) : {}, {
        j: isLoading.value
      }, isLoading.value ? {
        k: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "24",
          color: "#6b7280"
        })
      } : sources.value.length === 0 ? common_vendor.e({
        m: common_vendor.p({
          type: "fas",
          name: "music",
          size: "48",
          color: "#6b7280"
        }),
        n: meshMode.value
      }, meshMode.value ? {} : {}) : {
        o: common_vendor.f(sources.value, (source, index, i0) => {
          return common_vendor.e({
            a: "6e1ab562-3-" + i0,
            b: common_vendor.t(source.name),
            c: common_vendor.t(source.version),
            d: source.isCircuitBroken
          }, source.isCircuitBroken ? {} : {}, {
            e: "6e1ab562-4-" + i0,
            f: common_vendor.t(source.developer || "未知"),
            g: "6e1ab562-5-" + i0,
            h: common_vendor.t(source.createdAt || source.updateDate),
            i: source.description
          }, source.description ? {
            j: "6e1ab562-6-" + i0,
            k: common_vendor.p({
              type: "fas",
              name: "comment-alt",
              size: "12",
              color: "#999"
            }),
            l: common_vendor.t(source.description)
          } : {}, meshMode.value !== "free" ? {
            m: "6e1ab562-7-" + i0,
            n: common_vendor.p({
              type: "fas",
              name: "chart-line",
              size: "12",
              color: source.successRate >= 80 ? "#10b981" : source.successRate >= 50 ? "#f59e0b" : "#ef4444"
            }),
            o: common_vendor.t((source.successRate * 100).toFixed(2))
          } : {}, meshMode.value !== "free" ? {
            p: "6e1ab562-8-" + i0,
            q: common_vendor.p({
              type: "fas",
              name: "exchange-alt",
              size: "12",
              color: "#999"
            }),
            r: common_vendor.t(source.totalRequests),
            s: common_vendor.t(source.failCount)
          } : {}, {
            t: source.isCircuitBroken
          }, source.isCircuitBroken ? {} : {}, {
            v: source.selected
          }, source.selected ? {
            w: "6e1ab562-9-" + i0,
            x: common_vendor.p({
              type: "fas",
              name: "check-circle",
              size: "18",
              color: "#6dc380"
            })
          } : {}, {
            y: common_vendor.o(($event) => openSourceActions(source), source.id),
            z: source.id,
            A: source.selected ? 1 : "",
            B: common_vendor.o(($event) => selectSource(source.id), source.id)
          });
        }),
        p: common_vendor.p({
          type: "fas",
          name: "music",
          size: "20",
          color: "#6b7280"
        }),
        q: common_vendor.p({
          type: "fas",
          name: "user",
          size: "12",
          color: "#999"
        }),
        r: common_vendor.p({
          type: "fas",
          name: "calendar-alt",
          size: "12",
          color: "#999"
        }),
        s: meshMode.value !== "free",
        t: meshMode.value !== "free"
      }, {
        l: sources.value.length === 0,
        v: common_vendor.p({
          type: "fas",
          name: "cloud-download-alt",
          size: "20",
          color: "#0084ff"
        }),
        w: common_vendor.o(importOnline, "e6"),
        x: common_vendor.p({
          type: "fas",
          name: "file-import",
          size: "20",
          color: "#6b7280"
        }),
        y: common_vendor.o(importLocal, "09"),
        z: activities.value.length === 0
      }, activities.value.length === 0 ? {
        A: common_vendor.p({
          type: "fas",
          name: "history",
          size: "48",
          color: "#6b7280"
        })
      } : {
        B: common_vendor.f(activities.value, (activity, index, i0) => {
          return {
            a: "6e1ab562-13-" + i0,
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
        C: showOnlineImport.value
      }, showOnlineImport.value ? common_vendor.e({
        D: common_vendor.p({
          type: "fas",
          name: "times",
          size: "20",
          color: "#999"
        }),
        E: common_vendor.o(closeOnlineImportPopup, "3f"),
        F: importing.value,
        G: importUrl.value,
        H: common_vendor.o(($event) => importUrl.value = $event.detail.value, "e3"),
        I: common_vendor.o(closeOnlineImportPopup, "0f"),
        J: importing.value ? 1 : "",
        K: importing.value
      }, importing.value ? {
        L: common_vendor.p({
          type: "fas",
          name: "spinner",
          size: "16",
          color: "#fff"
        })
      } : {}, {
        M: common_vendor.o(startImport, "6c"),
        N: importing.value || !importUrl.value.trim() ? 1 : "",
        O: common_vendor.o(() => {
        }, "05"),
        P: common_vendor.o(closeOnlineImportPopup, "6e")
      }) : {}, {
        Q: showActionSheet.value
      }, showActionSheet.value ? {
        R: common_vendor.p({
          type: "fas",
          name: "trash-alt",
          size: "16",
          color: "#ff4d4f"
        }),
        S: common_vendor.o(onActionDelete, "63"),
        T: common_vendor.o(closeActionSheet, "32"),
        U: common_vendor.o(() => {
        }, "51"),
        V: common_vendor.o(closeActionSheet, "56")
      } : {}, {
        W: showDeleteConfirm.value
      }, showDeleteConfirm.value ? {
        X: common_vendor.t((_a = currentActionSource.value) == null ? void 0 : _a.name),
        Y: common_vendor.o(closeDeleteConfirm, "fd"),
        Z: common_vendor.o(confirmDeleteSource, "59"),
        aa: common_vendor.o(() => {
        }, "9a"),
        ab: common_vendor.o(closeDeleteConfirm, "11")
      } : {}, {
        ac: showAlertModal.value
      }, showAlertModal.value ? {
        ad: common_vendor.t(alertModalConfig.value.title),
        ae: common_vendor.t(alertModalConfig.value.content),
        af: common_vendor.t(alertModalConfig.value.confirmText),
        ag: common_vendor.o(closeAlertModal, "26"),
        ah: common_vendor.o(() => {
        }, "de"),
        ai: common_vendor.o(closeAlertModal, "33")
      } : {}, {
        aj: isDarkMode.value ? 1 : "",
        ak: isTablet.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6e1ab562"]]);
exports.MiniProgramPage = MiniProgramPage;
