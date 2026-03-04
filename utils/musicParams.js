"use strict";
const formatDuration = (duration) => {
  console.log("[formatDuration] 输入:", duration, "类型:", typeof duration);
  if (!duration) {
    console.log("[formatDuration] 返回默认值: 0:00");
    return "0:00";
  }
  let seconds = 0;
  if (typeof duration === "string") {
    if (duration.includes(":")) {
      console.log("[formatDuration] 已是 mm:ss 格式:", duration);
      return duration;
    }
    seconds = parseInt(duration);
  } else if (typeof duration === "number") {
    seconds = Math.floor(duration / 1e3);
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const result = `${mins}:${secs.toString().padStart(2, "0")}`;
  console.log("[formatDuration] 输出:", result);
  return result;
};
const getSingerName = (song) => {
  if (song.singer)
    return song.singer;
  if (song.ar && Array.isArray(song.ar)) {
    return song.ar.map((a) => a.name).join("/");
  }
  if (song.artists && Array.isArray(song.artists)) {
    return song.artists.map((a) => a.name).join("/");
  }
  return "";
};
const getAlbumName = (song) => {
  if (song.album)
    return song.album;
  if (song.albumName)
    return song.albumName;
  if (song.al && song.al.name)
    return song.al.name;
  if (song.album && typeof song.album === "object" && song.album.name) {
    return song.album.name;
  }
  return "";
};
const buildMusicRequestParams = (song, quality = "320k") => {
  console.log("[buildMusicRequestParams] 开始构建参数:", {
    hasSong: !!song,
    songId: song == null ? void 0 : song.id,
    songName: song == null ? void 0 : song.name,
    songSource: song == null ? void 0 : song.source,
    songDuration: song == null ? void 0 : song.duration,
    songDt: song == null ? void 0 : song.dt,
    songInterval: song == null ? void 0 : song.interval
  });
  if (!song) {
    console.error("[buildMusicRequestParams] 歌曲信息无效");
    return null;
  }
  const source = song.source || "tx";
  const name = song.name || "";
  const singer = getSingerName(song);
  const album = getAlbumName(song);
  const durationValue = song.dt || song.duration || song.interval;
  console.log("[buildMusicRequestParams] durationValue:", durationValue);
  const interval = formatDuration(durationValue);
  console.log("[buildMusicRequestParams] formatted interval:", interval);
  let requestData = null;
  switch (source) {
    case "tx":
      requestData = {
        source: "tx",
        musicInfo: {
          id: song.songmid || song.id,
          name,
          singer,
          source: "tx",
          interval,
          meta: {
            songId: song.songmid || song.id,
            albumName: album,
            hash: song.songmid || song.id
          }
        },
        quality
      };
      break;
    case "wy":
      requestData = {
        source: "wy",
        musicInfo: {
          id: song.id,
          name,
          singer,
          source: "wy",
          interval,
          meta: {
            songId: song.id,
            albumName: album,
            hash: song.id
          }
        },
        quality
      };
      break;
    case "kg":
      requestData = {
        source: "kg",
        musicInfo: {
          id: song.id,
          name,
          singer,
          source: "kg",
          interval,
          meta: {
            songId: song.id,
            albumName: album,
            hash: song.hash || song.id
          }
        },
        quality
      };
      break;
    case "kw":
      requestData = {
        source: "kw",
        musicInfo: {
          id: song.id,
          name,
          singer,
          source: "kw",
          interval,
          meta: {
            songId: song.id,
            albumName: album,
            hash: song.id
          }
        },
        quality
      };
      break;
    case "mg":
      const mgSongmid = song.songmid || song.songId || song.id;
      const mgCopyrightId = song.copyrightId || song.id;
      requestData = {
        source: "mg",
        songmid: mgSongmid,
        id: mgCopyrightId,
        musicInfo: {
          songmid: mgSongmid,
          copyrightId: mgCopyrightId,
          name,
          singer,
          source: "mg",
          interval,
          album,
          meta: {
            songId: mgSongmid,
            albumName: album,
            copyrightId: mgCopyrightId
          }
        },
        quality
      };
      break;
    default:
      requestData = {
        source,
        musicInfo: {
          id: song.id,
          name,
          singer,
          source,
          interval,
          meta: {
            songId: song.id,
            albumName: album,
            hash: song.id
          }
        },
        quality
      };
  }
  console.log("[buildMusicRequestParams] 构建请求参数:", {
    source,
    songId: song.id,
    songmid: song.songmid,
    hash: song.hash,
    quality,
    duration: song.duration,
    dt: song.dt,
    interval: song.interval,
    formattedInterval: interval
  });
  console.log("[buildMusicRequestParams] 返回的 requestData:", JSON.stringify(requestData));
  return requestData;
};
exports.buildMusicRequestParams = buildMusicRequestParams;
exports.formatDuration = formatDuration;
