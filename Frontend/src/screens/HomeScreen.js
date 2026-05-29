import React, { useContext, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import courseService from '../services/courseService';
import progressService from '../services/progressService';

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        courses: 0,
        avgScore: 0,
        certificates: 0
    });

    const fetchStats = async () => {
        try {
            const response = await courseService.getAllCourses();
            let list = [];
            // Handle different possible structures from API
            if (Array.isArray(response)) {
                list = response;
            } else if (response.data && Array.isArray(response.data)) {
                list = response.data;
            } else if (response.data && response.data.courses && Array.isArray(response.data.courses)) {
                list = response.data.courses; // Correct path based on your logs
            } else if (response.courses && Array.isArray(response.courses)) {
                list = response.courses;
            }

            // Fetch user progress (local for now)
            const userProgress = await progressService.getStats();

            setStats({
                courses: list.length,
                avgScore: userProgress.avgScore,
                certificates: userProgress.completedCount
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
            }
        >
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.username}>{user?.name?.split(' ')[0] || 'Learner'}</Text>
                    <Text style={styles.roleLabel}>({user?.role || 'No Role'})</Text>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Profile')} >
                    <Ionicons name="person-circle-outline" size={45} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {/* Stats Card (Dynamic) */}
            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.courses}</Text>
                    <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.avgScore}%</Text>
                    <Text style={styles.statLabel}>Avg Score</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.certificates}</Text>
                    <Text style={styles.statLabel}>Certificates</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>



            {/* ADMIN ACTIONS */}
            {(user?.role || 'student').toLowerCase() === 'admin' && (
                <View style={styles.gridContainer}>
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#F3E8FF', width: '100%' }]}
                        onPress={() => navigation.navigate('AdminDashboard')}
                    >
                        <Ionicons name="analytics" size={32} color="#9333EA" />
                        <Text style={styles.cardTitle}>Admin Dashboard</Text>
                        <Text style={styles.cardSub}>View Stats, Users & Content</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* TEACHER ACTIONS (Hide if Admin to avoid clutter, or keep if Admin acts as Teacher too) */}
            {(user?.role || 'student').toLowerCase() === 'teacher' && (
                <View style={styles.gridContainer}>
                    {/* Create Course */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => navigation.navigate('CreateCourse')}
                    >
                        <Ionicons name="add-circle" size={32} color="#4F46E5" />
                        <Text style={styles.cardTitle}>Create Course</Text>
                        <Text style={styles.cardSub}>Upload Video</Text>
                    </TouchableOpacity>

                    {/* Teacher View: Manage/View Courses (All) */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#ECFDF5' }]}
                        onPress={() => navigation.navigate('Courses')}
                    >
                        <Ionicons name="library" size={32} color="#10B981" />
                        <Text style={styles.cardTitle}>My Content</Text>
                        <Text style={styles.cardSub}>View Analytics</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* STUDENT ACTIONS */}
            {(user?.role || 'student').toLowerCase() === 'student' && (
                <View style={styles.gridContainer}>
                    {/* 1. All Courses (Marketplace) */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => navigation.navigate('Courses')} // No filter = All
                    >
                        <Ionicons name="search" size={32} color="#4F46E5" />
                        <Text style={styles.cardTitle}>Explore</Text>
                        <Text style={styles.cardSub}>Find new courses</Text>
                    </TouchableOpacity>

                    {/* 2. My Learning (Enrolled) */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#ECFDF5' }]}
                        onPress={() => navigation.navigate('My Learning')}
                    >
                        <Ionicons name="book" size={32} color="#10B981" />
                        <Text style={styles.cardTitle}>My Learning</Text>
                        <Text style={styles.cardSub}>Continue courses</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* COMMON ACTIONS */}
            <View style={styles.gridContainer}>
                <TouchableOpacity
                    style={[styles.card, { backgroundColor: '#FDF2F8' }]}
                    onPress={() => navigation.navigate('AI Tools')}
                >
                    <Ionicons name="sparkles" size={32} color="#DB2777" />
                    <Text style={styles.cardTitle}>AI Assistant</Text>
                    <Text style={styles.cardSub}>Quiz, Summary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, { backgroundColor: '#FFF7ED' }]}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings" size={32} color="#EA580C" />
                    <Text style={styles.cardTitle}>Settings</Text>
                    <Text style={styles.cardSub}>Profile & More</Text>
                </TouchableOpacity>
            </View>


            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081120',
        paddingHorizontal: 18,
        paddingTop: 20,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 35,
        marginBottom: 28,
    },

    headerTextContainer: {
        flex: 1,
    },

    greeting: {
        fontSize: 18,
        color: '#94A3B8',
        fontWeight: '500',
        marginBottom: 4,
    },

    username: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -1,
    },

    roleLabel: {
        fontSize: 15,
        color: '#7C82FF',
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'capitalize',
    },

    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        borderRadius: 28,
        paddingVertical: 24,
        paddingHorizontal: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        elevation: 12,
    },

    statItem: {
        alignItems: 'center',
        flex: 1,
    },

    statNumber: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
    },

    statLabel: {
        color: '#94A3B8',
        fontSize: 13,
        marginTop: 6,
        fontWeight: '500',
    },

    divider: {
        width: 1,
        height: '75%',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },

    sectionTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 20,
        marginTop: 6,
        letterSpacing: -0.5,
    },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 4,
    },

    card: {
        width: '47%',
        paddingVertical: 24,
        paddingHorizontal: 18,
        borderRadius: 28,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        minHeight: 180,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },

    cardTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginTop: 20,
        lineHeight: 30,
    },

    cardSub: {
        fontSize: 15,
        color: '#4B5563',
        marginTop: 8,
        lineHeight: 22,
        fontWeight: '500',
    },

    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 35,
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
        backgroundColor: 'rgba(239,68,68,0.08)',
    },

    logoutText: {
        color: '#FF6B6B',
        fontWeight: '700',
        marginRight: 10,
        fontSize: 16,
    }
});
export default HomeScreen;

