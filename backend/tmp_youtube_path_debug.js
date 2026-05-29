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
    const startKey = "ytInitialData =";
    const start = html.indexOf(startKey);
    const jsonStart = html.indexOf("{", start);
    const jsonEnd = html.indexOf(";</script>", jsonStart);
    const data = JSON.parse(html.slice(jsonStart, jsonEnd));

    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents || [];
    const item0 = contents[0]?.itemSectionRenderer?.contents?.[0];
    console.log("item0 keys", Object.keys(item0 || {}));
    console.log(
      "lockupViewModel keys",
      Object.keys(item0?.lockupViewModel || {}),
    );
    const rows =
      item0?.lockupViewModel?.metadata?.lockupMetadataViewModel?.metadata
        ?.contentMetadataViewModel?.metadataRows || [];
    console.log("metadataRows", rows.length);
    rows.forEach((row, i) => {
      console.log("row", i, Object.keys(row));
      if (row.metadataParts) {
        row.metadataParts.forEach((part, j) => {
          console.log(
            " part",
            j,
            part.text ||
              part.commandRuns?.[0]?.onTap?.innertubeCommand?.watchEndpoint
                ?.playlistId ||
              part.commandRuns?.[0]?.onTap?.innertubeCommand?.commandMetadata
                ?.webCommandMetadata?.url ||
              "",
          );
        });
      }
    });
    const paths = [];

    const walk = (obj, path = []) => {
      if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj)) {
          if (
            key.toLowerCase().includes("playlist") ||
            String(obj[key]).toLowerCase().includes("playlist")
          ) {
            paths.push([...path, key]);
          }
          walk(obj[key], [...path, key]);
        }
      }
    };

    walk(item0, []);
    console.log("playlist-like paths found", paths.length);
    console.log(paths.slice(0, 40));
  } catch (err) {
    console.error("error", err.message);
  }
})();
