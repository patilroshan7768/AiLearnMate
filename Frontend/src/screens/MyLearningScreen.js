/**
 * MyLearningScreen.js — Simple, Clean & Responsive "My Learning" Student Dashboard.
 * Integrates directly with the Sequelize backend to show teacher uploaded:
 * - Video Lectures (Watch inline via modal player)
 * - PDF Notes (Read inline via WebView viewer)
 * - Assignments & Tests (Submit documents, track evaluation, view grades instantly)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Modal,
    TextInput,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import mcqService from '../services/mcqService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MyLearningScreen = ({ navigation }) => {
    // State management
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [pdfs, setPdfs] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [mcqTests, setMcqTests] = useState([]);
    const [mcqSubmissions, setMcqSubmissions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // all, videos, pdfs, tasks, mcq

    // Modals
    const [videoModal, setVideoModal] = useState({ visible: false, title: '', url: '' });
    const [pdfModal, setPdfModal] = useState({ visible: false, title: '', url: '' });
    const [submitModal, setSubmitModal] = useState({ visible: false, assignment: null, file: null, uploading: false });
    const [mcqModal, setMcqModal] = useState({
        visible: false,
        test: null,
        currentQuestion: 0,
        answers: {},
        submitted: false,
        result: null,
        loading: false
    });

    const modalPlayer = useVideoPlayer(videoModal.url || '', (player) => {
        player.play();
    });

    useEffect(() => {
        if (videoModal.visible && videoModal.url && !videoModal.url.includes('youtube.com') && !videoModal.url.includes('youtu.be')) {
            modalPlayer.replace(videoModal.url);
            modalPlayer.play();
        } else {
            modalPlayer.pause();
        }
    }, [videoModal.url, videoModal.visible, modalPlayer]);

    // Fetch initial list of courses/subjects
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/courses');

            // Extract courses array from multiple potential response structures
            let courseList = [];
            if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.courses)) {
                courseList = response.data.data.courses;
            } else if (response.data && Array.isArray(response.data.courses)) {
                courseList = response.data.courses;
            } else if (response.data && Array.isArray(response.data.data)) {
                courseList = response.data.data;
            } else if (Array.isArray(response.data)) {
                courseList = response.data;
            }

            setCourses(courseList);

            // Auto-select first course if none is selected
            if (courseList.length > 0 && !selectedCourse) {
                setSelectedCourse(courseList[0]);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            Alert.alert('Error', 'Failed to retrieve course list.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch course details & materials (Lectures, PDFs, Assignments, Submissions, MCQ Tests)
    const fetchCourseContent = async (courseId) => {
        if (!courseId) return;
        try {
            // Parallel backend requests for speed
            const [lecturesRes, assignmentsRes, submissionsRes, mcqRes, mcqSubmissionsRes] = await Promise.all([
                api.get(`/courses/${courseId}/lectures`),
                api.get(`/assignments/course/${courseId}`),
                api.get('/assignments/student/submissions'),
                mcqService.getMCQTestsByCourse(courseId).catch(() => ({ data: { data: { mcq_tests: [] } } })),
                mcqService.getStudentMCQSubmissions(courseId).catch(() => ({ data: { data: { submissions: [] } } }))
            ]);

            // 1. Process Lectures & PDFs
            if (lecturesRes.data && lecturesRes.data.success && lecturesRes.data.data) {
                setLectures(lecturesRes.data.data.lectures || []);
                setPdfs(lecturesRes.data.data.pdfs || []);
            } else {
                setLectures([]);
                setPdfs([]);
            }

            // 2. Process Assignments/Tests
            if (assignmentsRes.data && assignmentsRes.data.success && assignmentsRes.data.data) {
                setAssignments(assignmentsRes.data.data.assignments || []);
            } else {
                setAssignments([]);
            }

            // 3. Process Student Submissions
            if (submissionsRes.data && submissionsRes.data.success && submissionsRes.data.data) {
                setSubmissions(submissionsRes.data.data.submissions || []);
            } else if (submissionsRes.data && Array.isArray(submissionsRes.data)) {
                setSubmissions(submissionsRes.data);
            } else {
                setSubmissions([]);
            }

            // 4. Process MCQ Tests
            if (mcqRes.data && mcqRes.data.data && mcqRes.data.data.mcq_tests) {
                setMcqTests(mcqRes.data.data.mcq_tests || []);
            } else if (mcqRes.data && Array.isArray(mcqRes.data)) {
                setMcqTests(mcqRes.data);
            } else {
                setMcqTests([]);
            }

            // 5. Process MCQ Submissions
            if (mcqSubmissionsRes.data && mcqSubmissionsRes.data.data && mcqSubmissionsRes.data.data.submissions) {
                setMcqSubmissions(mcqSubmissionsRes.data.data.submissions || []);
            } else if (mcqSubmissionsRes.data && Array.isArray(mcqSubmissionsRes.data)) {
                setMcqSubmissions(mcqSubmissionsRes.data);
            } else {
                setMcqSubmissions([]);
            }
        } catch (error) {
            console.error('Error fetching course contents:', error);
        }
    };

    // Load data on focus or select change
    useFocusEffect(
        useCallback(() => {
            fetchCourses();
        }, [])
    );

    useEffect(() => {
        if (selectedCourse) {
            fetchCourseContent(selectedCourse.course_id);
        }
    }, [selectedCourse]);

    const onRefresh = async () => {
        setRefreshing(true);
        if (selectedCourse) {
            await fetchCourseContent(selectedCourse.course_id);
        } else {
            await fetchCourses();
        }
        setRefreshing(false);
    };

    // Handle Document Picking for submissions
    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setSubmitModal(prev => ({ ...prev, file: result.assets[0] }));
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to pick attachment.');
        }
    };

    // Handle Submit Assignment upload
    const handleSubmitAnswer = async () => {
        const { assignment, file } = submitModal;
        if (!file) {
            Alert.alert('No file', 'Please select or upload a document first.');
            return;
        }

        try {
            setSubmitModal(prev => ({ ...prev, uploading: true }));

            // Submit the file URL or simulated path to the backend
            // (Uses public mock file path or URL for simple integration)
            const submitData = {
                file_url: file.uri || 'https://example.com/submitted-answer.pdf'
            };

            const response = await api.post(`/assignments/${assignment.id}/submit`, submitData);

            if (response.data && response.data.success) {
                Alert.alert('Success', 'Assignment submitted successfully!');
                setSubmitModal({ visible: false, assignment: null, file: null, uploading: false });

                // Immediately refresh database content to show "Submitted"
                if (selectedCourse) {
                    fetchCourseContent(selectedCourse.course_id);
                }
            } else {
                Alert.alert('Submission Failed', response.data.message || 'Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            Alert.alert('Submission Failed', error.message || 'Failed to connect to server.');
        } finally {
            setSubmitModal(prev => ({ ...prev, uploading: false }));
        }
    };

    // Find submission for specific assignment
    const getAssignmentSubmission = (assignmentId) => {
        return submissions.find(s => s.assignment_id === assignmentId);
    };

    // Find MCQ submission for specific test
    const getMCQSubmission = (testId) => {
        return mcqSubmissions.find(s => s.test_id === testId || s.mcq_test_id === testId);
    };

    // Handle MCQ Test Start
    const handleStartMCQTest = async (test) => {
        try {
            setMcqModal(prev => ({ ...prev, loading: true }));

            // Fetch full test details with questions
            const response = await mcqService.getMCQTest(test.id);
            const fullTest = response.data || response;

            setMcqModal({
                visible: true,
                test: fullTest,
                currentQuestion: 0,
                answers: {},
                submitted: false,
                result: null,
                loading: false
            });
        } catch (error) {
            console.error('Error loading MCQ test:', error);
            Alert.alert('Error', 'Failed to load MCQ test. Please try again.');
            setMcqModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Handle MCQ Answer Selection
    const handleSelectMCQAnswer = (questionId, optionId, isMultiple = false) => {
        setMcqModal(prev => {
            const currentAnswers = { ...prev.answers };

            if (isMultiple) {
                // For multiple choice, toggle the option
                if (!currentAnswers[questionId]) {
                    currentAnswers[questionId] = [];
                }
                const index = currentAnswers[questionId].indexOf(optionId);
                if (index > -1) {
                    currentAnswers[questionId].splice(index, 1);
                } else {
                    currentAnswers[questionId].push(optionId);
                }
            } else {
                // For single choice, replace the answer
                currentAnswers[questionId] = [optionId];
            }

            return { ...prev, answers: currentAnswers };
        });
    };

    // Handle MCQ Test Submission
    const handleSubmitMCQTest = async () => {
        const { test, answers } = mcqModal;

        if (!test || !test.questions || test.questions.length === 0) {
            Alert.alert('Error', 'Invalid test data.');
            return;
        }

        // Check if all questions are answered
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < test.questions.length) {
            Alert.alert(
                'Incomplete Test',
                `You've answered ${answeredCount}/${test.questions.length} questions. Submit anyway?`,
                [
                    { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                    { text: 'Submit', onPress: () => performMCQSubmission() }
                ]
            );
        } else {
            performMCQSubmission();
        }
    };

    // Perform actual MCQ submission
    const performMCQSubmission = async () => {
        try {
            setMcqModal(prev => ({ ...prev, loading: true }));

            const { test, answers } = mcqModal;

            // Format answers for submission
            const formattedAnswers = Object.entries(answers).map(([qid, options]) => ({
                questionId: qid,
                selectedOptions: Array.isArray(options) ? options : [options]
            }));

            const submissionData = {
                testId: test.id,
                answers: formattedAnswers
            };

            const response = await mcqService.submitMCQTest(submissionData);
            const result = response.data || response;

            // Calculate marks based on correct answers
            let marksObtained = 0;
            const evaluatedAnswers = test.questions.map(question => {
                const studentAnswers = answers[question.id] || [];
                const correctOptions = question.options
                    .filter(opt => opt.is_correct)
                    .map(opt => opt.id);

                const isCorrect = JSON.stringify(studentAnswers.sort()) ===
                    JSON.stringify(correctOptions.sort());

                if (isCorrect) {
                    marksObtained += question.marks || 1;
                }

                return {
                    ...question,
                    studentAnswers,
                    correctOptions,
                    isCorrect
                };
            });

            setMcqModal(prev => ({
                ...prev,
                submitted: true,
                result: {
                    ...result,
                    marksObtained,
                    totalMarks: test.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
                    evaluatedAnswers
                },
                loading: false
            }));

            // Refresh course content to update submission status
            if (selectedCourse) {
                fetchCourseContent(selectedCourse.course_id);
            }
        } catch (error) {
            console.error('MCQ submission error:', error);
            Alert.alert('Submission Failed', error.message || 'Failed to submit MCQ test.');
            setMcqModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Date formatting helper
    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // YouTube embed helper
    const getEmbedUrl = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=1`;
        }
        return url;
    };

    // Filter unified feed
    const renderFeedItems = () => {
        const items = [];

        // 1. Lectures (Videos)
        if (activeTab === 'all' || activeTab === 'videos') {
            lectures.forEach(lec => {
                items.push({
                    id: lec.lecture_id,
                    type: 'video',
                    title: lec.title,
                    teacher: selectedCourse.creator?.name || 'Instructor',
                    date: lec.createdAt,
                    url: lec.video_url,
                    original: lec
                });
            });
        }

        // 2. PDFs (Notes)
        if (activeTab === 'all' || activeTab === 'pdfs') {
            pdfs.forEach(pdf => {
                items.push({
                    id: pdf.id,
                    type: 'pdf',
                    title: pdf.title || 'PDF Note Resource',
                    teacher: selectedCourse.creator?.name || 'Instructor',
                    date: pdf.createdAt,
                    url: pdf.pdf_url,
                    original: pdf
                });
            });
        }

        // 3. Assignments & Tests
        if (activeTab === 'all' || activeTab === 'tasks') {
            assignments.forEach(task => {
                items.push({
                    id: task.id,
                    type: 'task',
                    title: task.title,
                    description: task.description,
                    teacher: selectedCourse.creator?.name || 'Instructor',
                    date: task.createdAt,
                    deadline: task.deadline,
                    marks: task.marks,
                    original: task
                });
            });
        }

        // 4. MCQ Tests
        if (activeTab === 'all' || activeTab === 'mcq') {
            mcqTests.forEach(mcqTest => {
                items.push({
                    id: mcqTest.id,
                    type: 'mcq',
                    title: mcqTest.title,
                    description: mcqTest.description,
                    teacher: selectedCourse.creator?.name || 'Instructor',
                    date: mcqTest.createdAt,
                    deadline: mcqTest.deadline,
                    totalQuestions: mcqTest.total_questions || mcqTest.questions?.length || 0,
                    totalMarks: mcqTest.total_marks,
                    original: mcqTest
                });
            });
        }

        // Sort by upload date (most recent first)
        items.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (items.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open" size={48} color="#334155" />
                    <Text style={styles.emptyText}>No uploaded content found under this category.</Text>
                </View>
            );
        }

        return items.map(item => {
            if (item.type === 'video') {
                return (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.typeBadgeVideo}>
                                <Ionicons name="videocam" size={12} color="#fff" />
                                <Text style={styles.badgeText}>VIDEO</Text>
                            </View>
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.teacherText}>By: {item.teacher}</Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.openBtn}
                                onPress={() => setVideoModal({ visible: true, title: item.title, url: item.url })}
                            >
                                <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnText}>Watch Lecture</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }

            if (item.type === 'pdf') {
                return (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.typeBadgePdf}>
                                <Ionicons name="document-text" size={12} color="#fff" />
                                <Text style={styles.badgeText}>NOTE / PDF</Text>
                            </View>
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.teacherText}>By: {item.teacher}</Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.openBtn, { backgroundColor: '#10B981' }]}
                                onPress={() => setPdfModal({ visible: true, title: item.title, url: item.url })}
                            >
                                <Ionicons name="book" size={14} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnText}>Read Notes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }

            if (item.type === 'task') {
                const sub = getAssignmentSubmission(item.id);
                const isGradesChecked = sub && sub.marks_obtained !== null;

                return (
                    <View key={item.id} style={[styles.card, styles.taskCard]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.typeBadgeTask}>
                                <Ionicons name="create" size={12} color="#fff" />
                                <Text style={styles.badgeText}>TEST / TASK</Text>
                            </View>
                            <Text style={styles.dateText}>Due: {formatDate(item.deadline)}</Text>
                        </View>

                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.description ? <Text style={styles.descText} numberOfLines={2}>{item.description}</Text> : null}
                        <Text style={styles.teacherText}>By: {item.teacher}</Text>

                        {/* Marks & Submission Status */}
                        <View style={styles.marksSection}>
                            <Text style={styles.marksTitle}>MARKS & SUBMISSION STATUS</Text>

                            <View style={styles.statusBadgeRow}>
                                <View style={[
                                    styles.subStatusBadge,
                                    { backgroundColor: sub ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)' }
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: sub ? '#6366F1' : '#F59E0B' }
                                    ]} />
                                    <Text style={[styles.subStatusText, { color: sub ? '#A5B4FC' : '#FBBF24' }]}>
                                        {sub ? 'Submitted' : 'Not Submitted'}
                                    </Text>
                                </View>

                                {isGradesChecked && (
                                    <View style={styles.gradeBadge}>
                                        <Text style={styles.gradeBadgeText}>
                                            Obtained: {sub.marks_obtained} / {item.marks}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Show teacher feedback if available */}
                            {sub && sub.feedback ? (
                                <Text style={styles.teacherFeedback}>
                                    💬 Feedback: "{sub.feedback}"
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.submitBtn, sub && styles.resubmitBtn]}
                                onPress={() => setSubmitModal({ visible: true, assignment: item, file: null, uploading: false })}
                            >
                                <Ionicons name="cloud-upload" size={14} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnText}>
                                    {sub ? 'Resubmit Test' : 'Submit Answers'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }

            if (item.type === 'mcq') {
                const submission = getMCQSubmission(item.id);
                const isCompleted = submission && submission.submitted_at;

                return (
                    <View key={item.id} style={[styles.card, styles.mcqCard]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.typeBadgeMCQ}>
                                <Ionicons name="checkbox" size={12} color="#fff" />
                                <Text style={styles.badgeText}>MCQ TEST</Text>
                            </View>
                            <Text style={styles.dateText}>Due: {formatDate(item.deadline)}</Text>
                        </View>

                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.description ? <Text style={styles.descText} numberOfLines={2}>{item.description}</Text> : null}
                        <Text style={styles.teacherText}>By: {item.teacher}</Text>

                        {/* Test Info & Status */}
                        <View style={styles.marksSection}>
                            <Text style={styles.marksTitle}>TEST DETAILS</Text>

                            <View style={styles.testInfoRow}>
                                <View style={styles.testInfo}>
                                    <Ionicons name="help-circle" size={16} color="#A5B4FC" />
                                    <Text style={styles.testInfoText}>{item.totalQuestions} Questions</Text>
                                </View>
                                <View style={styles.testInfo}>
                                    <Ionicons name="star" size={16} color="#F59E0B" />
                                    <Text style={styles.testInfoText}>{item.totalMarks} Marks</Text>
                                </View>
                            </View>

                            <View style={styles.statusBadgeRow}>
                                <View style={[
                                    styles.subStatusBadge,
                                    { backgroundColor: isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: isCompleted ? '#10B981' : '#F59E0B' }
                                    ]} />
                                    <Text style={[styles.subStatusText, { color: isCompleted ? '#86EFAC' : '#FBBF24' }]}>
                                        {isCompleted ? 'Submitted' : 'Not Submitted'}
                                    </Text>
                                </View>

                                {isCompleted && submission.marks_obtained !== null && (
                                    <View style={styles.gradeBadge}>
                                        <Text style={styles.gradeBadgeText}>
                                            Score: {submission.marks_obtained} / {item.totalMarks}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {isCompleted && submission.feedback && (
                                <Text style={styles.teacherFeedback}>
                                    💬 Feedback: "{submission.feedback}"
                                </Text>
                            )}
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.submitBtn, isCompleted && styles.resubmitBtn]}
                                onPress={() => handleStartMCQTest(item.original)}
                            >
                                <Ionicons name={isCompleted ? "refresh" : "play"} size={14} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnText}>
                                    {isCompleted ? 'View Results' : 'Take Test'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            }
        });
    };

    if (loading && courses.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Connecting to Learning Portal...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

            {/* Dashboard Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Learning Portal</Text>
                    <Text style={styles.headerSub}>Real-time Teacher-Uploaded Syllabus</Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={fetchCourses}
                >
                    <Ionicons name="sync" size={20} color="#6366F1" />
                </TouchableOpacity>
            </View>

            {/* Subjects / Courses Slider */}
            <View style={styles.subjectsSection}>
                <Text style={styles.sectionLabel}>SELECT SUBJECT</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.subjectsScroll}
                >
                    {courses.map(course => {
                        const isSelected = selectedCourse && selectedCourse.course_id === course.course_id;
                        return (
                            <TouchableOpacity
                                key={course.course_id}
                                style={[styles.subjectChip, isSelected && styles.subjectChipActive]}
                                onPress={() => setSelectedCourse(course)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="book"
                                    size={14}
                                    color={isSelected ? '#fff' : '#64748B'}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.subjectChipText, isSelected && styles.subjectChipTextActive]}>
                                    {course.title}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Filtering tab row */}
            <View style={styles.tabsRow}>
                {['all', 'videos', 'pdfs', 'tasks', 'mcq'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                            {tab === 'all' ? 'Show All' : tab === 'videos' ? 'Videos' : tab === 'pdfs' ? 'PDF Notes' : tab === 'tasks' ? 'Assignments' : 'MCQ Tests'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Unified Syllabus feed */}
            <ScrollView
                contentContainerStyle={styles.feedContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
                }
            >
                {selectedCourse ? (
                    renderFeedItems()
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="school" size={48} color="#334155" />
                        <Text style={styles.emptyText}>You are not enrolled in any courses yet.</Text>
                    </View>
                )}
            </ScrollView>

            {/* ──── VIDEO PLAYER MODAL ──── */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={videoModal.visible}
                onRequestClose={() => setVideoModal({ visible: false, title: '', url: '' })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.videoModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={1}>{videoModal.title}</Text>
                            <TouchableOpacity onPress={() => setVideoModal({ visible: false, title: '', url: '' })}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.playerWrapper}>
                            {videoModal.url && (videoModal.url.includes('youtube.com') || videoModal.url.includes('youtu.be')) ? (
                                <WebView
                                    source={{ uri: getEmbedUrl(videoModal.url) }}
                                    style={{ flex: 1 }}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                />
                            ) : (
                                <VideoView
                                    player={modalPlayer}
                                    style={{ flex: 1 }}
                                    contentFit="contain"
                                    nativeControls
                                    allowsFullscreen
                                />
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ──── PDF NOTE VIEWER MODAL ──── */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={pdfModal.visible}
                onRequestClose={() => setPdfModal({ visible: false, title: '', url: '' })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pdfModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={1}>{pdfModal.title}</Text>
                            <TouchableOpacity onPress={() => setPdfModal({ visible: false, title: '', url: '' })}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.pdfWrapper}>
                            {pdfModal.url && (
                                <WebView
                                    source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfModal.url)}` }}
                                    style={{ flex: 1 }}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ──── SUBMISSION PORTAL MODAL ──── */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={submitModal.visible}
                onRequestClose={() => setSubmitModal({ visible: false, assignment: null, file: null, uploading: false })}
            >
                <View style={styles.modalOverlayBottom}>
                    <View style={styles.submitModalSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Test Answer Submission</Text>
                            <TouchableOpacity
                                onPress={() => setSubmitModal({ visible: false, assignment: null, file: null, uploading: false })}
                            >
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {submitModal.assignment && (
                            <View style={styles.sheetDetails}>
                                <Text style={styles.sheetTopic}>Topic: {submitModal.assignment.title}</Text>
                                <Text style={styles.sheetMarks}>Total Weightage: {submitModal.assignment.marks} Marks</Text>
                            </View>
                        )}

                        <Text style={styles.label}>ATTACH YOUR ANSWER SHEET (PDF or Image)</Text>

                        {!submitModal.file ? (
                            <TouchableOpacity
                                style={styles.filePickerArea}
                                onPress={handlePickDocument}
                            >
                                <Ionicons name="cloud-upload-outline" size={42} color="#6366F1" />
                                <Text style={styles.pickerMainText}>Select Document / Photo</Text>
                                <Text style={styles.pickerSubText}>PDF, JPG, or PNG under 20MB</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.selectedFileBox}>
                                <Ionicons name="document" size={24} color="#10B981" />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.selectedFileName} numberOfLines={1}>
                                        {submitModal.file.name}
                                    </Text>
                                    <Text style={styles.selectedFileSize}>
                                        {(submitModal.file.size / (1024 * 1024)).toFixed(2)} MB
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSubmitModal(prev => ({ ...prev, file: null }))}
                                >
                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {submitModal.uploading ? (
                            <View style={styles.submitUploadIndicator}>
                                <ActivityIndicator size="small" color="#6366F1" style={{ marginRight: 10 }} />
                                <Text style={styles.uploadingText}>Uploading answers to server...</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.submitFinalBtn, !submitModal.file && styles.submitFinalBtnDisabled]}
                                onPress={handleSubmitAnswer}
                                disabled={!submitModal.file}
                            >
                                <Text style={styles.submitFinalBtnText}>Upload & Submit Answer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ──── MCQ TEST MODAL ──── */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={mcqModal.visible}
                onRequestClose={() => setMcqModal({ visible: false, test: null, currentQuestion: 0, answers: {}, submitted: false, result: null, loading: false })}
            >
                <View style={styles.mcqModalOverlay}>
                    {mcqModal.test && mcqModal.test.questions && mcqModal.test.questions.length > 0 ? (
                        <View style={styles.mcqModalContent}>
                            {/* Header */}
                            <View style={styles.mcqHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mcqHeaderTitle} numberOfLines={1}>
                                        {mcqModal.test.title}
                                    </Text>
                                    <Text style={styles.mcqHeaderSub}>
                                        Question {mcqModal.currentQuestion + 1} of {mcqModal.test.questions.length}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setMcqModal({ visible: false, test: null, currentQuestion: 0, answers: {}, submitted: false, result: null, loading: false })}
                                >
                                    <Ionicons name="close" size={24} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            {/* Results View */}
                            {mcqModal.submitted && mcqModal.result ? (
                                <ScrollView style={styles.mcqResultsContainer} showsVerticalScrollIndicator={false}>
                                    {/* Score Card */}
                                    <View style={styles.scoreCard}>
                                        <Text style={styles.scoreTitle}>Test Completed!</Text>
                                        <View style={styles.scoreDisplay}>
                                            <Text style={styles.scoreNumber}>
                                                {mcqModal.result.marksObtained}/{mcqModal.result.totalMarks}
                                            </Text>
                                            <Text style={styles.scorePercent}>
                                                ({Math.round((mcqModal.result.marksObtained / mcqModal.result.totalMarks) * 100)}%)
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Evaluated Answers */}
                                    {mcqModal.result.evaluatedAnswers && mcqModal.result.evaluatedAnswers.map((question, idx) => (
                                        <View key={question.id} style={styles.evaluatedQuestion}>
                                            <View style={styles.questionHeader}>
                                                <View style={[
                                                    styles.questionNumberBadge,
                                                    { backgroundColor: question.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }
                                                ]}>
                                                    <Ionicons
                                                        name={question.isCorrect ? "checkmark-circle" : "close-circle"}
                                                        size={20}
                                                        color={question.isCorrect ? '#10B981' : '#EF4444'}
                                                    />
                                                </View>
                                                <Text style={styles.evaluatedQuestionText} numberOfLines={3}>
                                                    Q{idx + 1}. {question.question_text || question.text}
                                                </Text>
                                            </View>

                                            {/* Options */}
                                            {question.options && question.options.map(option => {
                                                const isStudentAnswer = question.studentAnswers.includes(option.id);
                                                const isCorrect = option.is_correct;

                                                return (
                                                    <View
                                                        key={option.id}
                                                        style={[
                                                            styles.resultOption,
                                                            isStudentAnswer && isCorrect && styles.resultOptionCorrect,
                                                            isStudentAnswer && !isCorrect && styles.resultOptionIncorrect,
                                                            !isStudentAnswer && isCorrect && styles.resultOptionShowCorrect
                                                        ]}
                                                    >
                                                        <View style={[
                                                            styles.resultOptionDot,
                                                            isStudentAnswer && isCorrect && { backgroundColor: '#10B981' },
                                                            isStudentAnswer && !isCorrect && { backgroundColor: '#EF4444' },
                                                            !isStudentAnswer && isCorrect && { backgroundColor: '#10B981' }
                                                        ]} />
                                                        <Text style={styles.resultOptionText}>
                                                            {option.option_text || option.text}
                                                        </Text>
                                                        {isStudentAnswer && isCorrect && <Ionicons name="checkmark" size={18} color="#10B981" />}
                                                        {isStudentAnswer && !isCorrect && <Ionicons name="close" size={18} color="#EF4444" />}
                                                        {!isStudentAnswer && isCorrect && <Text style={styles.correctTag}>✓ Correct</Text>}
                                                    </View>
                                                );
                                            })}

                                            {/* Explanation */}
                                            {question.explanation && (
                                                <View style={styles.explanationBox}>
                                                    <Text style={styles.explanationTitle}>💡 Explanation:</Text>
                                                    <Text style={styles.explanationText}>{question.explanation}</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </ScrollView>
                            ) : (
                                /* Question View */
                                <ScrollView style={styles.mcqQuestionsContainer} showsVerticalScrollIndicator={false}>
                                    {mcqModal.test.questions[mcqModal.currentQuestion] && (
                                        <View style={styles.questionContainer}>
                                            {/* Question Text */}
                                            <View style={styles.questionBox}>
                                                <Text style={styles.questionText}>
                                                    {mcqModal.test.questions[mcqModal.currentQuestion].question_text ||
                                                        mcqModal.test.questions[mcqModal.currentQuestion].text}
                                                </Text>
                                            </View>

                                            {/* Options */}
                                            <View style={styles.optionsContainer}>
                                                {mcqModal.test.questions[mcqModal.currentQuestion].options &&
                                                    mcqModal.test.questions[mcqModal.currentQuestion].options.map(option => {
                                                        const isSelected = mcqModal.answers[mcqModal.test.questions[mcqModal.currentQuestion].id]?.includes(option.id);

                                                        return (
                                                            <TouchableOpacity
                                                                key={option.id}
                                                                style={[
                                                                    styles.optionButton,
                                                                    isSelected && styles.optionButtonSelected
                                                                ]}
                                                                onPress={() => handleSelectMCQAnswer(
                                                                    mcqModal.test.questions[mcqModal.currentQuestion].id,
                                                                    option.id,
                                                                    mcqModal.test.questions[mcqModal.currentQuestion].type === 'multiple'
                                                                )}
                                                                activeOpacity={0.7}
                                                            >
                                                                <View style={[
                                                                    styles.optionRadio,
                                                                    isSelected && styles.optionRadioSelected
                                                                ]}>
                                                                    {isSelected && <View style={styles.optionRadioDot} />}
                                                                </View>
                                                                <Text style={[
                                                                    styles.optionText,
                                                                    isSelected && styles.optionTextSelected
                                                                ]}>
                                                                    {option.option_text || option.text}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                            </View>
                                        </View>
                                    )}
                                </ScrollView>
                            )}

                            {/* Navigation & Submit */}
                            <View style={styles.mcqFooter}>
                                {!mcqModal.submitted ? (
                                    <>
                                        <View style={styles.mcqNavigation}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.mcqNavBtn,
                                                    mcqModal.currentQuestion === 0 && styles.mcqNavBtnDisabled
                                                ]}
                                                onPress={() => setMcqModal(prev => ({
                                                    ...prev,
                                                    currentQuestion: Math.max(0, prev.currentQuestion - 1)
                                                }))}
                                                disabled={mcqModal.currentQuestion === 0}
                                            >
                                                <Ionicons name="chevron-back" size={20} color="#fff" />
                                                <Text style={styles.mcqNavBtnText}>Previous</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.mcqNavBtn,
                                                    mcqModal.currentQuestion === mcqModal.test.questions.length - 1 && styles.mcqNavBtnDisabled
                                                ]}
                                                onPress={() => setMcqModal(prev => ({
                                                    ...prev,
                                                    currentQuestion: Math.min(
                                                        prev.test.questions.length - 1,
                                                        prev.currentQuestion + 1
                                                    )
                                                }))}
                                                disabled={mcqModal.currentQuestion === mcqModal.test.questions.length - 1}
                                            >
                                                <Text style={styles.mcqNavBtnText}>Next</Text>
                                                <Ionicons name="chevron-forward" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.mcqSubmitBtn, mcqModal.loading && { opacity: 0.6 }]}
                                            onPress={handleSubmitMCQTest}
                                            disabled={mcqModal.loading}
                                        >
                                            {mcqModal.loading ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                                    <Text style={styles.mcqSubmitBtnText}>Submitting...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                                                    <Text style={styles.mcqSubmitBtnText}>Submit Test</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.mcqCloseBtn}
                                        onPress={() => setMcqModal({ visible: false, test: null, currentQuestion: 0, answers: {}, submitted: false, result: null, loading: false })}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.mcqCloseBtnText}>Close Results</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.mcqLoadingContainer}>
                            <ActivityIndicator size="large" color="#6366F1" />
                            <Text style={styles.mcqLoadingText}>Loading test...</Text>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Core Layout
    container: {
        flex: 1,
        backgroundColor: '#071120',
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: '#071120',
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        color: '#94A3B8',
        fontSize: 15,
        marginTop: 16,
        fontWeight: '700',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 18,
        backgroundColor: '#071120',
    },

    headerTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.8,
        flexShrink: 1,
    },


    headerSub: {
        color: '#7C8BA1',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    refreshBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: 'rgba(99,102,241,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99,102,241,0.25)',
        marginLeft: 12,
    },

    // Subjects Section
    subjectsSection: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },

    sectionLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        paddingHorizontal: 20,
        marginBottom: 14,
    },

    subjectsScroll: {
        paddingHorizontal: 20,
    },

    subjectChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: '#111C2E',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginRight: 10,
    },

    subjectChipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },

    subjectChipText: {
        color: '#CBD5E1',
        fontSize: 13,
        fontWeight: '700',
    },

    subjectChipTextActive: {
        color: '#FFFFFF',
    },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
    },

    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111C2E',
    },

    tabButtonActive: {
        backgroundColor: '#6366F1',
    },


    tabButtonText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
    },

    tabButtonTextActive: {
        color: '#FFFFFF',
    },

    // Feed
    feedContent: {
        padding: 18,
        paddingBottom: 120,
    },

    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
    },

    emptyText: {
        color: '#94A3B8',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 18,
        lineHeight: 25,
        paddingHorizontal: 24,
    },

    // Cards
    card: {
        backgroundColor: '#111827',
        borderRadius: 26,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },

    taskCard: {
        borderColor: 'rgba(99,102,241,0.15)',
    },

    mcqCard: {
        borderColor: 'rgba(139,92,246,0.18)',
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },

    // Badges
    typeBadgeVideo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    typeBadgePdf: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    typeBadgeTask: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    typeBadgeMCQ: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },

    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 5,
    },

    dateText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
    },

    // Typography
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 30,
        marginTop: 10,
    },

    descText: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 22,
        marginTop: 8,
    },

    teacherText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },

    // Buttons
    actionRow: {
        marginTop: 16,
    },

    openBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        borderRadius: 18,
    },

    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F59E0B',
        paddingVertical: 16,
        borderRadius: 18,
    },

    resubmitBtn: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },

    btnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    // Status Area
    marksSection: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 14,
        borderRadius: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    marksTitle: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 10,
    },

    statusBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
    },

    subStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },

    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },

    subStatusText: {
        fontSize: 12,
        fontWeight: '800',
    },

    gradeBadge: {
        backgroundColor: 'rgba(16,185,129,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },

    gradeBadgeText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '800',
    },

    teacherFeedback: {
        color: '#CBD5E1',
        fontSize: 13,
        marginTop: 12,
        lineHeight: 20,
        fontStyle: 'italic',
    },
});

export default MyLearningScreen;
