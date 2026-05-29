const axios = require('axios');
const cheerio = require('cheerio');

axios.get("https://www.youtube.com/watch?v=Ke90Tje7VS0", {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
})
.then(res => {
  const $ = cheerio.load(res.data);
  const title = $('title').text();
  console.log("Scraped Title:", title);
})
.catch(err => {
  console.error("FAIL:", err.message);
});
