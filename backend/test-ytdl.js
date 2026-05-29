const ytdl = require('@distube/ytdl-core');
ytdl.getBasicInfo("AGoy928iM7c")
  .then(info => {
    console.log("SUCCESS:", info.videoDetails.title);
  })
  .catch(err => {
    console.error("FAIL:", err.message || err);
  });
