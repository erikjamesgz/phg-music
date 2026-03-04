"use strict";
function parseLine(line) {
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  const timeTags = [];
  let match;
  while ((match = timeRegex.exec(line)) !== null) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const milliseconds = parseInt(match[3].padEnd(3, "0"));
    const time = minutes * 60 * 1e3 + seconds * 1e3 + milliseconds;
    timeTags.push(time);
  }
  let text = line.replace(timeRegex, "").trim();
  text = text.replace(/<-?\d+,-?\d+>/g, "");
  timeTags.forEach((time) => {
    result.push({ time, text });
  });
  return result;
}
function parseLyric(lyricText) {
  if (!lyricText || typeof lyricText !== "string") {
    return [];
  }
  const lines = lyricText.split("\n");
  const lyrics = [];
  lines.forEach((line) => {
    const parsedLines = parseLine(line);
    if (parsedLines.length > 0) {
      lyrics.push(...parsedLines);
    }
  });
  lyrics.sort((a, b) => a.time - b.time);
  const filtered = lyrics.filter((item, index) => {
    if (index === 0)
      return true;
    return item.text.trim() !== "";
  });
  return filtered;
}
function parseTranslation(tlyricText) {
  return parseLyric(tlyricText);
}
function mergeLyrics(lyrics, translations) {
  if (!translations || translations.length === 0) {
    return lyrics.map((line) => ({ ...line, translation: "" }));
  }
  return lyrics.map((line) => {
    const translation = translations.find((t) => Math.abs(t.time - line.time) < 100);
    return {
      ...line,
      translation: translation ? translation.text : ""
    };
  });
}
function getCurrentLyricIndex(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0)
    return -1;
  const currentTimeMs = currentTime * 1e3;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTimeMs >= lyrics[i].time) {
      return i;
    }
  }
  return 0;
}
function hasTimeTag(lyricText) {
  if (!lyricText || typeof lyricText !== "string")
    return false;
  return /\[\d{1,2}:\d{2}\.\d{1,3}\]/.test(lyricText);
}
function extractLyricsFromMusicData(musicData) {
  var _a, _b, _c;
  console.log("[lyric] extractLyricsFromMusicData 输入:", {
    hasMusicData: !!musicData,
    musicDataKeys: musicData ? Object.keys(musicData) : [],
    rawLyric: (_a = musicData == null ? void 0 : musicData.lyric) == null ? void 0 : _a.substring(0, 50),
    rawLxlyric: (_b = musicData == null ? void 0 : musicData.lxlyric) == null ? void 0 : _b.substring(0, 50),
    rawRlyric: (_c = musicData == null ? void 0 : musicData.rlyric) == null ? void 0 : _c.substring(0, 50)
  });
  if (!musicData) {
    console.log("[lyric] musicData 为空，返回空歌词");
    return { lyric: "", tlyric: "", rlyric: "", lxlyric: "" };
  }
  let lyric = musicData.lyric || "";
  let tlyric = musicData.tlyric || "";
  let rlyric = musicData.rlyric || "";
  let lxlyric = musicData.lxlyric || "";
  console.log("[lyric] 原始字段长度:", {
    lyricLength: lyric.length,
    tlyricLength: tlyric.length,
    rlyricLength: rlyric.length,
    lxlyricLength: lxlyric.length
  });
  const lyricHasTimeTag = hasTimeTag(lyric);
  const lxlyricHasTimeTag = hasTimeTag(lxlyric);
  const rlyricHasTimeTag = hasTimeTag(rlyric);
  console.log("[lyric] 时间标签检查结果:", {
    lyricHasTimeTag,
    lxlyricHasTimeTag,
    rlyricHasTimeTag
  });
  if (!lyricHasTimeTag && lxlyricHasTimeTag) {
    console.log("[lyric] lyric 无时间标签，使用 lxlyric");
    lyric = lxlyric;
  }
  if (!lyricHasTimeTag && !lxlyricHasTimeTag && rlyricHasTimeTag) {
    console.log("[lyric] lyric 和 lxlyric 都无时间标签，使用 rlyric");
    lyric = rlyric;
  }
  const result = {
    lyric,
    tlyric,
    rlyric,
    lxlyric
  };
  console.log("[lyric] extractLyricsFromMusicData 输出:", {
    lyricLength: result.lyric.length,
    tlyricLength: result.tlyric.length,
    lyricPreview: result.lyric.substring(0, 100)
  });
  return result;
}
exports.extractLyricsFromMusicData = extractLyricsFromMusicData;
exports.getCurrentLyricIndex = getCurrentLyricIndex;
exports.mergeLyrics = mergeLyrics;
exports.parseLyric = parseLyric;
exports.parseTranslation = parseTranslation;
