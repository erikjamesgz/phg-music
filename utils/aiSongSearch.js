"use strict";
const services_api = require("../services/api.js");
const formatSinger = (singer) => {
  if (!singer)
    return "";
  if (typeof singer === "string")
    return singer;
  if (Array.isArray(singer)) {
    return singer.map((s) => s.name || s).join("、");
  }
  return String(singer);
};
const parseDuration = (durationStr) => {
  if (!durationStr)
    return 0;
  if (typeof durationStr === "number")
    return durationStr;
  const parts = durationStr.toString().split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
};
const calculateMatchScore = (targetSong, candidate) => {
  var _a;
  let score = 0;
  const filterStr = (str) => {
    if (typeof str !== "string")
      return String(str || "");
    return str.replace(/\s|'|\.|,|，|&|"|、|\(|\)|（|）|`|~|-|<|>|\||\/|\]|\[!！/g, "").toLowerCase();
  };
  const targetName = filterStr(targetSong.name);
  const targetSinger = filterStr(targetSong.singer);
  const candidateName = filterStr(candidate.name);
  const candidateSinger = filterStr(formatSinger(candidate.singer || candidate.artists));
  const candidateAlbum = filterStr(candidate.albumName || ((_a = candidate.album) == null ? void 0 : _a.name) || "");
  if (candidateName === targetName)
    score += 45;
  else if (candidateName.includes(targetName) || targetName.includes(candidateName))
    score += 20;
  if (candidateSinger === targetSinger)
    score += 35;
  else if (candidateSinger.includes(targetSinger) || targetSinger.includes(candidateSinger))
    score += 15;
  if (targetSong.duration && candidate.duration) {
    const targetDuration = parseDuration(targetSong.duration);
    const candidateDuration = typeof candidate.duration === "number" ? Math.floor(candidate.duration / 1e3) : parseDuration(candidate.interval || candidate.duration.toString());
    const diff = Math.abs(targetDuration - candidateDuration);
    if (diff <= 5)
      score += 12;
    else if (diff <= 10)
      score += 6;
    else if (diff <= 30)
      score += 3;
  }
  if (targetSong.album && candidateAlbum) {
    const targetAlbum = filterStr(targetSong.album);
    if (candidateAlbum === targetAlbum)
      score += 8;
    else if (candidateAlbum.includes(targetAlbum) || targetAlbum.includes(candidateAlbum))
      score += 4;
  }
  return score;
};
const searchAiSongSource = async (aiSong, setStatusText = null) => {
  var _a, _b;
  console.log("\n[AI Song Search] ========== 开始搜索AI推荐歌曲的音源 ==========");
  console.log("[AI Song Search] 目标歌曲:", aiSong.name, "-", aiSong.singer);
  try {
    if (setStatusText) {
      setStatusText(`正在搜索：${aiSong.name} - ${aiSong.singer}`);
    }
    const keyword = `${aiSong.name} ${aiSong.singer}`.trim();
    console.log("[AI Song Search] 🔍 搜索关键词:", keyword);
    console.log("\n[AI Song Search] ===== 第一阶段搜索：主要平台（tx + kg）=====\n");
    const primarySources = ["tx", "kg"];
    let allResults = [];
    let foundPerfectMatch = false;
    for (const source of primarySources) {
      try {
        console.log(`[AI Song Search] 🔍 正在搜索 [${source}] 音源...`);
        const startTime = Date.now();
        const result = await services_api.searchApi.searchSongs(keyword, source, 1, 20);
        const searchTime = Date.now() - startTime;
        if (result && result.list && result.list.length > 0) {
          console.log(`[AI Song Search] ✅ [${source}] 搜索完成，找到 ${result.list.length} 首歌曲，耗时 ${searchTime}ms`);
          const scoredSongs = result.list.map((s, idx) => {
            const score = calculateMatchScore(aiSong, s);
            return {
              ...s,
              matchScore: score,
              source,
              searchIndex: idx
            };
          });
          scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
          const bestInSource = scoredSongs[0];
          console.log(`[AI Song Search] 🏆 [${source}] 最佳匹配: 《${bestInSource.name}》-${formatSinger(bestInSource.singer || bestInSource.artists)} (${bestInSource.matchScore}分)
`);
          allResults.push(...scoredSongs);
          if (bestInSource.matchScore >= 90) {
            console.log(`[AI Song Search] 🎯 发现高匹配！（${bestInSource.matchScore} >= 90），停止搜索其他平台`);
            foundPerfectMatch = true;
            break;
          }
        } else {
          console.log(`[AI Song Search] ⚠️ [${source}] 未找到结果，耗时 ${searchTime}ms`);
        }
      } catch (error) {
        console.error(`[AI Song Search] ❌ [${source}] 搜索失败:`, error.message);
      }
    }
    if (!foundPerfectMatch) {
      console.log("\n[AI Song Search] ===== 第二阶段搜索：补充平台（kw + mg）=====\n");
      const secondarySources = ["kw", "mg"];
      for (const source of secondarySources) {
        try {
          console.log(`[AI Song Search] 🔍 正在搜索 [${source}] 音源...`);
          const startTime = Date.now();
          const result = await services_api.searchApi.searchSongs(keyword, source, 1, 20);
          const searchTime = Date.now() - startTime;
          if (result && result.list && result.list.length > 0) {
            console.log(`[AI Song Search] ✅ [${source}] 搜索完成，找到 ${result.list.length} 首歌曲，耗时 ${searchTime}ms`);
            const scoredSongs = result.list.map((s, idx) => {
              const score = calculateMatchScore(aiSong, s);
              return {
                ...s,
                matchScore: score,
                source,
                searchIndex: idx
              };
            });
            scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
            const bestInSource = scoredSongs[0];
            console.log(`[AI Song Search] 🏆 [${source}] 最佳匹配: 《${bestInSource.name}》-${formatSinger(bestInSource.singer || bestInSource.artists)} (${bestInSource.matchScore}分)
`);
            allResults.push(...scoredSongs);
            if (bestInSource.matchScore >= 90) {
              console.log(`[AI Song Search] 🎯 发现高匹配！停止搜索`);
              foundPerfectMatch = true;
              break;
            }
          } else {
            console.log(`[AI Song Search] ⚠️ [${source}] 未找到结果，耗时 ${searchTime}ms`);
          }
        } catch (error) {
          console.error(`[AI Song Search] ❌ [${source}] 搜索失败:`, error.message);
        }
      }
    }
    if (!foundPerfectMatch) {
      console.log("\n[AI Song Search] ===== 第三阶段搜索：最后平台（wy）=====\n");
      const tertiarySource = "wy";
      try {
        console.log(`[AI Song Search] 🔍 正在搜索 [${tertiarySource}] 音源...`);
        const startTime = Date.now();
        const result = await services_api.searchApi.searchSongs(keyword, tertiarySource, 1, 20);
        const searchTime = Date.now() - startTime;
        if (result && result.list && result.list.length > 0) {
          console.log(`[AI Song Search] ✅ [${tertiarySource}] 搜索完成，找到 ${result.list.length} 首歌曲，耗时 ${searchTime}ms`);
          const scoredSongs = result.list.map((s, idx) => {
            const score = calculateMatchScore(aiSong, s);
            return {
              ...s,
              matchScore: score,
              source: tertiarySource,
              searchIndex: idx
            };
          });
          scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
          const bestInSource = scoredSongs[0];
          console.log(`[AI Song Search] 🏆 [${tertiarySource}] 最佳匹配: 《${bestInSource.name}》-${formatSinger(bestInSource.singer || bestInSource.artists)} (${bestInSource.matchScore}分)
`);
          allResults.push(...scoredSongs);
        } else {
          console.log(`[AI Song Search] ⚠️ [${tertiarySource}] 未找到结果，耗时 ${searchTime}ms`);
        }
      } catch (error) {
        console.error(`[AI Song Search] ❌ [${tertiarySource}] 搜索失败:`, error.message);
      }
    }
    console.log("\n[AI Song Search] ===== 最终选择 =====");
    console.log(`[AI Song Search] 📊 总共搜索到 ${allResults.length} 首候选歌曲`);
    if (allResults.length === 0) {
      throw new Error(`未找到"${aiSong.name}"的可用音源`);
    }
    allResults.sort((a, b) => b.matchScore - a.matchScore);
    const bestMatch = allResults[0];
    console.log(`[AI Song Search] 🎯 最终选择: 《${bestMatch.name}》- ${formatSinger(bestMatch.singer || bestMatch.artists)}`);
    console.log(`[AI Song Search]    音源: ${bestMatch.source}`);
    console.log(`[AI Song Search]    相似度: ${bestMatch.matchScore} 分`);
    const finalSong = {
      id: bestMatch.id || bestMatch.mid || aiSong._aiId,
      name: bestMatch.name,
      singer: formatSinger(bestMatch.singer || bestMatch.artists),
      ar: typeof bestMatch.singer === "string" ? [{ name: bestMatch.singer }] : bestMatch.artists || [],
      al: { name: bestMatch.albumName || ((_a = bestMatch.album) == null ? void 0 : _a.name) || aiSong.album || "" },
      album: { name: bestMatch.albumName || ((_b = bestMatch.album) == null ? void 0 : _b.name) || aiSong.album || "" },
      source: bestMatch.source,
      duration: bestMatch.interval || bestMatch.duration || parseDuration(aiSong.duration),
      picUrl: bestMatch.pic || bestMatch.image || "",
      mid: bestMatch.mid,
      _aiOriginalSong: aiSong,
      _isAiSong: true
    };
    console.log("[AI Song Search] ✅ 搜索成功！");
    console.log("[AI Song Search] 返回歌曲对象:", finalSong.name, "-", finalSong.singer, "[ID:", finalSong.id, ", Source:", finalSong.source, "]");
    return finalSong;
  } catch (error) {
    console.error("[AI Song Search] ❌ 搜索失败:", error);
    throw error;
  }
};
exports.searchAiSongSource = searchAiSongSource;
