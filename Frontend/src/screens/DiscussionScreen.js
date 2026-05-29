/**
 * DiscussionScreen.js — Premium Course Discussion Board
 * Dual-mode interface: Thread Explorer (list + creator) & Detailed Q&A Thread.
 * Features likes toggling, replies posting, search indexing, and profile badges.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const DiscussionScreen = ({ route, navigation }) => {
    const { course, thread: initialThread } = route.params;

    // Dual-mode state
    const [currentThread, setCurrentThread] = useState(initialThread || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [threads, setThreads] = useState(course.discussions || []);
    
    // Reply composer state
    const [composeText, setComposeText] = useState('');
    
    // Topic creator state
    const [showCreator, setShowCreator] = useState(false);
    const [newTopicText, setNewTopicText] = useState('');

    const handleBack = () => {
        if (currentThread) {
            setCurrentThread(null); // Back to list view
        } else if (showCreator) {
            setShowCreator(false);
        } else {
            navigation.goBack();
        }
    };

    const handleLikeThread = (threadId, e) => {
        // Prevent action bubbling if on list card
        const updated = threads.map(t => {
            if (t.id === threadId) {
                return { ...t, likes: t.likes + 1 };
            }
            return t;
        });
        setThreads(updated);
        course.discussions = updated;
        if (currentThread && currentThread.id === threadId) {
            setCurrentThread(prev => ({ ...prev, likes: prev.likes + 1 }));
        }
    };

    const handleCreateTopic = () => {
        if (!newTopicText.trim()) return;

        const topic = {
            id: 'disc_' + Date.now(),
            author: 'You (Student)',
            role: 'student',
            text: newTopicText,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: []
        };

        const updated = [topic, ...threads];
        setThreads(updated);
        course.discussions = updated;
        setNewTopicText('');
        setShowCreator(false);
        Alert.alert('Topic Created!', 'Your question was successfully posted to the forum.');
    };

    const handlePostReply = () => {
        if (!composeText.trim()) return;

        const newReply = {
            id: 'rep_' + Date.now(),
            author: 'You (Student)',
            role: 'student',
            text: composeText,
            timestamp: new Date().toISOString(),
            likes: 0
        };

        const updatedReplies = [...(currentThread.replies || []), newReply];
        const updatedThread = { ...currentThread, replies: updatedReplies };
        
        setCurrentThread(updatedThread);

        // Update list
        const updatedList = threads.map(t => {
            if (t.id === currentThread.id) {
                return updatedThread;
            }
            return t;
        });
        setThreads(updatedList);
        course.discussions = updatedList;

        setComposeText('');
    };

    // Filter threads
    const filteredThreads = threads.filter(t => 
        t.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#070A13" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.titleMeta}>
                    <Text style={styles.title} numberOfLines={1}>
                        {currentThread ? 'Thread Details' : showCreator ? 'Ask a Doubt' : 'Discussion Forum'}
                    </Text>
                    <Text style={styles.sub}>{course.title}</Text>
                </View>
                {!currentThread && !showCreator && (
                    <TouchableOpacity style={styles.createHeaderBtn} onPress={() => setShowCreator(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            {currentThread ? (
                // ─── THREAD VIEW ───
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
                >
                    <ScrollView contentContainerStyle={styles.threadScroll} showsVerticalScrollIndicator={false}>
                        {/* OP Post Card */}
                        <View style={styles.opCard}>
                            <View style={styles.authorRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{currentThread.author[0]}</Text>
                                </View>
                                <View style={styles.authorMeta}>
                                    <Text style={styles.authorName}>{currentThread.author}</Text>
                                    <Text style={styles.roleLabel}>{currentThread.role?.toUpperCase()}</Text>
                                </View>
                                <TouchableOpacity style={styles.likeBtn} onPress={() => handleLikeThread(currentThread.id)}>
                                    <Ionicons name="heart" size={16} color="#EF4444" />
                                    <Text style={styles.likeCount}>{currentThread.likes}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.opText}>{currentThread.text}</Text>
                            <Text style={styles.opTime}>Posted {new Date(currentThread.timestamp || Date.now()).toLocaleDateString()}</Text>
                        </View>

                        {/* Replies List header */}
                        <Text style={styles.repliesCountHeader}>Replies ({currentThread.replies?.length || 0})</Text>

                        {/* Replies List */}
                        <View style={styles.repliesContainer}>
                            {(currentThread.replies || []).map(r => (
                                <View key={r.id} style={[styles.replyCard, r.role === 'teacher' && styles.teacherReplyCard]}>
                                    <View style={styles.authorRow}>
                                        <View style={[styles.avatar, r.role === 'teacher' && { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                                            <Text style={[styles.avatarText, r.role === 'teacher' && { color: '#10B981' }]}>{r.author[0]}</Text>
                                        </View>
                                        <View style={styles.authorMeta}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={styles.authorName}>{r.author}</Text>
                                                {r.role === 'teacher' && (
                                                    <View style={styles.teacherBadge}>
                                                        <Text style={styles.teacherBadgeText}>Teacher</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.roleLabel}>{r.role?.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.replyText}>{r.text}</Text>
                                    <Text style={styles.replyTime}>{new Date(r.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                            ))}
                            {(!currentThread.replies || currentThread.replies.length === 0) && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Be the first to reply to this thread!</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Compose Row */}
                    <View style={styles.composeRow}>
                        <TextInput
                            style={styles.composeInput}
                            placeholder="Type your response..."
                            placeholderTextColor="#475569"
                            value={composeText}
                            onChangeText={setComposeText}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={handlePostReply}>
                            <Ionicons name="send" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            ) : showCreator ? (
                // ─── TOPIC CREATOR ───
                <ScrollView contentContainerStyle={styles.creatorScroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.creatorInstructions}>
                        Have a question? Feel free to ask here. Teachers and peer students will review it and reply.
                    </Text>
                    
                    <TextInput
                        style={styles.creatorInput}
                        placeholder="Write your doubt/topic in detail here..."
                        placeholderTextColor="#475569"
                        value={newTopicText}
                        onChangeText={setNewTopicText}
                        multiline
                        numberOfLines={6}
                    />

                    <TouchableOpacity style={styles.postBtn} onPress={handleCreateTopic}>
                        <Text style={styles.postBtnText}>Post to Forum</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                // ─── THREADS LIST EXPLORER ───
                <View style={{ flex: 1 }}>
                    {/* Search bar */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#475569" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search discussions..."
                            placeholderTextColor="#475569"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
                        {filteredThreads.map(t => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={styles.threadCard}
                                onPress={() => setCurrentThread(t)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.authorRow}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{t.author[0]}</Text>
                                    </View>
                                    <View style={styles.authorMeta}>
                                        <Text style={styles.authorName}>{t.author}</Text>
                                        <Text style={styles.roleLabel}>{t.role?.toUpperCase()}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.cardLikeBtn} onPress={(e) => handleLikeThread(t.id, e)}>
                                        <Ionicons name="heart-outline" size={14} color="#64748B" />
                                        <Text style={styles.cardLikeCount}>{t.likes}</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <Text style={styles.cardText} numberOfLines={2}>{t.text}</Text>
                                
                                <View style={styles.cardFooter}>
                                    <Text style={styles.cardTime}>{new Date(t.timestamp || Date.now()).toLocaleDateString()}</Text>
                                    <View style={styles.replyIndicator}>
                                        <Ionicons name="chatbubbles-outline" size={14} color="#6366F1" />
                                        <Text style={styles.replyIndicatorText}>{t.replies?.length || 0} Replies</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {filteredThreads.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={48} color="#334155" />
                                <Text style={styles.emptyText}>No threads match your search.</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070A13' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0F172A' },
    backBtn: { padding: 6, marginRight: 8 },
    titleMeta: { flex: 1 },
    title: { color: '#F1F5F9', fontSize: 14, fontWeight: '800' },
    sub: { color: '#64748B', fontSize: 10, fontWeight: '600', marginTop: 1 },
    createHeaderBtn: { padding: 6, backgroundColor: '#6366F1', borderRadius: 8 },

    // Threads List
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, paddingVertical: 10 },
    searchInput: { flex: 1, color: '#F1F5F9', fontSize: 13, padding: 0 },
    listScroll: { padding: 16, gap: 10 },
    threadCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, gap: 10 },
    cardLikeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    cardLikeCount: { color: '#64748B', fontSize: 10, fontWeight: '700' },
    cardText: { color: '#94A3B8', fontSize: 12, lineHeight: 17 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTime: { color: '#475569', fontSize: 10, fontWeight: '600' },
    replyIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    replyIndicatorText: { color: '#6366F1', fontSize: 11, fontWeight: '700' },

    // OP Thread details
    threadScroll: { padding: 16, gap: 16 },
    opCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, gap: 12 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(99,102,241,0.2)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#A5B4FC', fontSize: 13, fontWeight: '800' },
    authorMeta: { flex: 1 },
    authorName: { color: '#F1F5F9', fontSize: 12, fontWeight: '800' },
    roleLabel: { color: '#475569', fontSize: 9, fontWeight: '700', marginTop: 1 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    likeCount: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
    opText: { color: '#F1F5F9', fontSize: 13, lineHeight: 19 },
    opTime: { color: '#475569', fontSize: 10, fontWeight: '600' },

    repliesCountHeader: { color: '#F1F5F9', fontSize: 13, fontWeight: '800', marginHorizontal: 4 },
    repliesContainer: { gap: 8, paddingBottom: 20 },
    replyCard: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    teacherReplyCard: { borderColor: 'rgba(16,185,129,0.2)', backgroundColor: 'rgba(16,185,129,0.02)' },
    teacherBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    teacherBadgeText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
    replyText: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
    replyTime: { color: '#475569', fontSize: 9, alignSelf: 'flex-end' },

    composeRow: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    composeInput: { flex: 1, backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, color: '#F1F5F9', fontSize: 13, maxHeight: 80 },
    sendBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },

    // Topic Creator
    creatorScroll: { padding: 24, gap: 16 },
    creatorInstructions: { color: '#64748B', fontSize: 12, lineHeight: 17 },
    creatorInput: { backgroundColor: '#0F172A', borderRadius: 16, padding: 16, color: '#F1F5F9', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', textAlignVertical: 'top', minHeight: 120 },
    postBtn: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    postBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: '#475569', fontSize: 12 }
});

export default DiscussionScreen;
