"use strict";
const PROXY_SERVERS = [
  {
    name: "original",
    url: "",
    // 原链接，不添加代理前缀
    enabled: true
  },
  {
    name: "wsrv",
    url: "https://wsrv.nl/?url=",
    enabled: true
  },
  {
    name: "weserv",
    url: "https://images.weserv.nl/?url=",
    enabled: true
  },
  {
    name: "jina",
    url: "https://r.jina.ai/http://",
    enabled: true
  }
];
const proxyFailCount = {};
const MAX_FAIL_COUNT = 3;
const DEFAULT_IMAGE = "/static/images/default-cover.png";
const getAvailableProxy = (startIndex = 0) => {
  for (let i = startIndex; i < PROXY_SERVERS.length; i++) {
    const proxy = PROXY_SERVERS[i];
    const failCount = proxyFailCount[proxy.name] || 0;
    if (proxy.enabled && failCount < MAX_FAIL_COUNT) {
      return { proxy, index: i };
    }
  }
  return null;
};
const recordProxyFail = (proxyName) => {
  proxyFailCount[proxyName] = (proxyFailCount[proxyName] || 0) + 1;
  console.warn(`[ImageProxy] 代理 ${proxyName} 失败次数: ${proxyFailCount[proxyName]}`);
};
const convertToHttps = (url) => {
  if (!url)
    return url;
  return url.replace(/^http:\/\//i, "https://");
};
const proxyImageUrl = (url, proxyIndex = 0) => {
  if (!url)
    return DEFAULT_IMAGE;
  if (url.startsWith("https://"))
    return url;
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../"))
    return url;
  if (!url.startsWith("http://"))
    return DEFAULT_IMAGE;
  let proxy;
  if (proxyIndex >= 0 && proxyIndex < PROXY_SERVERS.length) {
    proxy = PROXY_SERVERS[proxyIndex];
  } else {
    const result = getAvailableProxy(0);
    if (result)
      proxy = result.proxy;
  }
  if (!proxy) {
    console.error("[ImageProxy] 没有可用的代理服务器");
    return DEFAULT_IMAGE;
  }
  if (proxy.name === "original") {
    return url;
  }
  if (proxy.name === "jina") {
    return `${proxy.url}${url.replace("http://", "")}`;
  }
  return `${proxy.url}${encodeURIComponent(url)}`;
};
const handleImageError = (event, originalUrl, currentProxyIndex = 0) => {
  if (!originalUrl)
    return null;
  const nextIndex = currentProxyIndex + 1;
  if (currentProxyIndex < PROXY_SERVERS.length) {
    recordProxyFail(PROXY_SERVERS[currentProxyIndex].name);
  }
  if (nextIndex < PROXY_SERVERS.length) {
    const nextUrl = proxyImageUrl(originalUrl, nextIndex);
    console.log(`[ImageProxy] 代理 ${PROXY_SERVERS[currentProxyIndex].name} 失败，尝试 ${PROXY_SERVERS[nextIndex].name}: ${nextUrl}`);
    if (event && event.target) {
      event.target.src = nextUrl;
    }
    return nextUrl;
  }
  const httpsUrl = convertToHttps(originalUrl);
  console.log(`[ImageProxy] 所有代理都失败，尝试直接转换为 HTTPS: ${httpsUrl}`);
  if (event && event.target) {
    event.target.src = httpsUrl;
  }
  return httpsUrl;
};
exports.handleImageError = handleImageError;
exports.proxyImageUrl = proxyImageUrl;
