// End-to-end test: YouTube transcript + Gemini study material
require('dotenv').config();

async function testFull() {
  console.log('=== Testing YouTube Transcript Fetch ===');
  const { getYoutubeTranscript, getVideoDetails } = require('./src/utils/youtube');
  
  const testUrl = 'https://www.youtube.com/watch?v=Ke90Tje7VS0'; // React JS tutorial
  
  try {
    console.log('\n1. Getting video details...');
    const details = await getVideoDetails(testUrl);
    console.log('✅ Title:', details.title);
    console.log('   Channel:', details.channelName);
    console.log('   Thumbnail:', details.thumbnail ? 'OK' : 'MISSING');
    
    console.log('\n2. Getting transcript...');
    const transcript = await getYoutubeTranscript(testUrl);
    console.log('✅ Transcript length:', transcript.length, 'chars');
    console.log('   Preview:', transcript.slice(0, 200));
    
    console.log('\n3. Testing Gemini summary...');
    const { generateSummary } = require('./src/utils/openai');
    const summary = await generateSummary(transcript.slice(0, 3000));
    console.log('✅ Summary length:', summary.length, 'chars');
    console.log('   Preview:', summary.slice(0, 300));
    
    console.log('\n=== ALL TESTS PASSED ✅ ===');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error(err.stack);
  }
}

testFull();
