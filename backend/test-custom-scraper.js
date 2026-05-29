const axios = require('axios');

async function testDynamicInvidiousTranscript(videoId) {
    console.log('[Invidious Dynamic] Fetching healthy instances...');
    try {
        const instancesResponse = await axios.get('https://api.invidious.io/instances.json?sort_by=type,health');
        const instances = instancesResponse.data;
        
        // Filter using correct object paths
        const healthyInstances = instances
            .filter(item => {
                const stats = item[1];
                return stats.type === 'https' && 
                       stats.monitor && 
                       stats.monitor.down === false && 
                       stats.monitor.uptime > 98;
            })
            .map(item => item[1].uri);

        console.log(`[Invidious Dynamic] Found ${healthyInstances.length} healthy HTTPS instances.`);

        for (const uri of healthyInstances.slice(0, 8)) {
            try {
                console.log(`[Invidious Dynamic] Querying: ${uri}/api/v1/captions/${videoId}?lang=en`);
                const response = await axios.get(`${uri}/api/v1/captions/${videoId}?lang=en`, { timeout: 6000 });
                const vtt = response.data;
                
                if (vtt && typeof vtt === 'string' && vtt.includes('WEBVTT')) {
                    console.log(`[Invidious Dynamic] SUCCESS from ${uri}!`);
                    const lines = vtt.split('\n');
                    const cleanText = lines
                        .filter(line => {
                            const isHeader = line.startsWith('WEBVTT') || line.startsWith('NOTE');
                            const isTime = line.includes('-->');
                            const isEmpty = line.trim() === '';
                            const isNumber = /^\d+$/.test(line.trim());
                            return !isHeader && !isTime && !isEmpty && !isNumber;
                        })
                        .map(line => line.replace(/<[^>]*>/g, '').trim())
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    if (cleanText.length >= 50) {
                        console.log(`[Invidious Dynamic] Extracted ${cleanText.length} characters.`);
                        console.log(`First 300 chars: ${cleanText.slice(0, 300)}`);
                        return cleanText;
                    }
                }
            } catch (err) {
                console.warn(`[Invidious Dynamic] URI ${uri} failed: ${err.message}`);
            }
        }

    } catch (error) {
        console.error(`[Invidious Dynamic] Main execution failed:`, error.message);
    }
}

// Test with known working video Ke90Tje7VS0
testDynamicInvidiousTranscript('Ke90Tje7VS0');
