const cron = require("node-cron");
const YoutubeCache = require("../models/YoutubeCache");

cron.schedule("0 0 * * *", async () => {

    console.log("Refreshing YouTube Cache");

    await YoutubeCache.destroy({
        where: {}
    });

});