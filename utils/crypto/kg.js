"use strict";
const utils_crypto_md5 = require("./md5.js");
const signatureParams = (params, platform = "web", body = "") => {
  let keyparam = "OIlwieks28dk2k092lksi2UIkp";
  if (platform === "web")
    keyparam = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt";
  let param_list = params.split("&");
  param_list.sort();
  let sign_params = `${keyparam}${param_list.join("")}${body}${keyparam}`;
  return utils_crypto_md5.md5(sign_params);
};
exports.signatureParams = signatureParams;
