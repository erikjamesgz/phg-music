"use strict";
const locale_zhCN = require("./zh-CN.js");
const locale_enUS = require("./en-US.js");
const locale_jaJP = require("./ja-JP.js");
const locale_koKR = require("./ko-KR.js");
const messages = {
  "zh-CN": locale_zhCN.zhCN,
  "en-US": locale_enUS.enUS,
  "ja-JP": locale_jaJP.jaJP,
  "ko-KR": locale_koKR.koKR
};
exports.messages = messages;
