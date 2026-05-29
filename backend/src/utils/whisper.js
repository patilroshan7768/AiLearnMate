/**
 * Audio Transcription Utility
 * Uses Google Gemini 2.5 Flash for audio/video transcription (FREE)
 * Falls back to ffmpeg text extraction where possible
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCZ8fyIT3X1akltQ_AuYmKQgLz7SGkLg88';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Convert file to low bitrate MP3 for processing
 * @param {string} inputPath 
 * @returns {Promise<string>} - Path to converted file
 */
const convertToAudio = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);

        console.log(`Converting ${inputPath} to optimized audio...`);

        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate(32) // Low bitrate to keep file small
            .save(outputPath)
            .on('end', () => {
                console.log(`Conversion complete: ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('FFmpeg Conversion Error:', err);
                reject(err);
            });
    });
};

/**
 * Transcribe audio/video file using Gemini AI
 * @param {string} filePath - Absolute path to the audio/video file
 * @returns {Promise<string>} - Transcription text
 */
const transcribeAudio = async (filePath) => {
    let audioFilePath = filePath;
    let needsCleanup = false;

    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        const ext = path.extname(filePath).toLowerCase();

        console.log(`Transcribing file: ${path.basename(filePath)} (${fileSizeInMB.toFixed(2)}MB)`);

        // Convert video/large files to MP3
        if (fileSizeInMB > 18 || (ext !== '.mp3' && ext !== '.wav' && ext !== '.m4a')) {
            console.log(`Converting to MP3 for processing...`);
            audioFilePath = await convertToAudio(filePath);
            needsCleanup = true;
        }

        const convertedStats = fs.statSync(audioFilePath);
        const convertedSizeMB = convertedStats.size / (1024 * 1024);
        console.log(`Audio ready: ${convertedSizeMB.toFixed(2)}MB`);

        if (convertedSizeMB > 20) {
            throw new Error(`Audio file too large (${convertedSizeMB.toFixed(1)}MB). Please use a shorter video (under 30 minutes).`);
        }

        // Read file as base64 for Gemini inline data
        const audioData = fs.readFileSync(audioFilePath);
        const base64Audio = audioData.toString('base64');

        // Determine MIME type
        const mimeType = 'audio/mp3';

        console.log('Sending to Gemini for transcription...');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio,
                },
            },
            {
                text: `Please transcribe this audio file completely and accurately. 
Return ONLY the transcribed text, nothing else.
Do not add any commentary, timestamps, or formatting — just the raw speech content.`
            }
        ]);

        const transcription = result.response.text().trim();
        console.log(`Transcription complete: ${transcription.length} chars`);
        return transcription;

    } catch (error) {
        console.error('Transcription Error:', error.message);
        throw new Error(`Failed to transcribe audio: ${error.message}`);
    } finally {
        if (needsCleanup && fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
        }
    }
};

module.exports = { transcribeAudio, convertToAudio };
