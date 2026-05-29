/**
 * MyLearningCard.js — Premium glassmorphic course card (Netflix/Coursera style)
 * Shows course thumbnail, progress ring, teacher, deadlines, and CTA
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from './ProgressRing';

const { width: screenWidth } = Dimensions.get('window');

const MyLearningCard = ({ course, onPress, onFavoriteToggle, isFavorited = false }) => {
    const [imageLoading, setImageLoading] = useState(true);

    const getTimeUntilDeadline = (dateStr) => {
        const now = new Date();
        const deadline = new Date(dateStr);
        const diff = deadline - now;
        if (diff <= 0) return 'Overdue';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    const getDeadlineColor = (dateStr) => {
        const now = new Date();
        const deadline = new Date(dateStr);
        const diff = deadline - now;
        const days = diff / (1000 * 60 * 60 * 24);
        if (days <= 0) return '#EF4444';
        if (days <= 2) return '#F59E0B';
        return '#10B981';
    };

    const nearestDeadline = (course.deadlines || [])
        .filter(d => new Date(d.date) > new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    const isCompleted = course.progress >= 100;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(course)}
            activeOpacity={0.85}
        >
            {/* Thumbnail Section */}
            <View style={styles.thumbnailContainer}>
                {imageLoading && (
                    <ActivityIndicator
                        size="small"
                        color="#6366F1"
                        style={styles.loadingIndicator}
                    />
                )}
                <Image
                    source={{ uri: course.thumbnail }}
                    style={styles.thumbnail}
                    onLoadEnd={() => setImageLoading(false)}
                />

                {/* Gradient Overlay */}
                <View style={styles.gradientOverlay} />

                {/* Category Badge */}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{course.category}</Text>
                </View>

                {/* Favorite Button */}
                <TouchableOpacity
                    style={[styles.favoriteBtn, isFavorited && styles.favoriteBtnActive]}
                    onPress={() => onFavoriteToggle?.(course.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name={isFavorited ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isFavorited ? '#EF4444' : '#fff'}
                    />
                </TouchableOpacity>

                {/* Completion Badge */}
                {isCompleted && (
                    <View style={styles.completionBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.completionText}>Completed</Text>
                    </View>
                )}

                {/* Last Watched Overlay */}
                {!isCompleted && course.lastWatchedLecture && (
                    <View style={styles.lastWatchedOverlay}>
                        <Ionicons name="play-circle" size={14} color="#A5B4FC" />
                        <Text style={styles.lastWatchedText} numberOfLines={1}>
                            {course.lastWatchedLecture.title}
                        </Text>
                    </View>
                )}
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Title & Progress */}
                <View style={styles.titleRow}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
                        <Text style={styles.teacherName}>
                            <Ionicons name="person" size={11} color="#64748B" /> {course.teacher}
                        </Text>
                    </View>
                    <ProgressRing progress={course.progress} size={50} strokeWidth={3} fontSize={11} />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="videocam" size={12} color="#64748B" />
                        <Text style={styles.statText}>{course.totalLectures} lectures</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Ionicons name="time" size={12} color="#64748B" />
                        <Text style={styles.statText}>{course.duration}</Text>
                    </View>
                    {nearestDeadline && (
                        <>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Ionicons name="alarm" size={12} color={getDeadlineColor(nearestDeadline.date)} />
                                <Text style={[styles.statText, { color: getDeadlineColor(nearestDeadline.date) }]}>
                                    {getTimeUntilDeadline(nearestDeadline.date)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Deadline Warning */}
                {nearestDeadline && (
                    <View style={[styles.deadlineChip, { borderColor: getDeadlineColor(nearestDeadline.date) }]}>
                        <Ionicons name="alert-circle" size={12} color={getDeadlineColor(nearestDeadline.date)} />
                        <Text style={[styles.deadlineText, { color: getDeadlineColor(nearestDeadline.date) }]} numberOfLines={1}>
                            {nearestDeadline.title}
                        </Text>
                    </View>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                    style={[styles.ctaButton, isCompleted && styles.ctaButtonCompleted]}
                    onPress={() => onPress?.(course)}
                    activeOpacity={0.9}
                >
                    <Ionicons
                        name={isCompleted ? 'trophy' : 'play'}
                        size={16}
                        color="#fff"
                    />
                    <Text style={styles.ctaText}>
                        {isCompleted ? 'View Certificate' : 'Continue Learning'}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        // Glassmorphism shadow
        boxShadow: '0px 8px 20px rgba(99, 102, 241, 0.15)',
        elevation: 10,
    },
    thumbnailContainer: {
        position: 'relative',
        width: '100%',
        height: 160,
        backgroundColor: '#0A0F26',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -10,
        marginLeft: -10,
        zIndex: 1,
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
        // Gradient simulation
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    categoryBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    favoriteBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    favoriteBtnActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    completionBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    completionText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
    },
    lastWatchedOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
    lastWatchedText: {
        color: '#A5B4FC',
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
    },
    contentSection: {
        padding: 14,
        gap: 10,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        color: '#F1F5F9',
        fontSize: 15,
        fontWeight: '800',
        lineHeight: 20,
        letterSpacing: -0.3,
    },
    teacherName: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '600',
    },
    statDivider: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#334155',
        marginHorizontal: 8,
    },
    deadlineChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    deadlineText: {
        fontSize: 11,
        fontWeight: '700',
        flex: 1,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366F1',
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 2,
    },
    ctaButtonCompleted: {
        backgroundColor: '#10B981',
    },
    ctaText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },
});

export default MyLearningCard;
