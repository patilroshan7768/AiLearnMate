/**
 * VideoPlayerScreen.js — Premium Netflix-style Video Player
 * Supports YouTube URLs (via WebView) and Direct URLs (via expo-av)
 * Features Playlist support, Playback speed, Bookmarks, and Watch history tracking.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import myLearningService from '../services/myLearningService';

const { width: screenWidth } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const VideoPlayerScreen = ({ route, navigation }) => {
    const { course, lecture: initialLecture, lectureIndex: initialIndex } = route.params;

    const [currentLecture, setCurrentLecture] = useState(initialLecture);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [speed, setSpeed] = useState(1.0);
    const [showSpeedModal, setShowSpeedModal] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [watchPosition, setWatchPosition] = useState(0);

    const player = useVideoPlayer(currentLecture.videoUrl || '', (player) => {
        player.playbackRate = speed;
        player.volume = 1.0;
        player.muted = false;
        player.timeUpdateEventInterval = 1.0;
        player.play();
    });

    const isYoutube = currentLecture.videoUrl?.includes('youtube.com') || currentLecture.videoUrl?.includes('youtu.be');

    // Load initial bookmark and watch position
    useEffect(() => {
        const fetchProgress = async () => {
            setLoading(true);
            const bookmarked = await myLearningService.isBookmarked(course.id, currentLecture.id);
            setIsBookmarked(bookmarked);

            const progress = await myLearningService.getWatchProgress(course.id, currentLecture.id);
            if (progress) {
                const pos = progress.position || 0;
                setWatchPosition(pos);
                if (player) {
                    player.currentTime = pos / 1000;
                }
            } else {
                setWatchPosition(0);
                if (player) {
                    player.currentTime = 0;
                }
            }
            if (player && currentLecture.videoUrl && !isYoutube) {
                player.replace(currentLecture.videoUrl);
                player.playbackRate = speed;
                player.play();
            }
            setLoading(false);
        };
        fetchProgress();
    }, [currentLecture, player]);

    // Synchronize playToEnd and timeUpdate event listeners
    useEffect(() => {
        if (!player) return;

        const timeSub = player.addListener('timeUpdate', () => {
            const currentMs = player.currentTime * 1000;
            const durationMs = player.duration * 1000;
            if (currentMs && durationMs) {
                myLearningService.updateWatchProgress(
                    course.id,
                    currentLecture.id,
                    currentMs,
                    durationMs
                );
                myLearningService.setLastWatched(
                    course.id,
                    currentLecture.id,
                    currentLecture.title,
                    currentMs
                );
            }
        });

        const endSub = player.addListener('playToEnd', () => {
            handleVideoEnd();
        });

        return () => {
            timeSub.remove();
            endSub.remove();
        };
    }, [player, currentLecture]);

    // Format Youtube URL to embed URL
    // Format Youtube URL to embed URL
    const getEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            // Notice the origin is now https://localhost
            return `https://www.youtube.com/embed/${match[2]}?autoplay=1&playsinline=1&controls=1&rel=0&showinfo=0&modestbranding=1&origin=https://localhost`;
        }
        return url;
    };
    const handleSpeedSelect = (selectedSpeed) => {
        setSpeed(selectedSpeed);
        setShowSpeedModal(false);
        if (player && !isYoutube) {
            player.playbackRate = selectedSpeed;
        }
    };

    const handleBookmarkToggle = async () => {
        const bookmarks = await myLearningService.toggleBookmark(course.id, currentLecture.id);
        const bookmarked = await myLearningService.isBookmarked(course.id, currentLecture.id);
        setIsBookmarked(bookmarked);
        Alert.alert('Success', bookmarked ? 'Lecture bookmarked!' : 'Bookmark removed!');
    };

    const handleLectureSelect = (lec, index) => {
        setCurrentLecture(lec);
        setCurrentIndex(index);
    };

    const handleVideoEnd = async () => {
        // Mark current as completed
        currentLecture.completed = true;
        await myLearningService.updateWatchProgress(course.id, currentLecture.id, 100, 100);
        await myLearningService.setLastWatched(course.id, currentLecture.id, currentLecture.title, 100);

        // Check if there is a next lecture
        if (currentIndex < course.lectures.length - 1) {
            const nextLec = course.lectures[currentIndex + 1];
            Alert.alert(
                'Lecture Finished',
                `Up next: ${nextLec.title}`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Play Next', onPress: () => handleLectureSelect(nextLec, currentIndex + 1) }
                ]
            );
        } else {
            Alert.alert('Congratulations!', 'You have finished all the lectures in this course!');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Back button */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle} numberOfLines={1}>{course.title}</Text>
            </View>

            {/* Video Player Section */}
            <View style={styles.playerContainer}>
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#6366F1" />
                    </View>
                ) : isYoutube ? (
                    
                    /* 👇 REPLACE YOUR EXISTING WEBVIEW WITH THIS NEW ONE 👇 */
                   <WebView
                        style={styles.webView}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        allowsInlineMediaPlayback={true}
                        originWhitelist={['*']} 
                        mediaPlaybackRequiresUserAction={false} 
                        
                        // 👇 THIS IS THE MAGIC LINE TO FIX ERROR 152 👇
                        userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                        
                        source={{ 
                            html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                    <style>
                                        body { margin: 0; background-color: #000; height: 100vh; overflow: hidden; display: flex; align-items: center; justify-content: center; }
                                        iframe { width: 100%; height: 100%; border: none; }
                                    </style>
                                </head>
                                <body>
                                    <iframe 
                                        src="${getEmbedUrl(currentLecture.videoUrl)}" 
                                        frameborder="0" 
                                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture" 
                                        allowfullscreen>
                                    </iframe>
                                </body>
                                </html>
                            `,
                            // 👇 CHANGE THIS TO LOCALHOST 👇
                            baseUrl: 'https://localhost' 
                        }}
                    />
                    /* 👆 END OF REPLACEMENT 👆 */

                ) : (
                    <VideoView
                        player={player}
                        style={styles.videoPlayer}
                        contentFit="contain"
                        nativeControls
                        allowsFullscreen
                    />
                )}
            </View>

            {/* Controller details */}
            <View style={styles.detailsRow}>
                <View style={styles.lectureInfo}>
                    <Text style={styles.lectureNumber}>LECTURE {currentIndex + 1}</Text>
                    <Text style={styles.lectureTitle}>{currentLecture.title}</Text>
                </View>
                <View style={styles.lectureActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleBookmarkToggle}>
                        <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={isBookmarked ? '#F59E0B' : '#94A3B8'} />
                        <Text style={[styles.actionBtnText, isBookmarked && { color: '#F59E0B' }]}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSpeedModal(true)}>
                        <Ionicons name="speedometer-outline" size={20} color="#94A3B8" />
                        <Text style={styles.actionBtnText}>{speed === 1.0 ? 'Normal' : `${speed}x`}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Speed Selector Modal/Dropdown overlay */}
            {showSpeedModal && (
                <View style={styles.speedOverlay}>
                    <View style={styles.speedSheet}>
                        <Text style={styles.speedSheetTitle}>Select Playback Speed</Text>
                        <View style={styles.speedGrid}>
                            {PLAYBACK_SPEEDS.map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.speedOption, speed === s && styles.speedOptionActive]}
                                    onPress={() => handleSpeedSelect(s)}
                                >
                                    <Text style={[styles.speedOptionText, speed === s && styles.speedOptionTextActive]}>
                                        {s === 1.0 ? 'Normal' : `${s}x`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.closeSpeedBtn} onPress={() => setShowSpeedModal(false)}>
                            <Text style={styles.closeSpeedBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Playlist lectures */}
            <View style={styles.playlistSection}>
                <Text style={styles.playlistTitle}>Course Playlist ({course.lectures?.length || 0} items)</Text>
                <ScrollView contentContainerStyle={styles.playlistScroll} showsVerticalScrollIndicator={false}>
                    {(course.lectures || []).map((lec, idx) => {
                        const isPlaying = lec.id === currentLecture.id;
                        return (
                            <TouchableOpacity
                                key={lec.id}
                                style={[
                                    styles.playlistItem,
                                    isPlaying && styles.playlistItemActive,
                                    lec.completed && styles.playlistItemCompleted
                                ]}
                                onPress={() => handleLectureSelect(lec, idx)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.lectureIdx, isPlaying && styles.lectureIdxPlaying, lec.completed && styles.lectureIdxDone]}>
                                    {lec.completed ? (
                                        <Ionicons name="checkmark" size={14} color="#10B981" />
                                    ) : isPlaying ? (
                                        <Ionicons name="play" size={14} color="#6366F1" />
                                    ) : (
                                        <Text style={styles.lectureIdxText}>{idx + 1}</Text>
                                    )}
                                </View>
                                <View style={styles.playlistMeta}>
                                    <Text style={[styles.playlistLecTitle, isPlaying && styles.playlistLecTitlePlaying]} numberOfLines={1}>
                                        {lec.title}
                                    </Text>
                                    <Text style={styles.playlistLecDur}>{lec.duration}</Text>
                                </View>
                                {isPlaying ? (
                                    <View style={styles.nowPlayingBadge}>
                                        <Text style={styles.nowPlayingText}>PLAYING</Text>
                                    </View>
                                ) : (
                                    <Ionicons name="play-circle-outline" size={22} color="#475569" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070A13' },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    backBtn: { padding: 6, marginRight: 8 },
    topBarTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '800', flex: 1 },

    playerContainer: { width: screenWidth, height: (screenWidth * 9) / 16, backgroundColor: '#000', position: 'relative' },
    videoPlayer: { width: '100%', height: '100%' },
    webView: { width: '100%', height: '100%', backgroundColor: '#000' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    absoluteLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },

    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    lectureInfo: { flex: 1, marginRight: 16 },
    lectureNumber: { color: '#6366F1', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    lectureTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '800', marginTop: 4 },
    lectureActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionBtn: { alignItems: 'center', gap: 4 },
    actionBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },

    playlistSection: { flex: 1, padding: 16 },
    playlistTitle: { color: '#F1F5F9', fontSize: 14, fontWeight: '800', marginBottom: 12 },
    playlistScroll: { gap: 8 },
    playlistItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    playlistItemActive: { borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.06)' },
    playlistItemCompleted: { opacity: 0.8 },
    lectureIdx: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    lectureIdxPlaying: { backgroundColor: 'rgba(99,102,241,0.15)' },
    lectureIdxDone: { backgroundColor: 'rgba(16,185,129,0.15)' },
    lectureIdxText: { color: '#64748B', fontSize: 11, fontWeight: '800' },
    playlistMeta: { flex: 1 },
    playlistLecTitle: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
    playlistLecTitlePlaying: { color: '#A5B4FC', fontWeight: '800' },
    playlistLecDur: { color: '#475569', fontSize: 10, marginTop: 2, fontWeight: '600' },
    nowPlayingBadge: { backgroundColor: '#6366F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    nowPlayingText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

    speedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
    speedSheet: { backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 18 },
    speedSheetTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '800', textAlign: 'center' },
    speedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    speedOption: { width: (screenWidth - 78) / 3, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    speedOptionActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#6366F1' },
    speedOptionText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
    speedOptionTextActive: { color: '#A5B4FC', fontWeight: '800' },
    closeSpeedBtn: { backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
    closeSpeedBtnText: { color: '#F1F5F9', fontSize: 14, fontWeight: '800' },
});

export default VideoPlayerScreen;
