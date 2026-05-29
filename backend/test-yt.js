const { YoutubeTranscript } = require("youtube-transcript");
YoutubeTranscript.fetchTranscript("AGoy928iM7c")
  .then(res => {
    console.log("SUCCESS:", res.slice(0, 3));
  })
  .catch(err => {
    console.error("FAIL:", err.message || err);
  });
