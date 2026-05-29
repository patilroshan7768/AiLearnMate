/**
 * StreakCard.js — Daily learning streak tracker widget
 * Shows fire emoji, streak count, and week activity dots
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const StreakCard = ({ streak = { count: 0, weekActivity: [] } }) => {
    const fireScale = useRef(new Animated.Value(1)).current;
    const glowOpacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (streak.count > 0) {
            // Pulsing fire animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(fireScale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                    Animated.timing(fireScale, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();

            // Glow pulse
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowOpacity, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [streak.count]);

    const weekActivity = streak.weekActivity || [false, false, false, false, false, false, false];
    const todayIndex = new Date().getDay();

    return (
        <View style={styles.container}>
            {/* Glow background */}
            {streak.count > 0 && (
                <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
            )}

            <View style={styles.content}>
                {/* Left: Fire & Count */}
                <View style={styles.streakInfo}>
                    <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: fireScale }] }]}>
                        {streak.count > 0 ? '🔥' : '❄️'}
                    </Animated.Text>
                    <View>
                        <Text style={styles.streakCount}>{streak.count}</Text>
                        <Text style={styles.streakLabel}>Day Streak</Text>
                    </View>
                </View>

                {/* Right: Week Activity */}
                <View style={styles.weekContainer}>
                    {DAYS.map((day, index) => (
                        <View key={index} style={styles.dayColumn}>
                            <Text style={[styles.dayLabel, index === todayIndex && styles.todayLabel]}>
                                {day}
                            </Text>
                            <View style={[
                                styles.dayDot,
                                weekActivity[index] && styles.dayDotActive,
                                index === todayIndex && styles.dayDotToday,
                            ]}>
                                {weekActivity[index] && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Motivation text */}
            <Text style={styles.motivationText}>
                {streak.count === 0 ? 'Start learning to begin your streak!' :
                 streak.count < 3 ? 'Keep going! Build your habit! 💪' :
                 streak.count < 7 ? 'You\'re on fire! Almost a full week! 🚀' :
                 streak.count < 30 ? `${streak.count} days strong! Incredible! 🏆` :
                 'Legendary streak! You\'re unstoppable! 👑'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 107, 0, 0.08)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.2)',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        backgroundColor: 'rgba(255, 107, 0, 0.1)',
        borderRadius: 30,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    fireEmoji: {
        fontSize: 32,
    },
    streakCount: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FF6B00',
        letterSpacing: -1,
    },
    streakLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FB923C',
        marginTop: -2,
    },
    weekContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    dayColumn: {
        alignItems: 'center',
        gap: 4,
    },
    dayLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
    },
    todayLabel: {
        color: '#FF6B00',
    },
    dayDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayDotActive: {
        backgroundColor: 'rgba(255, 107, 0, 0.3)',
        borderColor: '#FF6B00',
    },
    dayDotToday: {
        borderColor: '#FF6B00',
        borderWidth: 2,
    },
    checkmark: {
        fontSize: 10,
        color: '#FF6B00',
        fontWeight: '900',
    },
    motivationText: {
        fontSize: 11,
        color: '#FB923C',
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default StreakCard;
