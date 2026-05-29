import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Image, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);
    const [isDark, setIsDark] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);

    if (!user) {
        return <View style={styles.container}><ActivityIndicator /></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
                <Text style={styles.name}>{user.name || 'User'}</Text>
                <Text style={styles.email}>{user.email || 'user@example.com'}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{user.role ? user.role.toUpperCase() : 'STUDENT'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>

                <View style={styles.row}>
                    <View style={styles.iconRow}>
                        <Ionicons name="moon-outline" size={22} color="#4F46E5" />
                        <Text style={styles.rowLabel}>Dark Mode</Text>
                    </View>
                    <Switch
                        value={isDark}
                        onValueChange={setIsDark}
                        trackColor={{ false: "#767577", true: "#818cf8" }}
                        thumbColor={isDark ? "#4F46E5" : "#f4f3f4"}
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.iconRow}>
                        <Ionicons name="notifications-outline" size={22} color="#EA580C" />
                        <Text style={styles.rowLabel}>Notifications</Text>
                    </View>
                    <Switch
                        value={notifications}
                        onValueChange={setNotifications}
                        trackColor={{ false: "#767577", true: "#fdba74" }}
                        thumbColor={notifications ? "#EA580C" : "#f4f3f4"}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        position: 'relative',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        elevation: 3,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#4F46E5', // Indigo
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 4,
        borderColor: '#E0E7FF',
    },
    avatarText: {
        fontSize: 36,
        color: '#fff',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    badge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    badgeText: {
        color: '#1D4ED8',
        fontWeight: '700',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowLabel: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#EF4444', // Red
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        boxShadow: '0px 4px 8px rgba(239, 68, 68, 0.2)',
        elevation: 4,
        marginBottom: 40,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default SettingsScreen;
