import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import progressService from '../services/progressService';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);
    const [stats, setStats] = useState({
        completedCount: 0,
        avgScore: 0,
        totalQuizzes: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        const s = await progressService.getStats();
        setStats(s);
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.name}>{user?.name || 'User Name'}</Text>
                        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
                        </View>
                    </View>
                </View>

                {/* Vertical absolute back button or shift it? Keeping as is but might overlap if row. */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.completedCount}</Text>
                    <Text style={styles.statLabel}>Certificates</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.avgScore}%</Text>
                    <Text style={styles.statLabel}>Avg Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stats.totalQuizzes}</Text>
                    <Text style={styles.statLabel}>Quizzes</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color="#333" />
                    <Text style={styles.menuText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={logout}>
                    <Ionicons name="log-out-outline" size={24} color="#ff4444" />
                    <Text style={[styles.menuText, { color: '#ff4444' }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        elevation: 5,
        paddingTop: 50, // Space for status bar
        paddingBottom: 20,
        paddingHorizontal: 20
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 5,
        zIndex: 10,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6200ee',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#e0e0ff',
        marginRight: 20
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e0e0ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: '#6200ee',
        fontWeight: 'bold',
        fontSize: 10,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 15,
        elevation: 2,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#eee',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        marginLeft: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    menuText: {
        flex: 1,
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
    }
});

export default ProfileScreen;
