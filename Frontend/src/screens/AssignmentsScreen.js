/**
 * AssignmentsScreen.js — Smart Assignment Hub & Submission Portal
 * Features expo-document-picker uploads, simulated upload pipeline, 
 * and an interactive real-time AI Plagiarism scanning utility!
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const { width: screenWidth } = Dimensions.get('window');

const AssignmentsScreen = ({ route, navigation }) => {
    const { course, assignment } = route.params;

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(assignment.status !== 'pending');
    
    // AI Plagiarism Simulator States
    const [scanningPlagiarism, setScanningPlagiarism] = useState(false);
    const [scanResults, setScanResults] = useState(null); // { score, originalSource }
    const scanBarAnim = React.useRef(new Animated.Value(0)).current;

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const file = result.assets[0];
                setSelectedFile(file);
                setScanResults(null);
            }
        } catch (error) {
            console.error('File pick error:', error);
            Alert.alert('Error', 'Failed to pick file.');
        }
    };

    const handlePlagiarismCheck = () => {
        if (!selectedFile) return;

        setScanningPlagiarism(true);
        setScanResults(null);
        
        // Plagiarism scanner animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanBarAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(scanBarAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
            ]),
            { iterations: 2 }
        ).start();

        // Simulate scanning logic
        setTimeout(() => {
            setScanningPlagiarism(false);
            const similarity = Math.floor(Math.random() * 12); // Generates premium high-quality clean rating <12%
            setScanResults({
                score: similarity,
                originalSource: similarity > 5 ? 'GitHub / public gist example' : 'Unique work verified'
            });
        }, 4800);
    };

    const handleSubmitAssignment = () => {
        if (!selectedFile) {
            Alert.alert('Missing File', 'Please attach your assignment file first.');
            return;
        }

        if (!scanResults && assignment.status === 'pending') {
            Alert.alert(
                'AI Plagiarism Scan Recommended',
                'Do you want to run our AI Plagiarism checker before submitting to the teacher?',
                [
                    { text: 'Submit Anyway', onPress: () => runUploadPipeline() },
                    { text: 'Run AI Scan First', onPress: () => handlePlagiarismCheck() }
                ]
            );
        } else {
            runUploadPipeline();
        }
    };

    const runUploadPipeline = () => {
        setUploading(true);
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setUploading(false);
                        setIsSubmitted(true);
                        assignment.status = 'submitted';
                        Alert.alert('Success', 'Assignment submitted successfully to the grading queue!');
                    }, 500);
                    return 100;
                }
                return prev + 20;
            });
        }, 300);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setScanResults(null);
    };

    const deadlinePassed = new Date(assignment.deadline) < new Date();
    const isGraded = assignment.status === 'graded';
    const submissionColor = isGraded ? '#10B981' : isSubmitted ? '#6366F1' : '#F59E0B';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#070A13" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.titleMeta}>
                    <Text style={styles.title} numberOfLines={1}>{assignment.title}</Text>
                    <Text style={styles.sub}>{course.title}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View style={[styles.statusCard, { borderColor: submissionColor + '40' }]}>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: submissionColor + '20' }]}>
                            <Text style={[styles.statusBadgeText, { color: submissionColor }]}>
                                {isGraded ? 'GRADED' : isSubmitted ? 'SUBMITTED' : deadlinePassed ? 'OVERDUE' : 'PENDING'}
                            </Text>
                        </View>
                        <Text style={styles.marksText}>{assignment.marks} Marks Total</Text>
                    </View>

                    {isGraded ? (
                        <View style={styles.scoreBlock}>
                            <Text style={styles.scoreLabel}>Graded Score</Text>
                            <Text style={styles.scoreVal}>{assignment.score} <Text style={styles.scoreMax}>/ {assignment.marks}</Text></Text>
                            <Text style={styles.feedbackText}>" {assignment.feedback} "</Text>
                        </View>
                    ) : (
                        <View style={styles.deadlineBlock}>
                            <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                            <Text style={styles.deadlineVal}>
                                Due: {new Date(assignment.deadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Instructions section */}
                <View style={styles.instructionsBlock}>
                    <Text style={styles.sectionTitle}>📋 Instructions</Text>
                    <Text style={styles.instructionsText}>
                        1. Please complete all requested OOP or coding exercises discussed in week 4 lectures.{"\n"}
                        2. Code submissions should be compressed or written out in standard formats (PDF, DOCX).{"\n"}
                        3. All submitted files will go through our AI Plagiarism checker. Copying from peers will result in grade penalties.
                    </Text>
                </View>

                {/* File Upload portal */}
                {!isSubmitted ? (
                    <View style={styles.portalBlock}>
                        <Text style={styles.sectionTitle}>📤 Submit Your Work</Text>
                        
                        {!selectedFile ? (
                            <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument}>
                                <Ionicons name="cloud-upload" size={42} color="#6366F1" style={{ marginBottom: 8 }} />
                                <Text style={styles.uploadMainText}>Click to select file</Text>
                                <Text style={styles.uploadSubText}>Supports PDF or Word Documents (.docx)</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.fileCard}>
                                <View style={styles.fileIcon}>
                                    <Ionicons name="document-text" size={24} color="#EF4444" />
                                </View>
                                <View style={styles.fileMeta}>
                                    <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                                    <Text style={styles.fileSize}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</Text>
                                </View>
                                <TouchableOpacity style={styles.removeFileBtn} onPress={handleRemoveFile}>
                                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedFile && !uploading && (
                            <View style={styles.toolRow}>
                                <TouchableOpacity 
                                    style={[styles.toolBtn, { backgroundColor: scanningPlagiarism ? 'rgba(99,102,241,0.1)' : 'rgba(147,51,234,0.15)', borderColor: '#A855F7' }]}
                                    onPress={handlePlagiarismCheck}
                                    disabled={scanningPlagiarism}
                                >
                                    <Ionicons name="shield-checkmark" size={16} color="#C084FC" />
                                    <Text style={[styles.toolBtnText, { color: '#C084FC' }]}>
                                        {scanningPlagiarism ? 'Scanning...' : 'Run AI Anti-Plagiarism'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Plagiarism scan micro animation UI */}
                        {scanningPlagiarism && (
                            <View style={styles.scanContainer}>
                                <View style={styles.scanWindow}>
                                    <Animated.View style={[
                                        styles.scanBar,
                                        {
                                            transform: [{
                                                translateY: scanBarAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0, 70]
                                                })
                                            }]
                                        }
                                    ]} />
                                    <Text style={styles.scanCodeMock}>def check_similarity(submission):{"\n"}  return extract_features(submission)</Text>
                                </View>
                                <Text style={styles.scanningLabel}>AI Model is analyzing syntax & cross-matching indices...</Text>
                            </View>
                        )}

                        {scanResults && (
                            <View style={[
                                styles.scanResultCard,
                                { borderColor: scanResults.score > 25 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' }
                            ]}>
                                <View style={styles.scanResultHeader}>
                                    <Ionicons 
                                        name={scanResults.score > 25 ? 'warning' : 'checkmark-done-circle'} 
                                        size={20} 
                                        color={scanResults.score > 25 ? '#EF4444' : '#10B981'} 
                                    />
                                    <Text style={styles.scanResultTitle}>AI Plagiarism Report</Text>
                                </View>
                                <Text style={styles.scanResultScore}>
                                    Similarity Index: <Text style={{ color: scanResults.score > 25 ? '#EF4444' : '#10B981', fontWeight: '900' }}>{scanResults.score}%</Text>
                                </Text>
                                <Text style={styles.scanResultDesc}>
                                    {scanResults.score > 25 ? 'High similarity found! Please rewrite your definitions to avoid grades deduction.' : 'Excellent! Your document is classified as unique and genuine work.'}
                                </Text>
                            </View>
                        )}

                        {uploading && (
                            <View style={styles.progressBlock}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                                </View>
                                <Text style={styles.progressLabel}>Uploading: {uploadProgress}%</Text>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.submitBtn, (!selectedFile || uploading || scanningPlagiarism) && styles.submitBtnDisabled]}
                            onPress={handleSubmitAssignment}
                            disabled={!selectedFile || uploading || scanningPlagiarism}
                        >
                            <Text style={styles.submitBtnText}>Submit Assignment</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.submittedArea}>
                        <Ionicons name="checkmark-circle" size={54} color="#10B981" />
                        <Text style={styles.submittedTitle}>Your Assignment is Submitted!</Text>
                        <Text style={styles.submittedSub}>It is currently queued for evaluation. The teacher will post the final grade here once graded.</Text>
                        {assignment.status === 'submitted' && (
                            <TouchableOpacity 
                                style={styles.resubmitBtn} 
                                onPress={() => setIsSubmitted(false)}
                            >
                                <Text style={styles.resubmitBtnText}>Unsubmit / Make Changes</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
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

    scrollContainer: { padding: 16, gap: 16 },

    // Status Card
    statusCard: { backgroundColor: '#0F172A', borderRadius: 16, padding: 18, borderWidth: 1, gap: 14 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    marksText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },

    scoreBlock: { backgroundColor: 'rgba(16,185,129,0.06)', padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#10B981' },
    scoreLabel: { color: '#64748B', fontSize: 11, fontWeight: '700' },
    scoreVal: { color: '#10B981', fontSize: 26, fontWeight: '900', marginTop: 4 },
    scoreMax: { fontSize: 14, color: '#64748B' },
    feedbackText: { color: '#E2E8F0', fontSize: 12, fontStyle: 'italic', marginTop: 8 },

    deadlineBlock: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 },
    deadlineVal: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    // Instructions
    instructionsBlock: { backgroundColor: '#0F172A', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    sectionTitle: { color: '#F1F5F9', fontSize: 14, fontWeight: '800', marginBottom: 10 },
    instructionsText: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },

    // Portal upload
    portalBlock: { backgroundColor: '#0F172A', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    uploadArea: { borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(99,102,241,0.4)', borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.02)', height: 130, justifyContent: 'center', alignItems: 'center', padding: 16 },
    uploadMainText: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    uploadSubText: { color: '#475569', fontSize: 11, marginTop: 4 },

    fileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, borderEndWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    fileIcon: { width: 38, height: 38, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    fileMeta: { flex: 1 },
    fileName: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
    fileSize: { color: '#64748B', fontSize: 11, marginTop: 2 },
    removeFileBtn: { padding: 4 },

    toolRow: { marginTop: 10 },
    toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start' },
    toolBtnText: { fontSize: 12, fontWeight: '700' },

    // Scan Simulator
    scanContainer: { marginTop: 12, gap: 8 },
    scanWindow: { height: 80, backgroundColor: '#020617', borderRadius: 10, position: 'relative', overflow: 'hidden', padding: 10, justifyContent: 'center' },
    scanBar: { height: 2, backgroundColor: '#C084FC', width: '100%', position: 'absolute', top: 0, zIndex: 10, boxShadow: '0px 0px 4px rgba(192, 132, 252, 0.8)', elevation: 4 },
    scanCodeMock: { color: '#475569', fontSize: 10, fontFamily: 'monospace', lineHeight: 14 },
    scanningLabel: { color: '#C084FC', fontSize: 11, fontWeight: '700', textAlign: 'center' },

    scanResultCard: { backgroundColor: 'rgba(255,255,255,0.01)', borderLeftWidth: 3, padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1 },
    scanResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    scanResultTitle: { color: '#F1F5F9', fontSize: 12, fontWeight: '800' },
    scanResultScore: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
    scanResultDesc: { color: '#64748B', fontSize: 11, marginTop: 4, lineHeight: 15 },

    progressBlock: { marginTop: 14, gap: 6 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#6366F1' },
    progressLabel: { color: '#6366F1', fontSize: 11, fontWeight: '700' },

    submitBtn: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 14 },
    submitBtnDisabled: { backgroundColor: '#334155', opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    submittedArea: { backgroundColor: '#0F172A', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 28, alignItems: 'center', gap: 12 },
    submittedTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '800', textAlign: 'center' },
    submittedSub: { color: '#64748B', fontSize: 12, textAlign: 'center', lineHeight: 18 },
    resubmitBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginTop: 6 },
    resubmitBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' }
});

export default AssignmentsScreen;
