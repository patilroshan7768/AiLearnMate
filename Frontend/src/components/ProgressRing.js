/**
 * ProgressRing.js — Animated circular progress indicator
 * Uses View-based ring with percentage display
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ProgressRing = ({ 
    progress = 0, 
    size = 56, 
    strokeWidth = 4, 
    color = '#6366F1', 
    bgColor = 'rgba(255,255,255,0.08)',
    textColor = '#FFFFFF',
    fontSize = 13,
    showPercentage = true 
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: progress,
            duration: 1200,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const getProgressColor = (pct) => {
        if (pct >= 100) return '#10B981';
        if (pct >= 75) return '#22D3EE';
        if (pct >= 50) return '#6366F1';
        if (pct >= 25) return '#F59E0B';
        return '#EF4444';
    };

    const activeColor = color === '#6366F1' ? getProgressColor(progress) : color;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Background ring */}
            <View style={[styles.ring, { 
                width: size, 
                height: size, 
                borderRadius: size / 2, 
                borderWidth: strokeWidth,
                borderColor: bgColor,
            }]} />
            
            {/* Progress overlay - using border trick */}
            <View style={[styles.progressRing, { 
                width: size, 
                height: size, 
                borderRadius: size / 2, 
                borderWidth: strokeWidth,
                borderColor: activeColor,
                borderRightColor: progress > 75 ? activeColor : 'transparent',
                borderBottomColor: progress > 50 ? activeColor : 'transparent',
                borderLeftColor: progress > 25 ? activeColor : 'transparent',
                transform: [{ rotate: '-45deg' }],
            }]} />

            {/* Percentage text */}
            {showPercentage && (
                <View style={styles.textContainer}>
                    <Text style={[styles.percentText, { color: textColor, fontSize }]}>
                        {Math.round(progress)}%
                    </Text>
                </View>
            )}

            {/* Glow effect for high progress */}
            {progress >= 75 && (
                <View style={[styles.glow, { 
                    width: size + 8, 
                    height: size + 8, 
                    borderRadius: (size + 8) / 2,
                    boxShadow: `0px 0px 8px ${activeColor}`,
                }]} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
    },
    progressRing: {
        position: 'absolute',
    },
    textContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentText: {
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    glow: {
        position: 'absolute',
        elevation: 0,
    },
});

export default ProgressRing;
