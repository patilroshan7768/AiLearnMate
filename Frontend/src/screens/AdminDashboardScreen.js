import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import courseService from '../services/courseService';
// Assuming we might have a userService later, but for now we'll mock user stats or derive them if possible.
// Since we don't have a direct "getAllUsers" endpoint in the provided context, we will mock the user stats 
// or use available data.

const AdminDashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 120, // Mock data for demo
        totalTeachers: 15,  // Mock data for demo
    });
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch Courses to show activity
            const response = await courseService.getAllCourses();
            let list = [];
            if (Array.isArray(response)) list = response;
            else if (response.data?.courses) list = response.data.courses;
            else if (response.courses) list = response.courses;

            setCourses(list);
            setStats(prev => ({ ...prev, totalCourses: list.length }));
        } catch (error) {
            console.error('Admin Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCourseItem = ({ item }) => (
        <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
                <Ionicons name="book" size={20} color="#4F46E5" />
            </View>
            <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activitySub}>
                    Uploaded by: <Text style={styles.bold}>{item.creator?.name || item.instructorName || 'Unknown Teacher'}</Text>
                </Text>
                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CourseDetail', { course: item })}>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.gridContainer}>
                {/* Total Courses */}
                <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
                    <View style={[styles.iconBox, { backgroundColor: '#C7D2FE' }]}>
                        <Ionicons name="library" size={24} color="#4F46E5" />
                    </View>
                    <Text style={styles.statNumber}>{stats.totalCourses}</Text>
                    <Text style={styles.statLabel}>Total Courses</Text>
                </View>

                {/* Total Students */}
                <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                    <View style={[styles.iconBox, { backgroundColor: '#A7F3D0' }]}>
                        <Ionicons name="people" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.statNumber}>{stats.totalStudents}</Text>
                    <Text style={styles.statLabel}>Active Students</Text>
                </View>

                {/* Total Teachers */}
                <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
                    <View style={[styles.iconBox, { backgroundColor: '#FED7AA' }]}>
                        <Ionicons name="school" size={24} color="#EA580C" />
                    </View>
                    <Text style={styles.statNumber}>{stats.totalTeachers}</Text>
                    <Text style={styles.statLabel}>Teachers</Text>
                </View>
            </View>

            {/* Recent Uploads Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Course Uploads</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
            ) : (
                <View style={styles.listContainer}>
                    {courses.slice(0, 5).map(item => (
                        <View key={item.course_id || item.id || item._id} style={styles.activityItemWrapper}>
                            {renderCourseItem({ item })}
                        </View>
                    ))}
                    {courses.length === 0 && (
                        <Text style={styles.emptyText}>No courses uploaded yet.</Text>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30, // Safe Area
        marginBottom: 25,
    },
    backBtn: {
        marginRight: 15,
        padding: 5
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 30,
        gap: 12
    },
    statCard: {
        width: '31%', // Fits 3 in a row
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)",
        elevation: 2,
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center'
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    seeAll: {
        color: '#4F46E5',
        fontSize: 14,
        fontWeight: '600'
    },
    listContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 5,
        boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.05)",
        elevation: 2,
    },
    activityItemWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2
    },
    activitySub: {
        fontSize: 12,
        color: '#6B7280',
    },
    bold: {
        fontWeight: '600',
        color: '#4B5563'
    },
    date: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 2
    },
    emptyText: {
        padding: 20,
        textAlign: 'center',
        color: '#9CA3AF'
    }
});

export default AdminDashboardScreen;
