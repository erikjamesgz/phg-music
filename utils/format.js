"use strict";
function formatTime(seconds) {
  if (!seconds && seconds !== 0)
    return "00:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
}
function formatPlayCount(count) {
  if (!count && count !== 0)
    return "0";
  if (count < 1e4) {
    return count.toString();
  } else if (count < 1e8) {
    return Math.floor(count / 1e4) + "万";
  } else {
    return Math.floor(count / 1e8) + "亿";
  }
}
function formatDate(date) {
  if (!date)
    return "";
  let d;
  if (typeof date === "number") {
    d = new Date(date);
  } else if (typeof date === "string") {
    d = new Date(date);
  } else {
    d = date;
  }
  if (isNaN(d.getTime()))
    return "";
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
}
function formatFileSize(bytes) {
  if (!bytes && bytes !== 0)
    return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return bytes.toFixed(2) + " " + units[i];
}
function formatDuration(ms) {
  if (!ms && ms !== 0)
    return "00:00";
  const seconds = Math.floor(ms / 1e3);
  return formatTime(seconds);
}
function formatRelativeTime(date) {
  if (!date)
    return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diff = now - d;
  const seconds = Math.floor(diff / 1e3);
  if (seconds < 60) {
    return "刚刚";
  } else if (seconds < 3600) {
    return Math.floor(seconds / 60) + "分钟前";
  } else if (seconds < 86400) {
    return Math.floor(seconds / 3600) + "小时前";
  } else if (seconds < 2592e3) {
    return Math.floor(seconds / 86400) + "天前";
  } else if (seconds < 31536e3) {
    return Math.floor(seconds / 2592e3) + "个月前";
  } else {
    return Math.floor(seconds / 31536e3) + "年前";
  }
}
const formatUtils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  formatDate,
  formatDuration,
  formatFileSize,
  formatPlayCount,
  formatRelativeTime,
  formatTime
}, Symbol.toStringTag, { value: "Module" }));
exports.formatDate = formatDate;
exports.formatPlayCount = formatPlayCount;
exports.formatUtils = formatUtils;
