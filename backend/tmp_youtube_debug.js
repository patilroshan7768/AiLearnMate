const axios = require("axios");
const cheerio = require("cheerio");

(async () => {
  const query = "python tutorial course playlist";
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%3D%3D`;
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
      timeout: 15000,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const scripts = $("script")
      .toArray()
      .map((el) => $(el).html())
      .filter((text) => text && text.includes("ytInitialData"));

    console.log("scripts", scripts.length);
    if (scripts.length) {
      console.log("first 500 chars:", scripts[0].slice(0, 500));
    }

    const startKey = "ytInitialData =";
    const start = html.indexOf(startKey);
    console.log("start", start);
    if (start === -1) return;
    const jsonStart = html.indexOf("{", start);
    const jsonEnd = html.indexOf(";</script>", jsonStart);
    console.log("jsonStart", jsonStart, "jsonEnd", jsonEnd);
    if (jsonStart === -1 || jsonEnd === -1) return;
    const jsonText = html.slice(jsonStart, jsonEnd);
    const data = JSON.parse(jsonText);
    console.log(
      "primary contents exists",
      !!data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents,
    );
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents || [];
    console.log(
      "content items",
      Array.isArray(contents) ? contents.length : "no",
    );
    for (const [index, content] of contents.entries()) {
      const keys = Object.keys(content || {});
      console.log("section", index, keys);
      const items = content?.itemSectionRenderer?.contents || [];
      console.log(" item count", items.length);
      if (items.length && index === 0) {
        const item0 = items[0];
        console.log("item sample keys", Object.keys(item0 || {}));
        const itemJson = JSON.stringify(item0, null, 2);
        console.log("contains playlist?", itemJson.includes("playlist"));
        console.log("item sample snippet", itemJson.slice(0, 800));
      }
    }

    const playlistRenderers = [];
    const walk = (obj, path = []) => {
      if (obj && typeof obj === "object") {
        if (obj.playlistRenderer) {
          playlistRenderers.push({ path, renderer: obj.playlistRenderer });
        }
        for (const key of Object.keys(obj)) {
          walk(obj[key], path.concat(key));
        }
      }
    };
    walk(data);
    console.log("found playlistRenderer count", playlistRenderers.length);
    if (playlistRenderers.length > 0) {
      console.log("sample path", playlistRenderers[0].path.slice(0, 10));
      console.log(
        "sample renderer keys",
        Object.keys(playlistRenderers[0].renderer),
      );
    }
  } catch (err) {
    console.error("error", err.message);
  }
})();
