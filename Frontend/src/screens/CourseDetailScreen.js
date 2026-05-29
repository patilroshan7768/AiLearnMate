import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Alert,
    ActivityIndicator,
    Linking,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform
} from 'react-native';
import progressService from '../services/progressService';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';

const { width: screenWidth } = Dimensions.get('window');

const CourseDetailScreen = ({ route, navigation }) => {
    const { course } = route.params;
    const [isComplete, setIsComplete] = useState(false);
    const [lectures, setLectures] = useState([]);
    const [loadingLectures, setLoadingLectures] = useState(true);

    // Embedded Player States
    const [activeVideoUrl, setActiveVideoUrl] = useState(null);
    const [activePlaylistId, setActivePlaylistId] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        console.log("COURSE OBJECT:", course);
        console.log("PLAYLIST ID:", course.playlistId);
        console.log("COURSE ID:", course.id);
        checkCompletion();
        fetchLectures();
        // Initialize default player source
        if (course.isYouTube && (course.id || course.playlistId)) {
            setActivePlaylistId(course.id || course.playlistId);
        } else if (course.videoUrl) {
            setActiveVideoUrl(course.videoUrl);
        }
    }, []);

    // Fetch ALL individual videos from the playlist using the Official YouTube API
    const fetchLectures = async () => {
        try {
            setLoadingLectures(true);
            const courseId = course.course_id || course.id || course._id;

            // Check if it's a standard backend UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId || '');

            // 1. Handle YouTube Playlists (Via your Backend)
            if (!isUUID && (course.isYouTube || String(courseId).startsWith('PL'))) {
                const playlistId = course.playlistId || courseId;

                console.log(`[Backend API] Fetching playlist videos for: ${playlistId}`);

                // Import your service to make the call to your Node backend
                const { getPlaylistVideos } = require('../services/youtubeService');

                // This assumes you add a function to youtubeService that hits your backend
                const videos = await getPlaylistVideos(playlistId);

                if (videos && videos.length > 0) {
                    // Format the videos coming back from your backend
                    const playlistLectures = videos.map((video, index) => {
                        return {
                            id: video.videoId || `yt-${index}`,
                            title: video.title,
                            lecture_url: `https://www.youtube.com/watch?v=${video.videoId}`,
                            lecture_type: 'video',
                            duration: 'YouTube Video'
                        };
                    });

                    const activeLectures = playlistLectures.filter(lec => lec.title !== 'Private video' && lec.title !== 'Deleted video');
                    setLectures(activeLectures);
                } else {
                    setLectures([]);
                }
                return;
            }

            // 2. Standard Backend Course Fetch (For non-YouTube courses)
            const courseService = require('../services/courseService').default;
            const data = await courseService.getCourseLectures(courseId);
            if (data && data.data && data.data.lectures) {
                setLectures(data.data.lectures);
            }
        } catch (error) {
            console.log('[Playlist Fetch Error]:', error);
            setLectures([]);
        } finally {
            setLoadingLectures(false);
        }
    };

    const checkCompletion = async () => {
        const completed = await progressService.isCourseComplete(course.course_id || course.id || course._id);
        setIsComplete(completed);
    };

    const handleOpenInYouTube = () => {
        const urlToOpen = activeVideoUrl || `https://www.youtube.com/playlist?list=${activePlaylistId}`;
        if (urlToOpen) {
            Linking.openURL(urlToOpen).catch(() => Alert.alert('Error', 'Could not open YouTube'));
        }
    };

    // Helper to copy a URL to clipboard
    const handleCopyUrl = async (url) => {
    if (!url) return;

    await Clipboard.setStringAsync(url);

    setCopiedLink(true);

    setTimeout(() => {
        setCopiedLink(false);
    }, 2000);

    Alert.alert("Copied", "Video URL copied successfully");
};

    const handleMarkComplete = async () => {
        await progressService.markCourseComplete(course.course_id || course.id || course._id);
        setIsComplete(true);
        Alert.alert('Congratulations!', 'Course marked as complete. Check your certificate count on Home!');
    };

    const openVideo = (url) => {
        const videoToOpen = url || course.videoUrl;
        if (videoToOpen) {
            Linking.openURL(videoToOpen).catch(err => Alert.alert('Error', 'Could not open link'));
        } else {
            Alert.alert('No Video', 'This lecture does not have a video link.');
        }
    };

    const handleLaunchNotebook = () => {
        navigation.navigate('MainTabs', {
            screen: 'AI Tools',
            params: { courseId: course.course_id || course.id || course._id }
        });
    };

    // Copy video link handler
    const handleCopyVideoLink = async () => {
    const linkToCopy =
        activeVideoUrl ||
        `https://www.youtube.com/playlist?list=${activePlaylistId}`;

    if (!linkToCopy) return;

    await Clipboard.setStringAsync(linkToCopy);

    setCopiedLink(true);

    setTimeout(() => {
        setCopiedLink(false);
    }, 2000);

    Alert.alert("Copied", "Link copied successfully");
};

    // Extract YouTube embed URL if applicable
    const getEmbedUrl = () => {

        if (activeVideoUrl) {
            const match = activeVideoUrl.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/i
            );

            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
            }
        }

        if (activePlaylistId) {
            return `https://www.youtube.com/embed/videoseries?list=${activePlaylistId}&autoplay=1&rel=0`;
        }

        return null;
    };

    const embedUrl = getEmbedUrl();
    console.log("Playlist ID:", activePlaylistId);
    const isLargeScreen = Platform.OS === 'web' && screenWidth >= 1024;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {isLargeScreen ? (
                <View style={styles.desktopLayout}>
                    {/* LEFT COLUMN: Player, details, and NotebookLM callout */}
                    <View style={styles.leftColumn}>
                        {embedUrl ? (
                            <View style={{ marginBottom: 20 }}>
                                <View style={styles.webPlayerContainer}>
                                    <WebView
                                        style={styles.webPlayer}
                                        javaScriptEnabled={true}
                                        domStorageEnabled={true}
                                        allowsFullscreenVideo={true}
                                        allowsInlineMediaPlayback={true}
                                        originWhitelist={['*']}
                                        mediaPlaybackRequiresUserAction={false}
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
                                                        src="${embedUrl}" 
                                                        frameborder="0" 
                                                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture" 
                                                        allowfullscreen>
                                                    </iframe>
                                                </body>
                                                </html>
                                            `,
                                            baseUrl: 'https://localhost'
                                        }}
                                    />
                                </View>
                                <View style={styles.playerActionBar}>
                                    <Text style={styles.activeSourceText} numberOfLines={1}>
                                        🔗 {activeVideoUrl || `https://www.youtube.com/playlist?list=${activePlaylistId}`}
                                    </Text>
                                    <View style={styles.actionButtonsWrap}>
                                        <TouchableOpacity style={styles.youtubeRedirectBtn} onPress={handleOpenInYouTube}>
                                            <Ionicons name="open-outline" size={14} color="#EF4444" />
                                            <Text style={styles.youtubeRedirectText}>Open</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.copyLinkBtn} onPress={handleCopyVideoLink}>
                                            <Ionicons name={copiedLink ? "checkmark-circle" : "copy-outline"} size={14} color="#A5B4FC" />
                                            <Text style={styles.copyLinkBtnText}>{copiedLink ? "Copied" : "Copy"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) : null}

                        {/* Course Card Header */}
                        <View style={styles.headerCard}>
                            <View style={styles.categoryRow}>
                                <Text style={styles.categoryTag}>{course.category || 'General'}</Text>
                                {isComplete ? (
                                    <View style={styles.completedBadge}>
                                        <Ionicons name="checkmark-done" size={14} color="#10B981" />
                                        <Text style={styles.completedText}>Completed</Text>
                                    </View>
                                ) : null}
                            </View>

                            <Text style={styles.title}>{course.title}</Text>
                            <Text style={styles.description}>{course.description}</Text>

                            <View style={styles.headerActions}>
                                {course.videoUrl ? (
                                    <TouchableOpacity
                                        style={styles.watchIntroBtn}
                                        onPress={() => {
                                            if (Platform.OS === 'web') {
                                                setActiveVideoUrl(course.videoUrl);
                                                setActivePlaylistId(course.playlistId || course.id);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            } else {
                                                openVideo();
                                            }
                                        }}
                                    >
                                        <Ionicons name="play-circle" size={18} color="#FFFFFF" />
                                        <Text style={styles.watchIntroText}>Watch Intro Video</Text>
                                    </TouchableOpacity>
                                ) : null}

                                {!isComplete && (
                                    <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
                                        <Ionicons name="checkbox-outline" size={18} color="#10B981" />
                                        <Text style={styles.completeBtnText}>Mark Complete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* NotebookLM Callout Card */}
                        <View style={styles.notebookLMCard}>
                            <View style={styles.notebookHeader}>
                                <Text style={styles.notebookTitle}>🧠 Google NotebookLM Study Companion</Text>
                                <Text style={styles.notebookBadge}>AI POWERED</Text>
                            </View>
                            <Text style={styles.notebookDescription}>
                                Unlock the power of conversational study. Generate executive briefings, structured notes, collapsible concept maps, flashcards, quizzes, and ask questions directly to your AI Tutor!
                            </Text>
                            <TouchableOpacity style={styles.launchNotebookBtn} onPress={handleLaunchNotebook}>
                                <Text style={styles.launchNotebookBtnText}>🚀 Launch Interactive AI Notebook</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* RIGHT COLUMN: Recorded Lectures Sidebar (No Related Courses) */}
                    <View style={styles.rightColumn}>
                        <Text style={styles.sidebarHeader}>📹 Course Videos</Text>

                        {loadingLectures ? (
                            <View style={styles.loadingCenter}>
                                <ActivityIndicator size="small" color="#10B981" />
                            </View>
                        ) : lectures.length > 0 ? (
                            <View style={styles.sidebarLecturesContainer}>
                                {lectures.map((lecture, index) => (
    <View
        key={lecture.id || index}
        style={styles.lectureCard}
    >
        <View style={styles.lectureMeta}>
            <Text style={styles.lectureIndex}>
                Video {index + 1}
            </Text>

            <Text
                style={styles.lectureTitle}
                numberOfLines={2}
            >
                {lecture.title}
            </Text>

            <Text style={styles.lectureType}>
                YouTube Video
            </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
                style={styles.playBtn}
                onPress={() => {
                    setActiveVideoUrl(lecture.lecture_url);
                    setActivePlaylistId(null);
                }}
            >
                <Ionicons
                    name="play-circle"
                    size={32}
                    color="#EF4444"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={{ marginLeft: 12 }}
                onPress={() => handleCopyUrl(lecture.lecture_url)}
            >
                <Ionicons
                    name="copy-outline"
                    size={24}
                    color="#6366F1"
                />
            </TouchableOpacity>
        </View>
    </View>
))}
                            </View>
                        ) : (
                            <View style={styles.noLecturesBanner}>
                                <Ionicons name="tv-outline" size={16} color="#6366F1" />
                                <Text style={styles.noLecturesBannerText}>No videos found</Text>
                            </View>
                        )}
                    </View>
                </View>
            ) : (
                /* MOBILE LAYOUT (Sequential stacking) */
                <View>
                    {embedUrl ? (
                        <View style={{ marginBottom: 20 }}>
                            <View style={styles.webPlayerContainer}>
                                <WebView
                                    style={styles.webPlayer}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    allowsFullscreenVideo={true}
                                    allowsInlineMediaPlayback={true}
                                    originWhitelist={['*']}
                                    mediaPlaybackRequiresUserAction={false}
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
                                                    src="${embedUrl}" 
                                                    frameborder="0" 
                                                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture" 
                                                    allowfullscreen>
                                                </iframe>
                                            </body>
                                            </html>
                                        `,
                                        baseUrl: 'https://localhost'
                                    }}
                                />
                            </View>
                            <View style={styles.playerActionBar}>
                                <Text style={styles.activeSourceText} numberOfLines={1}>
                                    🔗 {activeVideoUrl || `https://www.youtube.com/playlist?list=${activePlaylistId}`}
                                </Text>

                                <View style={styles.actionButtonsWrap}>
                                    <TouchableOpacity style={styles.youtubeRedirectBtn} onPress={handleOpenInYouTube}>
                                        <Ionicons name="open-outline" size={14} color="#EF4444" />
                                        <Text style={styles.youtubeRedirectText}>Open</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.copyLinkBtn} onPress={handleCopyVideoLink}>
                                        <Ionicons name={copiedLink ? "checkmark-circle" : "copy-outline"} size={14} color="#A5B4FC" />
                                        <Text style={styles.copyLinkBtnText}>{copiedLink ? "Copied" : "Copy"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {/* Course Card Header */}
                    <View style={styles.headerCard}>
                        <View style={styles.categoryRow}>
                            <Text style={styles.categoryTag}>{course.category || 'General'}</Text>
                            {isComplete ? (
                                <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark-done" size={14} color="#10B981" />
                                    <Text style={styles.completedText}>Completed</Text>
                                </View>
                            ) : null}
                        </View>

                        <Text style={styles.title}>{course.title}</Text>
                        <Text style={styles.description}>{course.description}</Text>

                        <View style={styles.headerActions}>
                            {course.videoUrl ? (
                                <TouchableOpacity
                                    style={styles.watchIntroBtn}
                                    onPress={() => {
                                        if (Platform.OS === 'web') {
                                            setActiveVideoUrl(course.videoUrl);
                                            setActivePlaylistId(course.playlistId || course.id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        } else {
                                            openVideo();
                                        }
                                    }}
                                >
                                    <Ionicons name="play-circle" size={18} color="#FFFFFF" />
                                    <Text style={styles.watchIntroText}>Watch Intro Video</Text>
                                </TouchableOpacity>
                            ) : null}

                            {!isComplete && (
                                <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete}>
                                    <Ionicons name="checkbox-outline" size={18} color="#10B981" />
                                    <Text style={styles.completeBtnText}>Mark Complete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* NotebookLM Callout Card */}
                    <View style={styles.notebookLMCard}>
                        <View style={styles.notebookHeader}>
                            <Text style={styles.notebookTitle}>🧠 Google NotebookLM Study Companion</Text>
                            <Text style={styles.notebookBadge}>AI POWERED</Text>
                        </View>
                        <Text style={styles.notebookDescription}>
                            Unlock the power of conversational study. Generate executive briefings, structured notes, collapsible concept maps, flashcards, quizzes, and ask questions directly to your AI Tutor!
                        </Text>
                        <TouchableOpacity style={styles.launchNotebookBtn} onPress={handleLaunchNotebook}>
                            <Text style={styles.launchNotebookBtnText}>🚀 Launch Interactive AI Notebook</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Lectures Section */}
                    <Text style={styles.sectionHeader}>📹 Course Videos</Text>

                    {loadingLectures ? (
                        <View style={styles.loadingCenter}>
                            <ActivityIndicator size="small" color="#10B981" />
                        </View>
                    ) : lectures.length > 0 ? (
                        <View style={styles.lecturesContainer}>
                            <View style={styles.lecturesContainer}>
    {lectures.map((lecture, index) => (
        <View
            key={lecture.id || index}
            style={styles.lectureCard}
        >
            <View style={styles.lectureMeta}>
                <Text style={styles.lectureIndex}>
                    Video {index + 1}
                </Text>

                <Text
                    style={styles.lectureTitle}
                    numberOfLines={2}
                >
                    {lecture.title}
                </Text>

                <Text style={styles.lectureType}>
                    YouTube Video
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => {
                        setActiveVideoUrl(lecture.lecture_url);
                        setActivePlaylistId(null);
                    }}
                >
                    <Ionicons
                        name="play-circle"
                        size={32}
                        color="#EF4444"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ marginLeft: 12 }}
                    onPress={() => handleCopyUrl(lecture.lecture_url)}
                >
                    <Ionicons
                        name="copy-outline"
                        size={24}
                        color="#6366F1"
                    />
                </TouchableOpacity>
            </View>
        </View>
    ))}
</View>
                        </View>
                    ) : (
                        <View>
                            <View style={styles.noLecturesBanner}>
                                <Ionicons name="tv-outline" size={20} color="#6366F1" />
                                <Text style={styles.noLecturesBannerText}>No videos found</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0F19',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    webPlayerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#1E293B',
        marginBottom: 20,
        backgroundColor: '#000',
        ...Platform.select({
            web: {
                boxShadow: '0px 15px 45px rgba(99, 102, 241, 0.22)',
            }
        })
    },
    webPlayer: {
        width: '100%',
        height: '100%',
    },
    headerCard: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginBottom: 20,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryTag: {
        fontSize: 11,
        fontWeight: '800',
        color: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        textTransform: 'uppercase',
    },

    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    completedText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '800',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 22,
        marginBottom: 20,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    watchIntroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    watchIntroText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    completeBtnText: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '700',
    },
    notebookLMCard: {
        backgroundColor: '#1E1B4B',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#4338CA',
        marginBottom: 24,
    },
    notebookHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        gap: 8,
    },
    notebookTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
        color: '#C084FC',
    },
    notebookBadge: {
        flexShrink: 0,
        fontSize: 8,
        fontWeight: '900',
        color: '#FFFFFF',
        backgroundColor: '#6B21A8',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 2,
    },
    notebookDescription: {
        fontSize: 12,
        color: '#A5B4FC',
        lineHeight: 18,
        marginBottom: 16,
    },
    launchNotebookBtn: {
        backgroundColor: '#6366F1',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        boxShadow: '0px 4px 6px rgba(99, 102, 241, 0.3)',
    },
    launchNotebookBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    loadingCenter: {
        padding: 30,
        alignItems: 'center',
    },
    lecturesContainer: {
        gap: 10,
    },
    lectureCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    lectureMeta: {
    flex: 1,
    gap: 4,
    marginRight: 12,
},
    lectureIndex: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
    },
    lectureTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    lectureType: {
        fontSize: 11,
        color: '#64748B',
    },
    playBtn: {
        paddingLeft: 10,
    },
    noLecturesCard: {
        backgroundColor: '#0F172A',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
        alignItems: 'center',
    },
    noLecturesText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    noLecturesBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(99,102,241,0.1)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(99,102,241,0.3)',
    },
    noLecturesBannerText: {
        flex: 1,
        fontSize: 12,
        color: '#A5B4FC',
        fontWeight: '600',
    },
    playerActionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#1E293B',
        marginTop: -10,
        gap: 8,
    },
    activeSourceText: {
        flex: 1,
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    },
    actionButtonsWrap: {
        flexDirection: 'row',
        gap: 6,
    },
    youtubeRedirectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    youtubeRedirectText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: '700',
    },
    copyLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    copyLinkBtnText: {
        color: '#A5B4FC',
        fontSize: 10,
        fontWeight: '700',
    },
    desktopLayout: {
        flexDirection: 'row',
        gap: 24,
        width: '100%',
        alignItems: 'flex-start',
    },
    leftColumn: {
        flex: 3,
        minWidth: 0,
    },
    rightColumn: {
        flex: 2,
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        minWidth: 320,
    },
    sidebarHeader: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 10,
    },
    sidebarLecturesContainer: {
        gap: 12,
    },
    sidebarLectureCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sidebarLectureTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    }
});

export default CourseDetailScreen;