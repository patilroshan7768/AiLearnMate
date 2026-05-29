const axios = require("axios");
const cheerio = require("cheerio");

// Clean API key from env (handles null-byte encoding issues from Windows UTF-16 .env files)
const getApiKey = () => {
  const envKey = process.env.YOUTUBE_API_KEY;
  if (envKey) {
    // Remove null bytes and whitespace from Windows UTF-16 encoded .env files
    const cleaned = envKey.replace(/\0/g, "").trim();
    if (cleaned.length > 10) return cleaned;
  }
  // Fallback hardcoded key
  return "AIzaSyA6ZWamp8uyuvjhmJZCLhWOwIXfRs4ub2A";
};

const getInvidiousInstances = () => {
  const envInstances = process.env.INVIDIOUS_INSTANCES;
  if (envInstances) {
    return envInstances
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  }
  return [
    "https://yewtu.eu",
    "https://yewtu.kavin.rocks",
    "https://yewtu.cafe",
    "https://yewtu.snopyta.org",
    "https://yewtu.moomoo.me",
  ];
};

const safeText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(safeText).join("");
  if (value.runs) return value.runs.map((run) => run.text || "").join("");
  return "";
};

const parseYouTubeSearchHtml = (html) => {
  const startKey = "ytInitialData =";
  const start = html.indexOf(startKey);
  if (start === -1) return [];

  const jsonStart = html.indexOf("{", start);
  const jsonEnd = html.indexOf(";</script>", jsonStart);
  if (jsonStart === -1 || jsonEnd === -1) return [];

  const jsonText = html.slice(jsonStart, jsonEnd);

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (err) {
    console.warn(
      "[YouTube HTML] Failed to parse initial data JSON:",
      err.message,
    );
    return [];
  }

  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents;
  if (!Array.isArray(contents)) return [];

  const playlistRenderers = [];
  for (const content of contents) {
    const items = content?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const renderer =
        item?.playlistRenderer ||
        item?.richItemRenderer?.content?.playlistRenderer;
      if (renderer) playlistRenderers.push(renderer);
    }
  }

  const normalized = playlistRenderers.map((renderer) => {
    const thumbnailUrl =
      renderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
      renderer?.thumbnail?.thumbnails?.[0]?.url ||
      "";
    const channelTitle =
      renderer?.shortBylineText?.runs?.map((run) => run.text).join("") ||
      renderer?.longBylineText?.runs?.map((run) => run.text).join("") ||
      "";
    const channelId =
      renderer?.shortBylineText?.runs?.find(
        (run) => run?.navigationEndpoint?.browseEndpoint?.browseId,
      )?.navigationEndpoint?.browseEndpoint?.browseId || "";

    return {
      id: { playlistId: renderer.playlistId },
      snippet: {
        title: safeText(renderer.title),
        description: safeText(renderer.descriptionSnippet),
        channelTitle,
        channelId,
        publishedAt: renderer?.publishedTimeText?.simpleText || "",
        thumbnails: {
          high: { url: thumbnailUrl },
          medium: { url: thumbnailUrl },
          default: { url: thumbnailUrl },
        },
      },
    };
  });

  return normalized.filter((item) => item.id?.playlistId);
};

const searchYoutubeHtmlPlaylists = async (query, maxResults = 12) => {
  try {
    const searchQuery = `${query} tutorial course playlist`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=EgIQAw%3D%3D`;
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    const items = parseYouTubeSearchHtml(response.data);
    if (items.length > 0) {
      console.log(
        "[YouTube HTML] Fallback search returned",
        items.length,
        "results.",
      );
      return items.slice(0, maxResults);
    }
    console.warn("[YouTube HTML] No playlist results found for query:", query);
  } catch (err) {
    console.warn("[YouTube HTML] fallback search error:", err.message);
  }
  return [];
};

const normalizeInvidiousPlaylistResult = (item) => {
  const playlistId = item.playlistId || item.url?.split("list=")[1] || item.id;
  const thumbnailUrl = item.thumbnail || item.videoThumbnails?.[0]?.url || "";

  return {
    id: { playlistId },
    snippet: {
      title: item.title || item.name || "",
      description: item.description || item.metadata?.description || "",
      channelTitle: item.author || item.uploader || "",
      channelId: item.authorId || item.uploaderId || "",
      publishedAt: item.published || item.publishedAt || "",
      thumbnails: {
        high: { url: thumbnailUrl },
        medium: { url: thumbnailUrl },
        default: { url: thumbnailUrl },
      },
    },
  };
};

const searchInvidiousPlaylists = async (query, maxResults = 12) => {
  const instances = getInvidiousInstances();
  for (const instance of instances) {
    try {
      const url = `${instance}/api/v1/search?type=playlist&query=${encodeURIComponent(query)}&max_results=${maxResults}`;
      const response = await axios.get(url, { timeout: 10000 });
      const items = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      const playlistItems = items.filter(
        (item) => item.playlistId || item.type === "playlist",
      );
      if (playlistItems.length === 0) continue;

      return playlistItems
        .slice(0, maxResults)
        .map(normalizeInvidiousPlaylistResult)
        .filter((item) => item.id.playlistId);
    } catch (err) {
      console.warn(
        `[YouTube/Invidious] fallback search failed on ${instance}: ${err.message}`,
      );
    }
  }
  return [];
};

/**
 * Search YouTube for educational playlists by query
 */
const searchYoutubePlaylists = async (query, maxResults = 12) => {
  try {
    const apiKey = getApiKey();
    const url = `https://www.googleapis.com/youtube/v3/search`;

    const response = await axios.get(url, {
      params: {
        part: "snippet",
        q: `${query} tutorial course playlist`,
        type: "playlist",
        order: "relevance",
        safeSearch: "strict",
        maxResults: maxResults + 5,
        key: apiKey,
      },
      timeout: 8000,
    });

    const items = response.data.items || [];
    if (items.length > 0) return items;
    console.warn(
      `[YouTube] Data API returned zero results for query "${query}"; trying fallback.`,
    );
  } catch (error) {
    const status = error.response?.status;
    const errData = error.response?.data?.error;
    if (status === 403 || status === 429) {
      console.warn(
        `[YouTube] API quota exceeded or key invalid (${status}). Falling back to Invidious search.`,
      );
    } else {
      console.error("YouTube Search Error:", errData?.message || error.message);
    }
  }

  const invidiousFallback = await searchInvidiousPlaylists(query, maxResults);
  if (invidiousFallback.length > 0) return invidiousFallback;

  return await searchYoutubeHtmlPlaylists(query, maxResults);
};

/**
 * Fetch featured playlists for a given topic/category (for auto-load on Explore page)
 */
const fetchFeaturedPlaylists = async (topic, maxResults = 8) => {
  try {
    const apiKey = getApiKey();
    const url = `https://www.googleapis.com/youtube/v3/search`;

    const response = await axios.get(url, {
      params: {
        part: "snippet",
        q: `${topic} complete course tutorial beginner`,
        type: "playlist",
        order: "relevance",
        safeSearch: "strict",
        maxResults: maxResults,
        key: apiKey,
      },
      timeout: 8000,
    });

    const items = response.data.items || [];
    if (items.length > 0) return items;
    console.warn(
      `[YouTube] Featured API returned zero results for topic "${topic}"; trying fallback.`,
    );
  } catch (error) {
    const status = error.response?.status;
    const errData = error.response?.data?.error;
    if (status === 403 || status === 429) {
      console.warn(
        `[YouTube] Featured quota exceeded or key invalid (${status}) for topic "${topic}". Falling back to Invidious search.`,
      );
    } else {
      console.error(
        `YouTube Featured Error [${topic}]:`,
        errData?.message || error.message,
      );
    }
  }

  const htmlFallback = await searchYoutubeHtmlPlaylists(topic, maxResults);
  if (htmlFallback.length > 0) return htmlFallback;
  return [];
};

module.exports = { searchYoutubePlaylists, fetchFeaturedPlaylists };
