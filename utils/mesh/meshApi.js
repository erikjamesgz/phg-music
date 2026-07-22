"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_mesh_meshConfig = require("./meshConfig.js");
const utils_config = require("../config.js");
const SHARE_REQUEST_TIMEOUT = 2e4;
const MAX_NODE_ATTEMPTS = 5;
const MAX_SCRIPTS_BODY_SIZE = 1024 * 1024;
const MAX_SCRIPTS_COUNT = 3;
const TEST_SONG = {
  source: "kw",
  quality: "128k",
  musicInfo: { songmid: "228908", name: "晴天", singer: "周杰伦" }
};
let _preferredNodeUrl = null;
const PREFERRED_NODE_KEY = "mesh_preferred_node";
let _activeNodeUrl = null;
const ACTIVE_NODE_KEY = "mesh_active_node";
const _recentFailures = /* @__PURE__ */ new Map();
const FAILURE_COOLDOWN = 60 * 1e3;
try {
  _preferredNodeUrl = common_vendor.index.getStorageSync(PREFERRED_NODE_KEY) || null;
  _activeNodeUrl = common_vendor.index.getStorageSync(ACTIVE_NODE_KEY) || null;
} catch (e) {
}
function setPreferredNode(nodeUrl) {
  _preferredNodeUrl = nodeUrl;
  try {
    common_vendor.index.setStorageSync(PREFERRED_NODE_KEY, nodeUrl);
  } catch (e) {
  }
  console.log(`[MeshApi] 📌 用户设置首选节点: ${nodeUrl || "(清除)"}`);
}
function getActiveNodeUrl() {
  return _activeNodeUrl;
}
function getPreferredNodeUrl() {
  return _preferredNodeUrl;
}
function markNodeSuccess(nodeUrl) {
  const changed = _activeNodeUrl !== nodeUrl;
  _activeNodeUrl = nodeUrl;
  try {
    common_vendor.index.setStorageSync(ACTIVE_NODE_KEY, nodeUrl);
  } catch (e) {
  }
  _recentFailures.delete(nodeUrl);
  utils_mesh_meshConfig.removeAbnormalNode(nodeUrl);
  if (changed) {
    console.log(`[MeshApi] 📌 活跃节点变更为: ${nodeUrl}`);
    try {
      common_vendor.index.$emit("meshActiveNodeChanged", nodeUrl);
    } catch (e) {
    }
  }
}
function markNodeFailure(nodeUrl) {
  _recentFailures.set(nodeUrl, Date.now());
  console.log(`[MeshApi] ⏳ 标记节点失败: ${nodeUrl}，${FAILURE_COOLDOWN / 1e3}秒内跳过`);
  try {
    common_vendor.index.$emit("meshAbnormalNodesUpdated");
  } catch (e) {
  }
}
function isRecentlyFailed(nodeUrl) {
  const failTime = _recentFailures.get(nodeUrl);
  if (!failTime)
    return false;
  if (Date.now() - failTime < FAILURE_COOLDOWN)
    return true;
  _recentFailures.delete(nodeUrl);
  return false;
}
function prioritizeNodes(nodes) {
  if (!nodes || nodes.length === 0)
    return nodes;
  const filtered = nodes.filter((n) => n.node_url === _preferredNodeUrl || n.node_url === _activeNodeUrl || !isRecentlyFailed(n.node_url));
  const skippedCount = nodes.length - filtered.length;
  if (skippedCount > 0) {
    console.log(`[MeshApi] ⏳ 跳过 ${skippedCount} 个冷却期内的失败节点`);
  }
  const priorityUrl = _activeNodeUrl || _preferredNodeUrl;
  console.log(`[MeshApi] 📌 prioritizeNodes 状态: preferred=${_preferredNodeUrl || "(无)"}, active=${_activeNodeUrl || "(无)"}, priorityUrl=${priorityUrl || "(无)"}`);
  if (priorityUrl) {
    const priorityIdx = filtered.findIndex((n) => n.node_url === priorityUrl);
    if (priorityIdx > 0) {
      const [priorityNode] = filtered.splice(priorityIdx, 1);
      filtered.unshift(priorityNode);
      const label = priorityUrl === _activeNodeUrl ? "活跃" : "用户首选";
      console.log(`[MeshApi] 📌 优先使用${label}节点: ${priorityNode.contributor_name || "匿名"}`);
    } else if (priorityIdx === -1) {
      if (_preferredNodeUrl === priorityUrl)
        _preferredNodeUrl = null;
      if (_activeNodeUrl === priorityUrl)
        _activeNodeUrl = null;
    }
  }
  return filtered;
}
function buildScriptsForRequest() {
  var _a, _b;
  const allScripts = utils_config.getLocalScripts();
  if (allScripts.length === 0)
    return { scripts: null, singleScript: null };
  const defaultScript = allScripts.find((s) => s.isDefault) || allScripts[0];
  const otherScripts = allScripts.filter((s) => s !== defaultScript);
  otherScripts.sort((a, b) => {
    var _a2, _b2;
    return (((_a2 = a.content) == null ? void 0 : _a2.length) || 0) - (((_b2 = b.content) == null ? void 0 : _b2.length) || 0);
  });
  const scriptsArray = [{ content: defaultScript.content, name: defaultScript.name, isDefault: true }];
  let totalSize = ((_a = defaultScript.content) == null ? void 0 : _a.length) || 0;
  for (const s of otherScripts) {
    if (scriptsArray.length >= MAX_SCRIPTS_COUNT)
      break;
    const size = ((_b = s.content) == null ? void 0 : _b.length) || 0;
    if (totalSize + size > MAX_SCRIPTS_BODY_SIZE) {
      console.log(`[MeshApi] 跳过脚本 ${s.name} (${size}字节)，总计将超限`);
      continue;
    }
    scriptsArray.push({ content: s.content, name: s.name });
    totalSize += size;
  }
  console.log(`[MeshApi] 构建 ${scriptsArray.length} 个脚本，总大小 ${totalSize} 字节`);
  if (scriptsArray.length === 1 || totalSize > MAX_SCRIPTS_BODY_SIZE) {
    return { scripts: null, singleScript: { content: defaultScript.content, name: defaultScript.name } };
  }
  return { scripts: scriptsArray, singleScript: null };
}
async function getMusicUrlFromMesh(params, scriptContentBase64, scriptName = "shared", scriptsArray = null, onNodeSwitch = null) {
  var _a, _b;
  console.log("[MeshApi] 开始从共享节点获取播放链接:", params.source, params.quality);
  let scripts = scriptsArray;
  let singleContent = scriptContentBase64;
  let singleName = scriptName;
  if (!scripts && !singleContent) {
    const built = buildScriptsForRequest();
    scripts = built.scripts;
    singleContent = (_a = built.singleScript) == null ? void 0 : _a.content;
    singleName = (_b = built.singleScript) == null ? void 0 : _b.name;
    if (!scripts && !singleContent) {
      console.log("[MeshApi] 没有可用的本地脚本");
      return null;
    }
  }
  if (scripts) {
    console.log(`[MeshApi] 使用多脚本模式: ${scripts.length} 个脚本`);
  } else {
    console.log(`[MeshApi] 使用单脚本模式: ${singleName}`);
  }
  let nodes = await utils_mesh_meshConfig.getNodeList();
  if (!nodes || nodes.length === 0) {
    console.log("[MeshApi] 没有可用的共享节点");
    return null;
  }
  const testMode = utils_mesh_meshConfig.isTestMode();
  console.log(`[MeshApi] 可用节点数: ${nodes.length}${testMode ? " 🧪(测试模式)" : ""}`);
  if (testMode) {
    console.log("[MeshApi] 🧪 测试模式节点列表:");
    nodes.forEach((n, i) => {
      console.log(`  [${i}] ${n.contributor_name || "匿名"} | url: ${n.node_url} | usage: ${n.current_usage || 0}/${n.daily_limit || 0} | alive: ${n.alive}`);
    });
  }
  if (testMode) {
    const quotaFull = nodes.filter((n) => !utils_mesh_meshConfig.isNodeAvailable(n));
    if (quotaFull.length > 0) {
      console.log(`[MeshApi] 🧪 测试模式: ${quotaFull.length} 个限额已满节点也将尝试请求（返回429→记录→上报下架）`);
    }
  }
  nodes = prioritizeNodes(nodes);
  if (nodes.length === 0) {
    console.log("[MeshApi] 所有节点最近失败，冷却中，稍后重试");
    return null;
  }
  const result = await tryNodes(nodes, params, singleContent, singleName, scripts, testMode, onNodeSwitch);
  if (result)
    return result;
  console.log("[MeshApi] 所有共享节点均失败，尝试刷新节点列表...");
  utils_mesh_meshConfig.reportAbnormalNodes().catch((e) => console.log("[MeshApi] 批量上报异常:", e.message));
  const refreshedNodes = await utils_mesh_meshConfig.autoRefreshNodeList();
  if (refreshedNodes.length > 0) {
    console.log(`[MeshApi] 刷新获取到 ${refreshedNodes.length} 个新节点，重新尝试...`);
    const filtered = prioritizeNodes(refreshedNodes);
    if (filtered.length > 0) {
      const retryResult = await tryNodes(filtered, params, singleContent, singleName, scripts, testMode, onNodeSwitch);
      if (retryResult)
        return retryResult;
      console.log("[MeshApi] 刷新后的节点也全部失败");
    }
  } else {
    console.log("[MeshApi] 刷新节点列表失败或冷却中（1小时限1次）");
  }
  return null;
}
async function tryNodes(nodes, params, singleContent, singleName, scripts, testMode, onNodeSwitch) {
  let attempts = 0;
  for (const node of nodes) {
    if (attempts >= MAX_NODE_ATTEMPTS) {
      console.log("[MeshApi] 已达最大尝试次数:", MAX_NODE_ATTEMPTS);
      break;
    }
    if (onNodeSwitch)
      onNodeSwitch(node);
    attempts++;
    const usageInfo = !utils_mesh_meshConfig.isNodeAvailable(node) ? " (限额满)" : "";
    console.log(`[MeshApi] 尝试节点 ${attempts}/${MAX_NODE_ATTEMPTS}:`, node.contributor_name || "匿名", "延迟:", node.latency + "ms", usageInfo);
    if (testMode)
      console.log(`[MeshApi] 🧪 正在请求: ${node.node_url}/${node.public_key}/share/music-url`);
    try {
      const result = await callShareMusicUrl(node, params, singleContent, singleName, scripts);
      if (result && result.url) {
        console.log(`[MeshApi] ✅ 共享节点获取成功: ${node.contributor_name || "匿名"}${testMode ? " 🧪(测试模式: 经过故障转移后成功)" : ""}`);
        markNodeSuccess(node.node_url);
        if (result.share_info)
          utils_mesh_meshConfig.updateNodeUsage(node.node_url, result.share_info);
        return {
          url: result.url,
          type: result.type || params.quality,
          source: result.source || params.source,
          quality: result.quality || params.quality,
          lyric: result.lyric || "",
          tlyric: result.tlyric || "",
          rlyric: result.rlyric || "",
          lxlyric: result.lxlyric || "",
          cached: result.cached || false,
          fallback: result.fallback || null,
          scriptId: result.scriptId || "",
          scriptName: result.scriptName || "",
          fromMesh: true,
          nodeUrl: node.node_url,
          contributorName: node.contributor_name || "",
          shareInfo: result.share_info || null
        };
      }
      if (result && result.skip) {
        markNodeFailure(node.node_url);
        utils_mesh_meshConfig.addAbnormalNode(node.node_url, node.public_key, result.fail_type);
      }
    } catch (e) {
      console.log(`[MeshApi] ❌ 节点 ${node.contributor_name || "匿名"} 请求失败:`, e.message);
      if (e.scriptError) {
        console.log(`[MeshApi] ⚠️ 脚本插件获取失败，节点正常，不切换节点`);
        common_vendor.index.showToast({ title: `脚本获取失败: ${e.message}`, icon: "none", duration: 3e3 });
        return null;
      }
      markNodeFailure(node.node_url);
      utils_mesh_meshConfig.addAbnormalNode(node.node_url, node.public_key, "timeout");
      const nodeName = node.contributor_name || "匿名节点";
      common_vendor.index.showToast({ title: `节点「${nodeName}」异常，正在切换...`, icon: "none", duration: 2e3 });
      if (testMode)
        console.log(`[MeshApi] 🧪 测试模式: 节点 ${node.contributor_name || "匿名"} 异常 → 记录异常 + 切换到下一个节点`);
    }
  }
  return null;
}
function callShareMusicUrl(node, params, scriptContentBase64, scriptName, scriptsArray = null) {
  const url = `${node.node_url}/${node.public_key}/share/music-url`;
  const requestBody = {
    source: params.source,
    quality: params.quality,
    musicInfo: params.musicInfo || {}
  };
  if (scriptsArray && scriptsArray.length > 0) {
    requestBody.scripts = scriptsArray;
    requestBody.allowToggleSource = true;
  } else {
    requestBody.scriptContent = scriptContentBase64;
    requestBody.scriptName = scriptName;
    requestBody.allowToggleSource = true;
  }
  console.log("[MeshApi] 请求共享接口:", node.contributor_name || "匿名", scriptsArray ? `(多脚本:${scriptsArray.length}个)` : "(单脚本)");
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: requestBody,
      timeout: SHARE_REQUEST_TIMEOUT,
      success: (res) => {
        var _a, _b, _c, _d, _e, _f, _g;
        console.log("[MeshApi] /share/music-url 响应:", JSON.stringify(res.data));
        if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_c = (_b = res.data) == null ? void 0 : _b.data) == null ? void 0 : _c.url)) {
          resolve({
            url: res.data.data.url,
            type: res.data.data.type,
            source: res.data.data.source,
            quality: res.data.data.quality,
            lyric: res.data.data.lyric || "",
            tlyric: res.data.data.tlyric || "",
            rlyric: res.data.data.rlyric || "",
            lxlyric: res.data.data.lxlyric || "",
            cached: res.data.data.cached || false,
            fallback: res.data.data.fallback || null,
            scriptId: res.data.data.scriptId || "",
            scriptName: res.data.data.scriptName || "",
            share_info: res.data.data.share_info || null
          });
        } else if (res.statusCode === 429) {
          console.log("[MeshApi] 节点返回429（限额已达）:", node.contributor_name || "匿名");
          utils_mesh_meshConfig.updateNodeUsage(node.node_url, {
            daily_limit: node.daily_limit || 5e4,
            current_usage: node.daily_limit || 5e4
          });
          resolve({ skip: true, fail_type: "http_429" });
        } else if (res.statusCode === 403) {
          console.log("[MeshApi] 节点共享未开启:", node.contributor_name || "匿名");
          resolve({ skip: true, fail_type: "http_403" });
        } else if (res.statusCode === 200) {
          console.log("[MeshApi] 节点服务器正常(200)，但脚本获取失败:", node.contributor_name || "匿名", (_d = res.data) == null ? void 0 : _d.code, (_e = res.data) == null ? void 0 : _e.msg);
          const err = new Error(((_f = res.data) == null ? void 0 : _f.msg) || "脚本获取失败");
          err.scriptError = true;
          reject(err);
        } else {
          console.log("[MeshApi] 节点返回错误:", node.contributor_name || "匿名", res.statusCode, (_g = res.data) == null ? void 0 : _g.msg);
          resolve({ skip: true, fail_type: "http_5xx" });
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "网络请求失败"));
      }
    });
  });
}
async function verifyScriptWithMesh(scriptContentBase64, scriptName = "test") {
  console.log("[MeshApi] 验证脚本可用性:", scriptName);
  let nodes = await utils_mesh_meshConfig.getNodeList();
  if (!nodes || nodes.length === 0) {
    return { success: false, message: "没有可用的共享节点，请先确保公共服务器列表不为空" };
  }
  const testMode = utils_mesh_meshConfig.isTestMode();
  nodes = prioritizeNodes(nodes);
  if (nodes.length === 0) {
    return { success: false, message: "所有节点最近失败，冷却中，请稍后重试" };
  }
  const result = await tryNodes(nodes, TEST_SONG, scriptContentBase64, scriptName, null, testMode, null);
  if (result) {
    return { success: true, message: "脚本验证成功", url: result.url };
  }
  console.log("[MeshApi] 验证脚本: 所有节点失败，尝试刷新节点列表...");
  utils_mesh_meshConfig.reportAbnormalNodes().catch((e) => console.log("[MeshApi] 批量上报异常:", e.message));
  const refreshedNodes = await utils_mesh_meshConfig.autoRefreshNodeList();
  if (refreshedNodes.length > 0) {
    console.log(`[MeshApi] 刷新获取到 ${refreshedNodes.length} 个新节点，重新验证...`);
    const filtered = prioritizeNodes(refreshedNodes);
    if (filtered.length > 0) {
      const retryResult = await tryNodes(filtered, TEST_SONG, scriptContentBase64, scriptName, null, testMode, null);
      if (retryResult) {
        return { success: true, message: "脚本验证成功", url: retryResult.url };
      }
    }
  }
  return { success: false, message: "所有节点均无法验证脚本，请稍后重试" };
}
async function getSonglistDetailFromMesh(link, source) {
  console.log("[MeshApi] 开始从共享节点获取歌单详情:", source, link);
  let nodes = await utils_mesh_meshConfig.getNodeList();
  if (!nodes || nodes.length === 0) {
    console.log("[MeshApi] 没有可用的共享节点");
    return null;
  }
  const testMode = utils_mesh_meshConfig.isTestMode();
  nodes = prioritizeNodes(nodes);
  if (nodes.length === 0) {
    console.log("[MeshApi] 所有节点最近失败，冷却中，稍后重试");
    return null;
  }
  const result = await tryNodesForSonglist(nodes, link, source, testMode);
  if (result)
    return result;
  console.log("[MeshApi] 所有共享节点均无法获取歌单详情，尝试刷新节点列表...");
  utils_mesh_meshConfig.reportAbnormalNodes().catch((e) => console.log("[MeshApi] 批量上报异常:", e.message));
  const refreshedNodes = await utils_mesh_meshConfig.autoRefreshNodeList();
  if (refreshedNodes.length > 0) {
    console.log(`[MeshApi] 刷新获取到 ${refreshedNodes.length} 个新节点，重新尝试...`);
    const filtered = prioritizeNodes(refreshedNodes);
    if (filtered.length > 0) {
      const retryResult = await tryNodesForSonglist(filtered, link, source, testMode);
      if (retryResult)
        return retryResult;
      console.log("[MeshApi] 刷新后的节点也无法获取歌单详情");
    }
  } else {
    console.log("[MeshApi] 刷新节点列表失败或冷却中（1小时限1次）");
  }
  return null;
}
async function tryNodesForSonglist(nodes, link, source, testMode) {
  let attempts = 0;
  for (const node of nodes) {
    if (attempts >= MAX_NODE_ATTEMPTS) {
      console.log("[MeshApi] 已达最大尝试次数:", MAX_NODE_ATTEMPTS);
      break;
    }
    attempts++;
    const usageInfo = !utils_mesh_meshConfig.isNodeAvailable(node) ? " (限额满)" : "";
    console.log(`[MeshApi] 尝试节点 ${attempts}/${MAX_NODE_ATTEMPTS}:`, node.contributor_name || "匿名", usageInfo);
    if (testMode)
      console.log(`[MeshApi] 🧪 正在请求歌单详情: ${node.node_url}/${node.public_key}/share/songlist-detail`);
    try {
      const result = await callShareSonglistDetail(node, link, source);
      if (result && !result.skip) {
        console.log(`[MeshApi] ✅ 歌单详情获取成功: ${node.contributor_name || "匿名"}${testMode ? " 🧪(经过故障转移后成功)" : ""}`);
        markNodeSuccess(node.node_url);
        return result;
      }
      if (result && result.skip) {
        markNodeFailure(node.node_url);
        utils_mesh_meshConfig.addAbnormalNode(node.node_url, node.public_key, result.fail_type);
      }
    } catch (e) {
      console.log(`[MeshApi] ❌ 节点 ${node.contributor_name || "匿名"} 歌单详情请求失败:`, e.message);
      if (e.scriptError) {
        console.log(`[MeshApi] ⚠️ 歌单详情脚本获取失败，节点正常，不切换节点`);
        common_vendor.index.showToast({
          title: `歌单详情脚本获取失败: ${e.message}`,
          icon: "none",
          duration: 3e3
        });
        return null;
      }
      markNodeFailure(node.node_url);
      utils_mesh_meshConfig.addAbnormalNode(node.node_url, node.public_key, "timeout");
      const nodeName = node.contributor_name || "匿名节点";
      common_vendor.index.showToast({
        title: `节点「${nodeName}」异常，正在切换...`,
        icon: "none",
        duration: 2e3
      });
      if (testMode)
        console.log(`[MeshApi] 🧪 测试模式: 节点 ${node.contributor_name || "匿名"} 异常 → 记录异常 + 切换到下一个`);
    }
  }
  return null;
}
function callShareSonglistDetail(node, link, source) {
  const url = `${node.node_url}/${node.public_key}/share/songlist-detail`;
  console.log("[MeshApi] 请求歌单详情接口:", node.contributor_name || "匿名");
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: { link, source },
      timeout: SHARE_REQUEST_TIMEOUT,
      success: (res) => {
        var _a, _b, _c, _d, _e, _f;
        if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_b = res.data) == null ? void 0 : _b.data)) {
          resolve(res.data.data);
        } else if (res.statusCode === 429) {
          console.log("[MeshApi] 节点返回429（限额已达）:", node.contributor_name || "匿名");
          utils_mesh_meshConfig.updateNodeUsage(node.node_url, {
            daily_limit: node.daily_limit || 5e4,
            current_usage: node.daily_limit || 5e4
          });
          resolve({ skip: true, fail_type: "http_429" });
        } else if (res.statusCode === 403) {
          console.log("[MeshApi] 节点共享未开启:", node.contributor_name || "匿名");
          resolve({ skip: true, fail_type: "http_403" });
        } else if (res.statusCode === 200) {
          console.log("[MeshApi] 节点服务器正常(200)，但歌单详情脚本获取失败:", node.contributor_name || "匿名", (_c = res.data) == null ? void 0 : _c.code, (_d = res.data) == null ? void 0 : _d.msg);
          const err = new Error(((_e = res.data) == null ? void 0 : _e.msg) || "歌单详情脚本获取失败");
          err.scriptError = true;
          reject(err);
        } else {
          console.log("[MeshApi] 节点返回错误:", node.contributor_name || "匿名", res.statusCode, (_f = res.data) == null ? void 0 : _f.msg);
          resolve({ skip: true, fail_type: "http_5xx" });
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "网络请求失败"));
      }
    });
  });
}
exports.getActiveNodeUrl = getActiveNodeUrl;
exports.getMusicUrlFromMesh = getMusicUrlFromMesh;
exports.getPreferredNodeUrl = getPreferredNodeUrl;
exports.getSonglistDetailFromMesh = getSonglistDetailFromMesh;
exports.setPreferredNode = setPreferredNode;
exports.verifyScriptWithMesh = verifyScriptWithMesh;
