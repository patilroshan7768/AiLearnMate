/**
 * SkeletonLoader.js — Reusable shimmer skeleton loading placeholders
 * Provides card and list item skeleton variants
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const ShimmerBlock = ({ width, height, borderRadius = 8, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#1E293B',
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Card skeleton for My Learning cards
const CardSkeleton = () => (
    <View style={styles.cardContainer}>
        {/* Thumbnail */}
        <ShimmerBlock width="100%" height={140} borderRadius={12} />
        
        {/* Content */}
        <View style={styles.cardContent}>
            <ShimmerBlock width="80%" height={16} borderRadius={4} />
            <ShimmerBlock width="50%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
            
            <View style={styles.cardRow}>
                <ShimmerBlock width={48} height={48} borderRadius={24} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <ShimmerBlock width="60%" height={10} borderRadius={4} />
                    <ShimmerBlock width="40%" height={10} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
            </View>
            
            <ShimmerBlock width="100%" height={36} borderRadius={8} style={{ marginTop: 12 }} />
        </View>
    </View>
);

// List item skeleton
const ListItemSkeleton = () => (
    <View style={styles.listItem}>
        <ShimmerBlock width={44} height={44} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <ShimmerBlock width="70%" height={14} borderRadius={4} />
            <ShimmerBlock width="45%" height={10} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <ShimmerBlock width={60} height={28} borderRadius={6} />
    </View>
);

// Hero banner skeleton
const HeroBannerSkeleton = () => (
    <View style={styles.heroBanner}>
        <ShimmerBlock width="100%" height={200} borderRadius={16} />
    </View>
);

// Stats bar skeleton
const StatsBarSkeleton = () => (
    <View style={styles.statsBar}>
        {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.statBlock}>
                <ShimmerBlock width={36} height={20} borderRadius={4} />
                <ShimmerBlock width={52} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
        ))}
    </View>
);

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const items = Array.from({ length: count }, (_, i) => i);

    switch (type) {
        case 'card':
            return items.map(i => <CardSkeleton key={i} />);
        case 'list':
            return items.map(i => <ListItemSkeleton key={i} />);
        case 'hero':
            return <HeroBannerSkeleton />;
        case 'stats':
            return <StatsBarSkeleton />;
        default:
            return items.map(i => <CardSkeleton key={i} />);
    }
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#0F172A',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cardContent: {
        padding: 14,
        gap: 4,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    heroBanner: {
        marginBottom: 20,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    statBlock: {
        alignItems: 'center',
        flex: 1,
    },
});

export { ShimmerBlock, CardSkeleton, ListItemSkeleton, HeroBannerSkeleton, StatsBarSkeleton };
export default SkeletonLoader;
