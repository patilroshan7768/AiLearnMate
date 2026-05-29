/**
 * CourseContentScreen.js — Master content hub for a single course
 * Tabbed layout: Lectures, Notes, Assignments, Quizzes, Discussion, Resources, Live, Certificate
 */

import React, { useState, useContext, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    Animated, Dimensions, SafeAreaView, StatusBar, FlatList, Linking, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';

const { width: screenWidth } = Dimensions.get('window');

const TABS = [
    { key: 'lectures', label: 'Lectures', icon: 'videocam' },
    { key: 'notes', label: 'Notes', icon: 'document-text' },
    { key: 'assignments', label: 'Tasks', icon: 'create' },
    { key: 'quizzes', label: 'Quizzes', icon: 'help-circle' },
    { key: 'discussion', label: 'Discuss', icon: 'chatbubbles' },
    { key: 'resources', label: 'Files', icon: 'folder' },
    { key: 'live', label: 'Live', icon: 'radio' },
    { key: 'certificate', label: 'Award', icon: 'trophy' },
];

const CourseContentScreen = ({ route, navigation }) => {
    const { course } = route.params;
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('lectures');
    const tabScrollRef = useRef(null);

    // ─── LECTURES TAB ───
    const renderLectures = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>{course.lectures?.length || 0} Lectures</Text>
                <Text style={styles.tabHeaderSub}>{course.duration}</Text>
            </View>
            {(course.lectures || []).map((lec, idx) => (
                <TouchableOpacity
                    key={lec.id}
                    style={[styles.lectureItem, lec.completed && styles.lectureItemCompleted]}
                    onPress={() => navigation.navigate('VideoPlayer', { course, lecture: lec, lectureIndex: idx })}
                    activeOpacity={0.8}
                >
                    <View style={[styles.lectureIndex, lec.completed && styles.lectureIndexDone]}>
                        {lec.completed
                            ? <Ionicons name="checkmark" size={14} color="#10B981" />
                            : <Text style={styles.lectureIndexText}>{idx + 1}</Text>
                        }
                    </View>
                    <View style={styles.lectureMeta}>
                        <Text style={[styles.lectureTitle, lec.completed && styles.lectureTitleDone]} numberOfLines={1}>
                            {lec.title}
                        </Text>
                        <Text style={styles.lectureDuration}>
                            <Ionicons name="time-outline" size={10} color="#64748B" /> {lec.duration}
                        </Text>
                    </View>
                    <Ionicons name="play-circle" size={28} color={lec.completed ? '#334155' : '#6366F1'} />
                </TouchableOpacity>
            ))}
            {(!course.lectures || course.lectures.length === 0) && renderEmpty('videocam', 'No lectures uploaded yet')}
        </View>
    );

    // ─── NOTES TAB ───
    const renderNotes = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>📄 PDF Notes</Text>
            </View>
            {(course.notes || []).map(note => (
                <TouchableOpacity
                    key={note.id}
                    style={styles.noteItem}
                    onPress={() => navigation.navigate('PDFViewer', { title: note.title, url: note.url })}
                    activeOpacity={0.8}
                >
                    <View style={styles.noteIcon}>
                        <Ionicons name="document" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.noteMeta}>
                        <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
                        <Text style={styles.noteSize}>PDF Document</Text>
                    </View>
                    <View style={styles.noteActions}>
                        <TouchableOpacity style={styles.noteBtn}>
                            <Ionicons name={note.bookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={note.bookmarked ? '#F59E0B' : '#64748B'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.noteBtn}>
                            <Ionicons name="download-outline" size={18} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            ))}
            {(!course.notes || course.notes.length === 0) && renderEmpty('document-text', 'No notes uploaded yet')}
        </View>
    );

    // ─── ASSIGNMENTS TAB ───
    const renderAssignments = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>📝 Assignments</Text>
            </View>
            {(course.assignments || []).map(a => {
                const isPending = a.status === 'pending';
                const isGraded = a.status === 'graded';
                const isLate = a.status === 'late';
                const deadlinePassed = new Date(a.deadline) < new Date();
                const statusColor = isGraded ? '#10B981' : isPending && !deadlinePassed ? '#F59E0B' : '#EF4444';
                return (
                    <TouchableOpacity
                        key={a.id}
                        style={styles.assignmentItem}
                        onPress={() => navigation.navigate('Assignments', { course, assignment: a })}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.assignmentStatus, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
                            <Ionicons
                                name={isGraded ? 'checkmark-circle' : isPending ? 'time' : 'close-circle'}
                                size={20} color={statusColor}
                            />
                        </View>
                        <View style={styles.assignmentMeta}>
                            <Text style={styles.assignmentTitle} numberOfLines={1}>{a.title}</Text>
                            <Text style={styles.assignmentDeadline}>
                                Due: {new Date(a.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                            {isGraded && (
                                <Text style={styles.assignmentScore}>Score: {a.score}/{a.marks}</Text>
                            )}
                        </View>
                        <View style={[styles.assignmentBadge, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
                            <Text style={[styles.assignmentBadgeText, { color: statusColor }]}>
                                {isGraded ? 'Graded' : isPending ? 'Pending' : 'Late'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
            {(!course.assignments || course.assignments.length === 0) && renderEmpty('create', 'No assignments yet')}
        </View>
    );

    // ─── QUIZZES TAB ───
    const renderQuizzes = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>🧠 Quizzes & Tests</Text>
            </View>
            {(course.quizzes || []).map(q => {
                const isCompleted = q.status === 'completed';
                return (
                    <TouchableOpacity
                        key={q.id}
                        style={styles.quizItem}
                        onPress={() => navigation.navigate('Quiz', { course, quiz: q })}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quizIcon, { backgroundColor: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)' }]}>
                            <Ionicons name={isCompleted ? 'checkmark-done' : 'help-circle'} size={22} color={isCompleted ? '#10B981' : '#6366F1'} />
                        </View>
                        <View style={styles.quizMeta}>
                            <Text style={styles.quizTitle}>{q.title}</Text>
                            <View style={styles.quizStats}>
                                <Text style={styles.quizStat}>{q.questions} Q</Text>
                                <Text style={styles.quizStatDot}>·</Text>
                                <Text style={styles.quizStat}>{q.duration} min</Text>
                                <Text style={styles.quizStatDot}>·</Text>
                                <Text style={[styles.quizStat, { color: q.difficulty === 'easy' ? '#10B981' : q.difficulty === 'hard' ? '#EF4444' : '#F59E0B' }]}>
                                    {q.difficulty}
                                </Text>
                            </View>
                            {isCompleted && <Text style={styles.quizScore}>Score: {q.score}/{q.maxScore}</Text>}
                        </View>
                        <TouchableOpacity style={[styles.quizBtn, isCompleted && styles.quizBtnDone]}>
                            <Text style={styles.quizBtnText}>{isCompleted ? 'Review' : 'Start'}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                );
            })}
            {(!course.quizzes || course.quizzes.length === 0) && renderEmpty('help-circle', 'No quizzes available yet')}
        </View>
    );

    // ─── DISCUSSION TAB ───
    const renderDiscussion = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>💬 Discussion</Text>
                <TouchableOpacity
                    style={styles.newPostBtn}
                    onPress={() => navigation.navigate('Discussion', { course })}
                >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.newPostBtnText}>Ask</Text>
                </TouchableOpacity>
            </View>
            {(course.discussions || []).slice(0, 3).map(d => (
                <TouchableOpacity
                    key={d.id}
                    style={styles.discussionItem}
                    onPress={() => navigation.navigate('Discussion', { course, thread: d })}
                >
                    <View style={styles.discussionAvatar}>
                        <Text style={styles.discussionAvatarText}>{d.author[0]}</Text>
                    </View>
                    <View style={styles.discussionMeta}>
                        <View style={styles.discussionAuthorRow}>
                            <Text style={styles.discussionAuthor}>{d.author}</Text>
                            {d.role === 'teacher' && (
                                <View style={styles.teacherBadge}>
                                    <Text style={styles.teacherBadgeText}>Teacher</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.discussionText} numberOfLines={2}>{d.text}</Text>
                        <View style={styles.discussionStats}>
                            <Ionicons name="heart" size={11} color="#64748B" />
                            <Text style={styles.discussionStatText}>{d.likes}</Text>
                            <Ionicons name="chatbubble" size={11} color="#64748B" />
                            <Text style={styles.discussionStatText}>{d.replies?.length || 0}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
            {(!course.discussions || course.discussions.length === 0) && renderEmpty('chatbubbles', 'No discussions yet')}
            {(course.discussions || []).length > 3 && (
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Discussion', { course })}>
                    <Text style={styles.viewAllBtnText}>View all discussions →</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // ─── RESOURCES TAB ───
    const renderResources = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>📦 Downloadable Resources</Text>
            </View>
            {(course.resources || []).map(r => {
                const typeIcon = { zip: 'archive', ppt: 'easel', pdf: 'document', code: 'code-slash', dataset: 'server' };
                const typeColor = { zip: '#F59E0B', ppt: '#EF4444', pdf: '#EF4444', code: '#10B981', dataset: '#6366F1' };
                return (
                    <View key={r.id} style={styles.resourceItem}>
                        <View style={[styles.resourceIcon, { backgroundColor: (typeColor[r.type] || '#6366F1') + '15' }]}>
                            <Ionicons name={typeIcon[r.type] || 'document'} size={20} color={typeColor[r.type] || '#6366F1'} />
                        </View>
                        <View style={styles.resourceMeta}>
                            <Text style={styles.resourceName} numberOfLines={1}>{r.name}</Text>
                            <Text style={styles.resourceInfo}>{r.type?.toUpperCase()} · {r.size}</Text>
                        </View>
                        <TouchableOpacity style={styles.downloadBtn}>
                            <Ionicons name="cloud-download" size={20} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                );
            })}
            {(!course.resources || course.resources.length === 0) && renderEmpty('folder', 'No resources uploaded yet')}
        </View>
    );

    // ─── LIVE TAB ───
    const renderLive = () => (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>🔴 Live Classes</Text>
            </View>
            {(course.liveClasses || []).map(lc => {
                const isUpcoming = lc.status === 'upcoming';
                const sessionDate = new Date(lc.date);
                return (
                    <View key={lc.id} style={[styles.liveItem, isUpcoming && styles.liveItemUpcoming]}>
                        <View style={styles.liveDateBlock}>
                            <Text style={styles.liveDay}>{sessionDate.toLocaleDateString('en', { day: 'numeric' })}</Text>
                            <Text style={styles.liveMonth}>{sessionDate.toLocaleDateString('en', { month: 'short' })}</Text>
                        </View>
                        <View style={styles.liveMeta}>
                            <Text style={styles.liveTitle}>{lc.title}</Text>
                            <Text style={styles.liveTime}>
                                {sessionDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} · {lc.duration}
                            </Text>
                        </View>
                        {isUpcoming ? (
                            <TouchableOpacity
                                style={styles.joinBtn}
                                onPress={() => lc.meetUrl && Linking.openURL(lc.meetUrl).catch(() => Alert.alert('Error', 'Cannot open link'))}
                            >
                                <Ionicons name="videocam" size={14} color="#fff" />
                                <Text style={styles.joinBtnText}>Join</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.completedBadge}>
                                <Text style={styles.completedBadgeText}>Done</Text>
                            </View>
                        )}
                    </View>
                );
            })}
            {(!course.liveClasses || course.liveClasses.length === 0) && renderEmpty('radio', 'No live classes scheduled')}
        </View>
    );

    // ─── CERTIFICATE TAB ───
    const renderCertificate = () => {
        const isCompleted = course.progress >= 100;
        return (
            <View style={styles.tabContent}>
                <View style={styles.certCard}>
                    <Text style={styles.certEmoji}>{isCompleted ? '🏆' : '🎯'}</Text>
                    <Text style={styles.certTitle}>
                        {isCompleted ? 'Congratulations!' : 'Complete to Earn Certificate'}
                    </Text>
                    <Text style={styles.certSub}>
                        {isCompleted ? 'You\'ve completed this course!' : `${course.progress}% completed — keep going!`}
                    </Text>
                    <ProgressRing progress={course.progress} size={80} strokeWidth={5} fontSize={18} />
                    <View style={styles.milestones}>
                        {[25, 50, 75, 100].map(m => (
                            <View key={m} style={[styles.milestone, course.progress >= m && styles.milestoneReached]}>
                                <Ionicons name={course.progress >= m ? 'star' : 'star-outline'} size={16} color={course.progress >= m ? '#F59E0B' : '#334155'} />
                                <Text style={[styles.milestoneText, course.progress >= m && styles.milestoneTextReached]}>{m}%</Text>
                            </View>
                        ))}
                    </View>
                    {isCompleted && (
                        <TouchableOpacity style={styles.downloadCertBtn}>
                            <Ionicons name="download" size={16} color="#fff" />
                            <Text style={styles.downloadCertBtnText}>Download Certificate</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    // ─── EMPTY STATE ───
    const renderEmpty = (icon, message) => (
        <View style={styles.emptyState}>
            <Ionicons name={icon} size={40} color="#334155" />
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    );

    // ─── TAB ROUTER ───
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'lectures': return renderLectures();
            case 'notes': return renderNotes();
            case 'assignments': return renderAssignments();
            case 'quizzes': return renderQuizzes();
            case 'discussion': return renderDiscussion();
            case 'resources': return renderResources();
            case 'live': return renderLive();
            case 'certificate': return renderCertificate();
            default: return renderLectures();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#070A13" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ── COURSE HEADER ── */}
                <View style={styles.headerCard}>
                    <Image source={{ uri: course.thumbnail }} style={styles.headerImage} />
                    <View style={styles.headerOverlay} />
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <View style={styles.headerCatBadge}>
                                <Text style={styles.headerCatText}>{course.category}</Text>
                            </View>
                            <Text style={styles.headerTitle} numberOfLines={2}>{course.title}</Text>
                            <Text style={styles.headerTeacher}>
                                <Ionicons name="person" size={12} color="#A5B4FC" /> {course.teacher}
                            </Text>
                            <View style={styles.headerProgressRow}>
                                <View style={styles.headerProgressBar}>
                                    <View style={[styles.headerProgressFill, { width: `${course.progress}%` }]} />
                                </View>
                                <Text style={styles.headerProgressText}>{course.progress}%</Text>
                            </View>
                        </View>
                        {/* AI Doubt Button */}
                        <TouchableOpacity
                            style={styles.aiBtn}
                            onPress={() => navigation.navigate('MainTabs', {
                                screen: 'AI Tools',
                                params: { courseId: course.course_id || course.id }
                            })}
                        >
                            <Ionicons name="sparkles" size={18} color="#C084FC" />
                            <Text style={styles.aiBtnText}>AI Doubt</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── TAB BAR ── */}
                <ScrollView
                    ref={tabScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabBar}
                    contentContainerStyle={styles.tabBarContent}
                >
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={16}
                                color={activeTab === tab.key ? '#A5B4FC' : '#475569'}
                            />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ── ACTIVE TAB CONTENT ── */}
                {renderActiveTab()}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070A13' },

    // ── Header ──
    headerCard: { height: 240, position: 'relative' },
    headerImage: { width: '100%', height: '100%', position: 'absolute' },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,10,19,0.82)' },
    headerContent: { flex: 1, padding: 16, justifyContent: 'space-between' },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerInfo: { gap: 6 },
    headerCatBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(99,102,241,0.8)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    headerCatText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerTeacher: { fontSize: 13, color: '#A5B4FC', fontWeight: '600' },
    headerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    headerProgressBar: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
    headerProgressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 3 },
    headerProgressText: { color: '#A5B4FC', fontSize: 13, fontWeight: '800' },
    aiBtn: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(147,51,234,0.2)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.4)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    aiBtnText: { color: '#C084FC', fontSize: 12, fontWeight: '700' },

    // ── Tabs ──
    tabBar: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    tabBarContent: { paddingHorizontal: 12, gap: 4, paddingVertical: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'transparent' },
    tabActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
    tabText: { fontSize: 12, fontWeight: '700', color: '#475569' },
    tabTextActive: { color: '#A5B4FC' },

    // ── Tab Content ──
    tabContent: { padding: 16 },
    tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    tabHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#F1F5F9' },
    tabHeaderSub: { fontSize: 12, color: '#64748B' },

    // ── Lectures ──
    lectureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    lectureItemCompleted: { opacity: 0.6 },
    lectureIndex: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' },
    lectureIndexDone: { backgroundColor: 'rgba(16,185,129,0.15)' },
    lectureIndexText: { color: '#A5B4FC', fontSize: 12, fontWeight: '800' },
    lectureMeta: { flex: 1 },
    lectureTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    lectureTitleDone: { textDecorationLine: 'line-through', color: '#64748B' },
    lectureDuration: { color: '#64748B', fontSize: 11, marginTop: 2 },

    // ── Notes ──
    noteItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    noteIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },
    noteMeta: { flex: 1 },
    noteTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    noteSize: { color: '#64748B', fontSize: 11, marginTop: 2 },
    noteActions: { flexDirection: 'row', gap: 8 },
    noteBtn: { padding: 6 },

    // ── Assignments ──
    assignmentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    assignmentStatus: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    assignmentMeta: { flex: 1 },
    assignmentTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    assignmentDeadline: { color: '#64748B', fontSize: 11, marginTop: 2 },
    assignmentScore: { color: '#10B981', fontSize: 11, fontWeight: '700', marginTop: 2 },
    assignmentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    assignmentBadgeText: { fontSize: 10, fontWeight: '800' },

    // ── Quizzes ──
    quizItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    quizIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    quizMeta: { flex: 1 },
    quizTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    quizStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    quizStat: { color: '#64748B', fontSize: 11, fontWeight: '600' },
    quizStatDot: { color: '#334155', fontSize: 11 },
    quizScore: { color: '#10B981', fontSize: 11, fontWeight: '700', marginTop: 2 },
    quizBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#6366F1' },
    quizBtnDone: { backgroundColor: 'rgba(99,102,241,0.15)' },
    quizBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // ── Discussion ──
    discussionItem: { flexDirection: 'row', gap: 10, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    discussionAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.2)', justifyContent: 'center', alignItems: 'center' },
    discussionAvatarText: { color: '#A5B4FC', fontSize: 14, fontWeight: '800' },
    discussionMeta: { flex: 1 },
    discussionAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    discussionAuthor: { color: '#F1F5F9', fontSize: 12, fontWeight: '700' },
    teacherBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    teacherBadgeText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
    discussionText: { color: '#94A3B8', fontSize: 12, lineHeight: 17, marginTop: 4 },
    discussionStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    discussionStatText: { color: '#64748B', fontSize: 11 },
    newPostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    newPostBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    viewAllBtn: { alignItems: 'center', paddingVertical: 12 },
    viewAllBtnText: { color: '#6366F1', fontSize: 13, fontWeight: '700' },

    // ── Resources ──
    resourceItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    resourceIcon: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    resourceMeta: { flex: 1 },
    resourceName: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    resourceInfo: { color: '#64748B', fontSize: 11, marginTop: 2 },
    downloadBtn: { padding: 8 },

    // ── Live ──
    liveItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    liveItemUpcoming: { borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.04)' },
    liveDateBlock: { width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)', justifyContent: 'center', alignItems: 'center' },
    liveDay: { color: '#F1F5F9', fontSize: 18, fontWeight: '900' },
    liveMonth: { color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    liveMeta: { flex: 1 },
    liveTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    liveTime: { color: '#64748B', fontSize: 11, marginTop: 2 },
    joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    joinBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    completedBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    completedBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '700' },

    // ── Certificate ──
    certCard: { backgroundColor: '#0F172A', borderRadius: 20, padding: 28, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    certEmoji: { fontSize: 56 },
    certTitle: { fontSize: 20, fontWeight: '900', color: '#F1F5F9', textAlign: 'center' },
    certSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
    milestones: { flexDirection: 'row', gap: 16, marginTop: 8 },
    milestone: { alignItems: 'center', gap: 4 },
    milestoneReached: {},
    milestoneText: { color: '#334155', fontSize: 10, fontWeight: '700' },
    milestoneTextReached: { color: '#F59E0B' },
    downloadCertBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    downloadCertBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    // ── Empty ──
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: '#475569', fontSize: 13 },
});

export default CourseContentScreen;
