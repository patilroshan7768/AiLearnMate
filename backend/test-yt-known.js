const { YoutubeTranscript } = require("youtube-transcript");
YoutubeTranscript.fetchTranscript("Ke90Tje7VS0")
  .then(res => {
    console.log("SUCCESS! Transcript items count:", res.length);
    console.log("First item:", res[0]);
  })
  .catch(err => {
    console.error("FAIL:", err.message || err);
  });
