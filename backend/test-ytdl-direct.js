const ytdl = require('@distube/ytdl-core');
const axios = require('axios');

async function run() {
    try {
        const info = await ytdl.getBasicInfo('Ke90Tje7VS0');
        const captions = info.player_response?.captions?.playerCaptionsTracklistRenderer;
        const tracks = captions.captionTracks;
        const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
        
        const xmlUrl = track.baseUrl.replace('&fmt=vtt', '');
        console.log('XML URL:', xmlUrl);
        
        const response = await axios.get(xmlUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/'
            },
            timeout: 8000
        });
        console.log('RESPONSE STATUS:', response.status, 'LENGTH:', response.data?.length);
        console.log('XML PREVIEW:', response.data ? response.data.slice(0, 300) : 'null');
    } catch (err) {
        console.error('ERROR:', err.message);
    }
}
run();
