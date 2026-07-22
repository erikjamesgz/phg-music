"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_multiSource = require("../multiSource.js");
const REGISTRY_SOURCES = [
  `https://fastly.jsdelivr.net/gh/erikjamesgz/phg-music/doc/serverlist/serverlist.json`,
  `https://cdn.jsdelivr.net/gh/erikjamesgz/phg-music/doc/serverlist/serverlist.json`,
  `https://raw.githubusercontent.com/erikjamesgz/phg-music/main/doc/serverlist/serverlist.json`
];
const REGISTRY_CACHE_KEY = "mesh_registry_url";
const REGISTRY_CACHE_TIME_KEY = "mesh_registry_cache_time";
const NODES_CACHE_KEY = "mesh_nodes_cache";
const NODES_CACHE_TIME_KEY = "mesh_nodes_cache_time";
const NODES_MANUAL_REFRESH_TIME_KEY = "mesh_nodes_manual_refresh_time";
const NODES_MANUAL_REFRESH_COOLDOWN = 60 * 60 * 1e3;
const NODES_AUTO_REFRESH_TIME_KEY = "mesh_nodes_auto_refresh_time";
const NODES_AUTO_REFRESH_COOLDOWN = 60 * 60 * 1e3;
const REPORT_COOLDOWN_KEY = "mesh_last_report_time";
const REPORT_COOLDOWN = 60 * 60 * 1e3;
const ABNORMAL_NODES_KEY = "mesh_abnormal_nodes";
const NODE_USAGE_KEY = "mesh_node_usage";
const TEST_MODE_KEY = "mesh_test_mode";
const TEST_NODES_BACKUP_KEY = "mesh_nodes_backup";
const MOCK_TEST_NODES = [
  {
    node_url: "http://192.0.2.1:9999",
    // TEST-NET-1 保留地址，保证不可达
    public_key: "test_unreachable_pk_00000000000000",
    contributor_name: "[测试]不可达节点",
    daily_limit: 5e4,
    current_usage: 0,
    alive: false,
    latency: -1
  },
  {
    node_url: "http://203.0.113.99:8888",
    // TEST-NET-3 保留地址，保证不可达
    public_key: "test_timeout_pk_000000000000000",
    contributor_name: "[测试]超时节点",
    daily_limit: 5e4,
    current_usage: 0,
    alive: true,
    latency: 0
  },
  {
    node_url: "https://example.com",
    public_key: "test_error_pk_000000000000000000",
    contributor_name: "[测试]返回错误节点",
    daily_limit: 5e4,
    current_usage: 0,
    alive: true,
    latency: 50
  },
  {
    node_url: "http://198.51.100.1:7777",
    // TEST-NET-2 保留地址
    public_key: "test_limit_pk_000000000000000000",
    contributor_name: "[测试]限额已满节点",
    daily_limit: 5e4,
    current_usage: 5e4,
    // 已达限额
    alive: true,
    latency: 30
  }
];
function injectTestNodes() {
  let existing = [];
  try {
    const cached = common_vendor.index.getStorageSync(NODES_CACHE_KEY);
    if (cached && Array.isArray(cached)) {
      existing = cached;
      common_vendor.index.setStorageSync(TEST_NODES_BACKUP_KEY, cached);
    }
  } catch (e) {
    console.log("[MeshConfig] 读取原缓存失败:", e);
  }
  const testNodes = [...MOCK_TEST_NODES, ...existing];
  common_vendor.index.setStorageSync(NODES_CACHE_KEY, testNodes);
  common_vendor.index.setStorageSync(NODES_CACHE_TIME_KEY, Date.now());
  common_vendor.index.setStorageSync(TEST_MODE_KEY, true);
  console.log(`[MeshConfig] ✅ 已注入 ${MOCK_TEST_NODES.length} 个测试节点 + ${existing.length} 个真实节点，共 ${testNodes.length} 个`);
  console.log("[MeshConfig] 测试节点顺序:");
  testNodes.forEach((n, i) => {
    console.log(`  [${i}] ${n.contributor_name || "匿名"} | url: ${n.node_url} | usage: ${n.current_usage || 0}/${n.daily_limit || 0} | alive: ${n.alive}`);
  });
  return testNodes;
}
function injectAllFailTestNodes() {
  let existing = [];
  try {
    const cached = common_vendor.index.getStorageSync(NODES_CACHE_KEY);
    if (cached && Array.isArray(cached)) {
      existing = cached;
      common_vendor.index.setStorageSync(TEST_NODES_BACKUP_KEY, cached);
    }
  } catch (e) {
    console.log("[MeshConfig] 读取原缓存失败:", e);
  }
  common_vendor.index.setStorageSync(NODES_CACHE_KEY, [...MOCK_TEST_NODES]);
  common_vendor.index.setStorageSync(NODES_CACHE_TIME_KEY, Date.now());
  common_vendor.index.setStorageSync(TEST_MODE_KEY, true);
  console.log(`[MeshConfig] ✅ 已注入 ${MOCK_TEST_NODES.length} 个失败测试节点（无真实节点），播放将全部失败 → 触发批量上报`);
  console.log("[MeshConfig] 测试节点顺序:");
  MOCK_TEST_NODES.forEach((n, i) => {
    console.log(`  [${i}] ${n.contributor_name || "匿名"} | url: ${n.node_url} | usage: ${n.current_usage || 0}/${n.daily_limit || 0} | alive: ${n.alive}`);
  });
  return [...MOCK_TEST_NODES];
}
function clearTestNodes() {
  try {
    const backup = common_vendor.index.getStorageSync(TEST_NODES_BACKUP_KEY);
    if (backup && Array.isArray(backup)) {
      common_vendor.index.setStorageSync(NODES_CACHE_KEY, backup);
      console.log(`[MeshConfig] ✅ 已恢复原有节点缓存: ${backup.length} 个节点`);
    } else {
      common_vendor.index.removeStorageSync(NODES_CACHE_KEY);
      console.log("[MeshConfig] ✅ 已清除节点缓存（无备份，下次将重新获取）");
    }
    common_vendor.index.setStorageSync(TEST_MODE_KEY, false);
    common_vendor.index.removeStorageSync(TEST_NODES_BACKUP_KEY);
  } catch (e) {
    console.error("[MeshConfig] 清除测试节点失败:", e);
  }
}
function isTestMode() {
  try {
    return common_vendor.index.getStorageSync(TEST_MODE_KEY) === true;
  } catch (e) {
    return false;
  }
}
async function getRegistryUrl(forceRefresh = false) {
  if (!forceRefresh) {
    try {
      const cached = common_vendor.index.getStorageSync(REGISTRY_CACHE_KEY);
      if (cached) {
        console.log("[MeshConfig] 使用缓存的注册中心地址:", cached);
        return cached;
      }
    } catch (e) {
      console.log("[MeshConfig] 读取缓存失败:", e);
    }
  }
  console.log("[MeshConfig] 从多源获取 serverlist.json...");
  const registryData = await utils_multiSource.fetchFromMultiSource(REGISTRY_SOURCES, { timeout: 8e3 });
  if (!registryData || !registryData.mesh_server_urls || !Array.isArray(registryData.mesh_server_urls)) {
    console.error("[MeshConfig] serverlist.json 格式无效");
    return null;
  }
  for (const url of registryData.mesh_server_urls) {
    const reachable = await checkUrlReachable(url + "/api/health");
    if (reachable) {
      console.log("[MeshConfig] 发现可用注册中心:", url);
      common_vendor.index.setStorageSync(REGISTRY_CACHE_KEY, url);
      common_vendor.index.setStorageSync(REGISTRY_CACHE_TIME_KEY, Date.now());
      return url;
    }
  }
  console.error("[MeshConfig] 所有注册中心地址均不可达");
  return null;
}
async function checkUrlReachable(url) {
  try {
    const result = await new Promise((resolve) => {
      common_vendor.index.request({
        url,
        method: "GET",
        timeout: 5e3,
        success: (res) => resolve(res.statusCode === 200),
        fail: () => resolve(false)
      });
    });
    return result;
  } catch (e) {
    return false;
  }
}
async function getNodeList(forceRefresh = false) {
  if (isTestMode()) {
    try {
      const cached = common_vendor.index.getStorageSync(NODES_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log(`[MeshConfig] 🧪 测试模式: 返回 ${cached.length} 个测试节点（含模拟异常节点）`);
        return mergeWithUsage(cached);
      }
    } catch (e) {
      console.log("[MeshConfig] 🧪 测试模式读取缓存失败:", e);
    }
  }
  if (!forceRefresh) {
    try {
      const cached = common_vendor.index.getStorageSync(NODES_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const cachedTime = common_vendor.index.getStorageSync(NODES_CACHE_TIME_KEY) || 0;
        const age = Math.round((Date.now() - cachedTime) / 6e4);
        console.log(`[MeshConfig] 使用缓存的节点列表: ${cached.length} 个节点 (缓存于 ${age} 分钟前)`);
        return mergeWithUsage(cached);
      }
    } catch (e) {
      console.log("[MeshConfig] 读取节点缓存失败:", e);
    }
  }
  console.log("[MeshConfig] 无缓存，从注册中心获取节点列表...");
  const registryUrl = await getRegistryUrl();
  if (!registryUrl) {
    console.error("[MeshConfig] 无法获取注册中心地址");
    return [];
  }
  const result = await fetchNodesFromRegistry(registryUrl);
  if (result && result.length > 0) {
    return mergeWithUsage(result);
  }
  const newRegistryUrl = await getRegistryUrl(true);
  if (newRegistryUrl) {
    const retryResult = await fetchNodesFromRegistry(newRegistryUrl);
    if (retryResult && retryResult.length > 0) {
      return mergeWithUsage(retryResult);
    }
  }
  console.log("[MeshConfig] 注册中心获取节点列表失败");
  return [];
}
async function fetchNodesFromRegistry(registryUrl) {
  try {
    const result = await new Promise((resolve) => {
      common_vendor.index.request({
        url: `${registryUrl}/api/nodes`,
        method: "GET",
        timeout: 1e4,
        success: (res) => {
          var _a, _b, _c;
          if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200 && ((_c = (_b = res.data) == null ? void 0 : _b.data) == null ? void 0 : _c.nodes)) {
            resolve(res.data.data.nodes);
          } else {
            resolve(null);
          }
        },
        fail: () => resolve(null)
      });
    });
    if (result && result.length > 0) {
      console.log("[MeshConfig] 获取节点列表成功:", result.length, "个节点");
      common_vendor.index.setStorageSync(NODES_CACHE_KEY, result);
      common_vendor.index.setStorageSync(NODES_CACHE_TIME_KEY, Date.now());
      return result;
    }
    return null;
  } catch (e) {
    console.error("[MeshConfig] 获取节点列表失败:", e);
    return null;
  }
}
async function refreshNodeList() {
  try {
    const lastRefresh = common_vendor.index.getStorageSync(NODES_MANUAL_REFRESH_TIME_KEY) || 0;
    const elapsed = Date.now() - lastRefresh;
    if (elapsed < NODES_MANUAL_REFRESH_COOLDOWN) {
      const remainMin = Math.ceil((NODES_MANUAL_REFRESH_COOLDOWN - elapsed) / 6e4);
      console.log(`[MeshConfig] 手动刷新冷却中，${remainMin}分钟后可刷新`);
      const cached = common_vendor.index.getStorageSync(NODES_CACHE_KEY) || [];
      return { nodes: mergeWithUsage(cached), success: false, message: `每小时只能刷新一次，${remainMin}分钟后可刷新` };
    }
  } catch (e) {
  }
  const registryUrl = await getRegistryUrl();
  if (!registryUrl) {
    return { nodes: [], success: false, message: "无法连接注册中心" };
  }
  const result = await fetchNodesFromRegistry(registryUrl);
  if (result && result.length > 0) {
    common_vendor.index.setStorageSync(NODES_MANUAL_REFRESH_TIME_KEY, Date.now());
    return { nodes: mergeWithUsage(result), success: true, message: `已刷新，共 ${result.length} 个节点` };
  }
  const newRegistryUrl = await getRegistryUrl(true);
  if (newRegistryUrl) {
    const retryResult = await fetchNodesFromRegistry(newRegistryUrl);
    if (retryResult && retryResult.length > 0) {
      common_vendor.index.setStorageSync(NODES_MANUAL_REFRESH_TIME_KEY, Date.now());
      return { nodes: mergeWithUsage(retryResult), success: true, message: `已刷新，共 ${retryResult.length} 个节点` };
    }
  }
  return { nodes: [], success: false, message: "刷新失败，请稍后重试" };
}
async function autoRefreshNodeList() {
  try {
    const lastAuto = common_vendor.index.getStorageSync(NODES_AUTO_REFRESH_TIME_KEY) || 0;
    if (Date.now() - lastAuto < NODES_AUTO_REFRESH_COOLDOWN) {
      console.log("[MeshConfig] 自动刷新冷却中，1小时内仅1次");
      return [];
    }
  } catch (e) {
  }
  const registryUrl = await getRegistryUrl();
  if (!registryUrl)
    return [];
  const result = await fetchNodesFromRegistry(registryUrl);
  if (result && result.length > 0) {
    common_vendor.index.setStorageSync(NODES_AUTO_REFRESH_TIME_KEY, Date.now());
    return mergeWithUsage(result);
  }
  const newRegistryUrl = await getRegistryUrl(true);
  if (newRegistryUrl) {
    const retryResult = await fetchNodesFromRegistry(newRegistryUrl);
    if (retryResult && retryResult.length > 0) {
      common_vendor.index.setStorageSync(NODES_AUTO_REFRESH_TIME_KEY, Date.now());
      return mergeWithUsage(retryResult);
    }
  }
  return [];
}
async function pingNode(nodeUrl) {
  const start = Date.now();
  try {
    const alive = await new Promise((resolve) => {
      common_vendor.index.request({
        url: nodeUrl,
        method: "GET",
        timeout: 3e3,
        success: () => resolve(true),
        fail: () => resolve(false)
      });
    });
    return { alive, latency: alive ? Date.now() - start : -1 };
  } catch (e) {
    return { alive: false, latency: -1 };
  }
}
async function pingAllNodes(nodes) {
  if (!nodes || nodes.length === 0)
    return [];
  const results = await Promise.all(
    nodes.map(async (node) => {
      const { alive, latency } = await pingNode(node.node_url);
      return { ...node, alive, latency };
    })
  );
  results.sort((a, b) => {
    if (a.alive && !b.alive)
      return -1;
    if (!a.alive && b.alive)
      return 1;
    return a.latency - b.latency;
  });
  return results;
}
function addAbnormalNode(nodeUrl, publicKey, failType) {
  if (!nodeUrl || !publicKey || !failType)
    return;
  try {
    const list = common_vendor.index.getStorageSync(ABNORMAL_NODES_KEY) || [];
    const now = Date.now();
    const existing = list.find((n) => n.node_url === nodeUrl);
    if (existing) {
      existing.last_fail_at = now;
      existing.fail_type = failType;
      console.log(`[MeshConfig] 📋 更新异常节点: ${nodeUrl} (${failType})`);
    } else {
      list.push({
        node_url: nodeUrl,
        public_key: publicKey,
        fail_type: failType,
        last_fail_at: now
      });
      console.log(`[MeshConfig] 📋 新增异常节点: ${nodeUrl} (${failType})`);
    }
    common_vendor.index.setStorageSync(ABNORMAL_NODES_KEY, list);
  } catch (e) {
    console.error("[MeshConfig] 添加异常节点失败:", e);
  }
}
function removeAbnormalNode(nodeUrl) {
  if (!nodeUrl)
    return;
  try {
    const list = common_vendor.index.getStorageSync(ABNORMAL_NODES_KEY) || [];
    const filtered = list.filter((n) => n.node_url !== nodeUrl);
    if (filtered.length !== list.length) {
      common_vendor.index.setStorageSync(ABNORMAL_NODES_KEY, filtered);
      console.log(`[MeshConfig] 节点恢复正常，移除异常记录: ${nodeUrl}`);
    }
  } catch (e) {
    console.error("[MeshConfig] 移除异常节点失败:", e);
  }
}
function getAbnormalNodes() {
  try {
    return common_vendor.index.getStorageSync(ABNORMAL_NODES_KEY) || [];
  } catch (e) {
    return [];
  }
}
function clearAbnormalNodes() {
  try {
    common_vendor.index.setStorageSync(ABNORMAL_NODES_KEY, []);
    console.log("[MeshConfig] 已清除本地异常节点列表");
  } catch (e) {
  }
}
async function reportAbnormalNodes() {
  const abnormalNodes = getAbnormalNodes();
  if (abnormalNodes.length === 0) {
    console.log("[MeshConfig] 无异常节点需要上报");
    return false;
  }
  try {
    const lastReport = common_vendor.index.getStorageSync(REPORT_COOLDOWN_KEY) || 0;
    if (Date.now() - lastReport < REPORT_COOLDOWN) {
      console.log("[MeshConfig] 批量上报冷却中，1小时内仅1次");
      return false;
    }
  } catch (e) {
  }
  const registryUrl = await getRegistryUrl();
  if (!registryUrl) {
    console.error("[MeshConfig] 无法获取注册中心地址，批量上报失败");
    return false;
  }
  const clientId = generateClientId();
  const nodes = abnormalNodes.map((n) => ({
    node_url: n.node_url,
    public_key: n.public_key,
    fail_type: n.fail_type
  }));
  console.log(`[MeshConfig] 批量上报 ${nodes.length} 个异常节点到注册中心...`);
  try {
    const result = await new Promise((resolve) => {
      common_vendor.index.request({
        url: `${registryUrl}/api/report-batch`,
        method: "POST",
        header: { "Content-Type": "application/json" },
        data: { client_id: clientId, nodes },
        timeout: 1e4,
        success: (res) => {
          var _a;
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            console.log("[MeshConfig] 批量上报失败:", res.statusCode, (_a = res.data) == null ? void 0 : _a.msg);
            resolve(false);
          }
        },
        fail: (err) => {
          console.log("[MeshConfig] 批量上报网络错误:", err.errMsg);
          resolve(false);
        }
      });
    });
    if (result) {
      clearAbnormalNodes();
      common_vendor.index.setStorageSync(REPORT_COOLDOWN_KEY, Date.now());
      console.log("[MeshConfig] ✅ 批量上报成功，已清除本地异常列表");
    }
    return result;
  } catch (e) {
    console.error("[MeshConfig] 批量上报异常:", e);
    return false;
  }
}
function generateClientId() {
  try {
    let id = common_vendor.index.getStorageSync("mesh_client_id");
    if (!id) {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      const raw = `${systemInfo.platform || "unknown"}_${systemInfo.model || "unknown"}_${Date.now()}`;
      id = `client_${raw.hashCode ? raw.hashCode() : raw.length}_${Math.random().toString(36).substring(2, 10)}`;
      common_vendor.index.setStorageSync("mesh_client_id", id);
    }
    return id;
  } catch (e) {
    return `client_${Math.random().toString(36).substring(2, 12)}`;
  }
}
function updateNodeUsage(nodeUrl, shareInfo) {
  if (!nodeUrl || !shareInfo)
    return;
  try {
    const usageMap = common_vendor.index.getStorageSync(NODE_USAGE_KEY) || {};
    usageMap[nodeUrl] = {
      daily_limit: shareInfo.daily_limit || 5e4,
      current_usage: shareInfo.current_usage || 0,
      reserved_limit: shareInfo.reserved_limit || 0,
      contributor_name: shareInfo.contributor_name || "",
      last_updated: Date.now()
    };
    common_vendor.index.setStorageSync(NODE_USAGE_KEY, usageMap);
    console.log("[MeshConfig] 更新节点使用量:", nodeUrl, usageMap[nodeUrl]);
  } catch (e) {
    console.error("[MeshConfig] 更新节点使用量失败:", e);
  }
}
function mergeWithUsage(nodes) {
  if (!nodes || nodes.length === 0)
    return [];
  try {
    const usageMap = common_vendor.index.getStorageSync(NODE_USAGE_KEY) || {};
    return nodes.map((node) => {
      var _a;
      const serverUsage = node.current_usage || 0;
      const localUsage = ((_a = usageMap[node.node_url]) == null ? void 0 : _a.current_usage) || 0;
      const currentUsage = Math.max(serverUsage, localUsage);
      const localData = usageMap[node.node_url];
      return {
        ...node,
        current_usage: currentUsage,
        daily_limit: (localData == null ? void 0 : localData.daily_limit) || node.daily_limit || 5e4,
        last_updated: (localData == null ? void 0 : localData.last_updated) || 0
      };
    });
  } catch (e) {
    return nodes;
  }
}
function isNodeAvailable(node) {
  if (!node)
    return false;
  const currentUsage = node.current_usage || 0;
  const dailyLimit = node.daily_limit ?? 5e4;
  return currentUsage < dailyLimit;
}
async function registerNode(params) {
  const { node_url, owner_key, contributor_name, daily_limit, current_usage, node_id } = params;
  if (!node_url || !owner_key) {
    return { success: false, message: "缺少必要参数" };
  }
  const registryUrl = await getRegistryUrl();
  if (!registryUrl) {
    return { success: false, message: "无法连接注册中心" };
  }
  const doRegister = (url) => new Promise((resolve) => {
    common_vendor.index.request({
      url: `${url}/api/register`,
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: {
        node_url,
        owner_key,
        contributor_name: contributor_name || "",
        daily_limit: daily_limit || 5e4,
        current_usage: current_usage || 0,
        node_id: node_id || ""
      },
      timeout: 3e4,
      success: (res) => {
        var _a, _b, _c;
        if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200) {
          resolve({ success: true, message: ((_b = res.data.data) == null ? void 0 : _b.message) || "注册成功", data: res.data.data });
        } else {
          resolve({ success: false, message: ((_c = res.data) == null ? void 0 : _c.msg) || "注册失败" });
        }
      },
      fail: (err) => {
        resolve({ success: false, message: err.errMsg || "网络请求失败" });
      }
    });
  });
  let result = await doRegister(registryUrl);
  if (!result.success) {
    console.log("[MeshConfig] 注册失败，重新发现注册中心地址...");
    const newUrl = await getRegistryUrl(true);
    if (newUrl && newUrl !== registryUrl) {
      result = await doRegister(newUrl);
    }
  }
  return result;
}
async function unregisterNode(params) {
  const { node_url, owner_key, node_id } = params;
  if (!node_url || !owner_key) {
    return { success: false, message: "缺少必要参数" };
  }
  const registryUrl = await getRegistryUrl();
  if (!registryUrl) {
    return { success: false, message: "无法连接注册中心" };
  }
  const doUnregister = (url) => new Promise((resolve) => {
    common_vendor.index.request({
      url: `${url}/api/unregister`,
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: { node_url, owner_key, node_id: node_id || "" },
      timeout: 1e4,
      success: (res) => {
        var _a, _b;
        if (res.statusCode === 200 && ((_a = res.data) == null ? void 0 : _a.code) === 200) {
          resolve({ success: true, message: "注销成功" });
        } else {
          resolve({ success: false, message: ((_b = res.data) == null ? void 0 : _b.msg) || "注销失败" });
        }
      },
      fail: (err) => {
        resolve({ success: false, message: err.errMsg || "网络请求失败" });
      }
    });
  });
  let result = await doUnregister(registryUrl);
  if (!result.success) {
    console.log("[MeshConfig] 注销失败，重新发现注册中心地址...");
    const newUrl = await getRegistryUrl(true);
    if (newUrl && newUrl !== registryUrl) {
      result = await doUnregister(newUrl);
    }
  }
  return result;
}
exports.addAbnormalNode = addAbnormalNode;
exports.autoRefreshNodeList = autoRefreshNodeList;
exports.clearTestNodes = clearTestNodes;
exports.getAbnormalNodes = getAbnormalNodes;
exports.getNodeList = getNodeList;
exports.injectAllFailTestNodes = injectAllFailTestNodes;
exports.injectTestNodes = injectTestNodes;
exports.isNodeAvailable = isNodeAvailable;
exports.isTestMode = isTestMode;
exports.pingAllNodes = pingAllNodes;
exports.refreshNodeList = refreshNodeList;
exports.registerNode = registerNode;
exports.removeAbnormalNode = removeAbnormalNode;
exports.reportAbnormalNodes = reportAbnormalNodes;
exports.unregisterNode = unregisterNode;
exports.updateNodeUsage = updateNodeUsage;
