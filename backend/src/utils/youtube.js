/**
 * YouTube Utility — Real Transcript Extraction Only
 * Uses YTDL → youtube-transcript → Invidious → Deepgram audio transcription
 * NO FAKE FALLBACK CONTENT — Fails if no real transcript can be extracted
 */
const axios = require("axios");
const { YoutubeTranscript } = require("youtube-transcript");
const fs = require("fs");
const os = require("os");
const path = require("path");
const FormData = require("form-data");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

// Hardcoded API key as ultimate fallback (same as .env)
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyCZ8fyIT3X1akltQ_AuYmKQgLz7SGkLg88";
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract YouTube Video ID from any YouTube URL format
 */
const extractVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Get video details using YouTube oEmbed API (free, no API key needed)
 * Retries up to 2 times on failure
 */
const getVideoDetails = async (videoUrl) => {
  const videoId = extractVideoId(videoUrl);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(oembedUrl, { timeout: 10000 });

      return {
        title: response.data.title || "YouTube Video",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        channelName: response.data.author_name || "YouTube Channel",
        videoId: videoId || videoUrl,
      };
    } catch (error) {
      console.warn(`oEmbed attempt ${attempt} failed: ${error.message}`);
      if (attempt < 2) await sleep(1000);
    }
  }

  // Return defaults if oEmbed fails
  return {
    title: "YouTube Video",
    thumbnail: videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : "",
    channelName: "YouTube Channel",
    videoId: videoId || videoUrl,
  };
};

/**
 * YTDL InnerTube Subtitle Extractor
 * Uses @distube/ytdl-core to retrieve video timedtext tracks, avoiding direct page scraping.
 * High-resiliency and extremely fast native InnerTube extraction.
 */
const fetchYtdlTranscript = async (videoId) => {
  console.log(
    `[YTDL Extractor] Fetching transcript via InnerTube for video: ${videoId}`,
  );
  const ytdl = require("@distube/ytdl-core");
  try {
    const info = await ytdl.getBasicInfo(videoId);
    const captions =
      info.player_response?.captions?.playerCaptionsTracklistRenderer;

    if (
      !captions ||
      !captions.captionTracks ||
      captions.captionTracks.length === 0
    ) {
      console.warn(
        `[YTDL Extractor] No captions tracklist available for video.`,
      );
      return null;
    }

    const tracks = captions.captionTracks;
    // Search for English or default language track
    const track =
      tracks.find((t) => t.languageCode === "en") ||
      tracks.find((t) => t.languageCode && t.languageCode.startsWith("en")) ||
      tracks[0];

    const cleanUrl = track.baseUrl.replace(/&fmt=[^&]*/g, "");
    const xmlUrl = cleanUrl.includes("fmt=") ? cleanUrl : cleanUrl + "&fmt=xml";
    console.log(
      `[YTDL Extractor] Querying timedtext XML from YouTube timedtext API...`,
    );
    const response = await axios.get(xmlUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.youtube.com/",
      },
      timeout: 8000,
    });
    const xmlString = response.data;

    if (xmlString && typeof xmlString === "string") {
      const textRegex =
        /<text\s+start="[^"]*"\s+dur="[^"]*"[^>]*>([\s\S]*?)<\/text>/gi;
      const matches = [];
      let match;
      while ((match = textRegex.exec(xmlString)) !== null) {
        matches.push(match[1]);
      }

      const cleanTranscript = matches
        .join(" ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#32;/g, " ")
        .replace(/&#10;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanTranscript.length >= 50) {
        console.log(
          `[YTDL Extractor] SUCCESS: Extracted ${cleanTranscript.length} characters.`,
        );
        return cleanTranscript;
      }
    }
  } catch (err) {
    console.error(
      `[YTDL Extractor] Failed to extract captions: ${err.message}`,
    );
  }
  return null;
};

/**
 * Dynamic Invidious Subtitle Extractor Fallback
 * Fetches healthy instances from invidious.io and queries their caption API.
 * High-resiliency backup when local IP is rate-limited/blocked by YouTube (429/ReCAPTCHA).
 */
const fetchInvidiousTranscript = async (videoId) => {
  console.log(
    `[Invidious Fallback] Fetching healthy Invidious instances for video: ${videoId}`,
  );
  try {
    const instancesResponse = await axios.get(
      "https://api.invidious.io/instances.json?sort_by=type,health",
      { timeout: 8000 },
    );
    const instances = instancesResponse.data;

    // Filter healthy https instances with uptime > 95%
    const healthyInstances = instances
      .filter((item) => {
        const stats = item[1];
        return (
          stats.type === "https" &&
          stats.monitor &&
          stats.monitor.down === false &&
          stats.monitor.uptime > 95
        );
      })
      .map((item) => item[1].uri);

    console.log(
      `[Invidious Fallback] Found ${healthyInstances.length} healthy HTTPS instances.`,
    );

    // Iterate through healthy instances to fetch subtitles
    for (const uri of healthyInstances.slice(0, 6)) {
      try {
        console.log(
          `[Invidious Fallback] Querying transcript at instance: ${uri}`,
        );
        const response = await axios.get(
          `${uri}/api/v1/captions/${videoId}?lang=en`,
          { timeout: 6000 },
        );
        const vtt = response.data;

        if (vtt && typeof vtt === "string" && vtt.includes("WEBVTT")) {
          console.log(`[Invidious Fallback] SUCCESS from ${uri}!`);
          const lines = vtt.split("\n");
          const cleanText = lines
            .filter((line) => {
              const isHeader =
                line.startsWith("WEBVTT") || line.startsWith("NOTE");
              const isTime = line.includes("-->");
              const isEmpty = line.trim() === "";
              const isNumber = /^\d+$/.test(line.trim());
              return !isHeader && !isTime && !isEmpty && !isNumber;
            })
            .map((line) => line.replace(/<[^>]*>/g, "").trim())
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (cleanText.length >= 50) {
            return cleanText;
          }
        }
      } catch (err) {
        console.warn(
          `[Invidious Fallback] Instance ${uri} failed: ${err.message}`,
        );
      }
    }
  } catch (err) {
    console.error(
      `[Invidious Fallback] Failed to fetch Invidious instances list: ${err.message}`,
    );
  }
  return null;
};

const downloadYoutubeAudioForDeepgram = async (videoId) => {
  const outputPath = path.join(
    os.tmpdir(),
    `deepgram_yt_${videoId}_${Date.now()}.mp3`,
  );

  const ytdl = require("@distube/ytdl-core");
  console.log(`[Deepgram] Downloading audio for video ${videoId}...`);

  return new Promise((resolve, reject) => {
    const stream = ytdl(videoId, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    ffmpeg(stream)
      .audioBitrate(64)
      .format("mp3")
      .save(outputPath)
      .on("end", () => {
        console.log(`[Deepgram] Audio downloaded to ${outputPath}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error(`[Deepgram] Audio download failed: ${err.message}`);
        reject(err);
      });
  });
};

const transcribeWithDeepgramFile = async (filePath) => {
  if (!DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY is not configured");
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  const response = await axios.post(
    "https://api.deepgram.com/v1/listen?model=general&language=en&punctuate=true",
    form,
    {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    },
  );

  const transcript =
    response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
  if (!transcript) {
    throw new Error("Deepgram response did not contain a transcript");
  }

  return transcript.trim();
};

const transcribeYoutubeWithDeepgram = async (videoUrl) => {
  if (!DEEPGRAM_API_KEY) {
    console.log(
      "[Deepgram] DEEPGRAM_API_KEY not set; skipping Deepgram transcription.",
    );
    return null;
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL — could not extract video ID");
  }

  let audioPath;
  try {
    audioPath = await downloadYoutubeAudioForDeepgram(videoId);
    return await transcribeWithDeepgramFile(audioPath);
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
};

/**
 * Get transcript text from YouTube video using multiple robust extractors (YTDL, local scraper, Invidious)
 * @param {string} videoUrl
 * @returns {Promise<string>} — transcript
 */
const getYoutubeTranscript = async (videoUrl) => {
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    throw new Error("Invalid YouTube URL — could not extract video ID");
  }

  console.log(`Fetching transcript for video: ${videoId}`);

  // ── Attempt 1: ytdl-core InnerTube timedtext extractor (Highest Reliability) ──
  const ytdlTranscript = await fetchYtdlTranscript(videoId);
  if (ytdlTranscript && ytdlTranscript.length >= 50) {
    console.log(
      `✅ Transcript fetched via YTDL InnerTube: ${ytdlTranscript.length} chars`,
    );
    return ytdlTranscript;
  }

  // ── Attempt 2: youtube-transcript package (Standard local scraper) ──
  console.log(`[youtube-transcript] Trying standard scraper package...`);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (transcriptItems && transcriptItems.length > 0) {
        const fullTranscript = transcriptItems
          .map((item) => item.text)
          .join(" ")
          .replace(/\[.*?\]/g, "") // Remove [Music], [Applause] etc.
          .replace(/\s+/g, " ")
          .trim();

        if (fullTranscript && fullTranscript.length >= 50) {
          console.log(
            `✅ Transcript fetched via youtube-transcript: ${fullTranscript.length} chars`,
          );
          return fullTranscript;
        }
      }
    } catch (err) {
      console.warn(
        `[youtube-transcript] Attempt ${attempt} failed: ${err.message}`,
      );
      if (attempt < 2) await sleep(1000);
    }
  }

  // ── Attempt 3: Dynamic Invidious Captions Fallback (IP-Free Backup) ──
  console.log(
    `[Invidious Fallback] Standard scrapers rate-limited. Falling back to dynamic Invidious captions fetch...`,
  );
  const invidiousTranscript = await fetchInvidiousTranscript(videoId);
  if (invidiousTranscript && invidiousTranscript.length >= 50) {
    console.log(
      `✅ Transcript fetched via Invidious Fallback: ${invidiousTranscript.length} chars`,
    );
    return invidiousTranscript;
  }

  // ── Attempt 4: Deepgram Audio Transcription Fallback ──
  console.log(`[Deepgram] Attempting audio transcription fallback...`);
  try {
    const deepgramTranscript = await transcribeYoutubeWithDeepgram(videoUrl);
    if (deepgramTranscript && deepgramTranscript.length >= 50) {
      console.log(
        `✅ Transcript fetched via Deepgram: ${deepgramTranscript.length} chars`,
      );
      return deepgramTranscript;
    }
  } catch (err) {
    console.warn(`[Deepgram] Fallback failed: ${err.message}`);
  }

  // No generic fallback: if transcript cannot be extracted, fail explicitly.
  throw new Error(
    "Could not extract a real transcript from this YouTube video. Please ensure the video has captions or a supported audio stream.",
  );
};

/**
 * Get video title
 */
const getVideoTitle = async (videoUrl) => {
  const details = await getVideoDetails(videoUrl);
  return details.title;
};

/**
 * Legacy stub — kept for backward compatibility
 */
const downloadYoutubeAudio = async (videoUrl) => {
  throw new Error(
    "downloadYoutubeAudio is deprecated. Use getYoutubeTranscript() instead.",
  );
};

module.exports = {
  downloadYoutubeAudio,
  getVideoTitle,
  getVideoDetails,
  getYoutubeTranscript,
  extractVideoId,
};
