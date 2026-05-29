/**
 * QuizScreen.js — High-Fidelity MCQ Testing Engine
 * Features real-time interactive countdown timers, dynamic quiz generator,
 * option selector, instant reviews, and premium results analytics page.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Context-aware MCQ Database
const MOCK_QUESTIONS = {
    python: [
        {
            q: "Which of the following data structures in Python is mutable?",
            opts: ["Tuple", "List", "String", "Integer"],
            ans: 1
        },
        {
            q: "What does the 'yield' keyword do in a function definition?",
            opts: ["Terminates the function", "Returns a generator object", "Creates a class static variable", "Imports an external file"],
            ans: 1
        },
        {
            q: "Which decorator is used to declare a static method inside a class?",
            opts: ["@classmethod", "@static", "@staticmethod", "@property"],
            ans: 2
        },
        {
            q: "How do you declare a dictionary in Python?",
            opts: ["{ }", "[ ]", "( )", "< >"],
            ans: 0
        },
        {
            q: "What is the output of len([1, 2, [3, 4]])?",
            opts: ["4", "3", "2", "Error"],
            ans: 1
        }
    ],
    rn: [
        {
            q: "Which element is the basic building block of user interface in React Native?",
            opts: ["<Div>", "<View>", "<Text>", "<Panel>"],
            ans: 1
        },
        {
            q: "How does React Native navigate between screens?",
            opts: ["HTML href link", "React Router Dom", "React Navigation Stack", "Browser History API"],
            ans: 2
        },
        {
            q: "What is Expo in the context of React Native development?",
            opts: ["A JavaScript framework", "A set of tools & services built around React Native", "A database engine", "A CSS library"],
            ans: 1
        },
        {
            q: "Which prop is used to apply inline styles in React Native?",
            opts: ["class", "className", "style", "styles"],
            ans: 2
        }
    ],
    default: [
        {
            q: "What is the primary function of a database index?",
            opts: ["To compress tables", "To speed up query performance", "To prevent syntax errors", "To secure passwords"],
            ans: 1
        },
        {
            q: "Which protocol is used for encrypted secure web traffic?",
            opts: ["HTTP", "FTP", "HTTPS", "SMTP"],
            ans: 2
        },
        {
            q: "What does API stand for?",
            opts: ["Application Programming Interface", "Advanced Protocol Integrator", "Apex Process Indicator", "Automated Pattern Indexer"],
            ans: 0
        }
    ]
};

const QuizScreen = ({ route, navigation }) => {
    const { course, quiz } = route.params;

    // Detect quiz topic for customized high-fidelity questions
    const getQuestions = () => {
        const titleLower = quiz.title.toLowerCase();
        if (titleLower.includes('python') || titleLower.includes('basics')) return MOCK_QUESTIONS.python;
        if (titleLower.includes('react') || titleLower.includes('native') || titleLower.includes('rn')) return MOCK_QUESTIONS.rn;
        return MOCK_QUESTIONS.default;
    };

    const questions = getQuestions();
    
    // States
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [secondsLeft, setSecondsLeft] = useState(quiz.duration * 60);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);

    // Anim
    const progressWidth = useRef(new Animated.Value(0)).current;

    // Timer effect
    useEffect(() => {
        if (isFinished) return;

        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmitQuiz(true); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isFinished]);

    // Animate progress bar
    useEffect(() => {
        Animated.timing(progressWidth, {
            toValue: (currentIdx + 1) / questions.length,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [currentIdx]);

    const handleSelectOption = (optIdx) => {
        const updated = [...answers];
        updated[currentIdx] = optIdx;
        setAnswers(updated);
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        }
    };

    const handleSubmitQuiz = (isAuto = false) => {
        // Calculate score
        let correctCount = 0;
        answers.forEach((ans, idx) => {
            if (ans === questions[idx].ans) {
                correctCount += 1;
            }
        });
        
        const finalScore = Math.round((correctCount / questions.length) * quiz.maxScore);
        setScore(finalScore);
        setIsFinished(true);

        // Update in mock memory/state
        quiz.status = 'completed';
        quiz.score = finalScore;

        if (isAuto) {
            Alert.alert('Time Up!', 'Your quiz has been automatically submitted.');
        } else {
            Alert.alert('Submitted!', 'Your quiz results are ready.');
        }
    };

    // Format timer display
    const formatTime = (totalSecs) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isFinished) {
        const percentage = Math.round((score / quiz.maxScore) * 100);
        const passed = percentage >= 50;

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#070A13" />
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultEmoji}>{passed ? '🎉' : '📚'}</Text>
                    <Text style={styles.resultHeader}>{passed ? 'Quiz Completed!' : 'Keep Practicing!'}</Text>
                    <Text style={styles.resultSub}>{quiz.title}</Text>

                    {/* Stats ring card */}
                    <View style={styles.resultScoreCard}>
                        <Text style={styles.scoreTitle}>YOUR SCORE</Text>
                        <Text style={[styles.scoreNumber, { color: passed ? '#10B981' : '#EF4444' }]}>
                            {score} <Text style={styles.scoreOutOf}>/ {quiz.maxScore}</Text>
                        </Text>
                        <Text style={styles.scoreDetails}>
                            {percentage}% accuracy · {answers.filter((a, i) => a === questions[i].ans).length} of {questions.length} correct
                        </Text>
                    </View>

                    <ScrollView style={styles.reviewList} showsVerticalScrollIndicator={false}>
                        <Text style={styles.reviewTitle}>Question Review</Text>
                        {questions.map((q, idx) => {
                            const isCorrect = answers[idx] === q.ans;
                            return (
                                <View key={idx} style={[styles.reviewItem, { borderLeftColor: isCorrect ? '#10B981' : '#EF4444' }]}>
                                    <Text style={styles.reviewQ}>Q{idx + 1}: {q.q}</Text>
                                    <Text style={[styles.reviewAnswerText, { color: isCorrect ? '#10B981' : '#EF4444' }]}>
                                        Your Ans: {answers[idx] !== null ? q.opts[answers[idx]] : 'Skipped'}
                                    </Text>
                                    {!isCorrect && (
                                        <Text style={styles.correctAnswerText}>
                                            Correct: {q.opts[q.ans]}
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.doneBtn} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.doneBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentQuestion = questions[currentIdx];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#070A13" />

            {/* Header / Timer */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => {
                    Alert.alert(
                        'Quit Quiz?',
                        'Are you sure you want to exit? Your progress will be lost.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Exit', onPress: () => navigation.goBack() }
                        ]
                    );
                }}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.timerContainer}>
                    <Ionicons name="time" size={16} color="#6366F1" />
                    <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
                </View>
            </View>

            {/* Progress fill animation bar */}
            <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, {
                    width: progressWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                    })
                }]} />
            </View>

            {/* Question Body */}
            <View style={styles.quizBody}>
                <Text style={styles.questionCounter}>QUESTION {currentIdx + 1} OF {questions.length}</Text>
                <Text style={styles.questionText}>{currentQuestion.q}</Text>

                <View style={styles.optionsContainer}>
                    {currentQuestion.opts.map((opt, oIdx) => {
                        const isSelected = answers[currentIdx] === oIdx;
                        return (
                            <TouchableOpacity
                                key={oIdx}
                                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                                onPress={() => handleSelectOption(oIdx)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.optionDot, isSelected && styles.optionDotSelected]}>
                                    {isSelected && <View style={styles.optionInnerDot} />}
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navContainer}>
                <TouchableOpacity 
                    style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]} 
                    onPress={handlePrev}
                    disabled={currentIdx === 0}
                >
                    <Ionicons name="arrow-back" size={18} color={currentIdx === 0 ? '#475569' : '#fff'} />
                    <Text style={[styles.navBtnText, currentIdx === 0 && { color: '#475569' }]}>Prev</Text>
                </TouchableOpacity>

                {currentIdx < questions.length - 1 ? (
                    <TouchableOpacity 
                        style={styles.navBtn} 
                        onPress={handleNext}
                    >
                        <Text style={styles.navBtnText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.navBtn, { backgroundColor: '#10B981' }]} 
                        onPress={() => handleSubmitQuiz(false)}
                    >
                        <Text style={styles.navBtnText}>Submit</Text>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070A13' },
    
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0F172A' },
    backBtn: { padding: 4 },
    timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    timerText: { color: '#A5B4FC', fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },

    progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.04)' },
    progressBarFill: { height: '100%', backgroundColor: '#6366F1' },

    // Question Body
    quizBody: { flex: 1, padding: 24, gap: 16 },
    questionCounter: { color: '#6366F1', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    questionText: { color: '#F1F5F9', fontSize: 18, fontWeight: '800', lineHeight: 26 },
    optionsContainer: { gap: 10, marginTop: 14 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 },
    optionBtnSelected: { borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.06)' },
    optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
    optionDotSelected: { borderColor: '#6366F1' },
    optionInnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' },
    optionText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
    optionTextSelected: { color: '#F1F5F9', fontWeight: '800' },

    // Navigation
    navContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0F172A' },
    navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
    navBtnDisabled: { backgroundColor: '#1E293B', opacity: 0.5 },
    navBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    // Results Page
    resultsContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
    resultEmoji: { fontSize: 64 },
    resultHeader: { color: '#F1F5F9', fontSize: 22, fontWeight: '900' },
    resultSub: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    resultScoreCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, width: '100%', alignItems: 'center', gap: 6, marginTop: 12 },
    scoreTitle: { color: '#64748B', fontSize: 10, fontWeight: '850', letterSpacing: 1 },
    scoreNumber: { fontSize: 36, fontWeight: '900' },
    scoreOutOf: { fontSize: 18, color: '#64748B' },
    scoreDetails: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    reviewList: { width: '100%', flex: 1, marginTop: 16 },
    reviewTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '800', marginBottom: 10 },
    reviewItem: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, borderLeftWidth: 3, marginBottom: 8, gap: 4 },
    reviewQ: { color: '#F1F5F9', fontSize: 12, fontWeight: '750' },
    reviewAnswerText: { fontSize: 11, fontWeight: '700' },
    correctAnswerText: { color: '#10B981', fontSize: 11, fontWeight: '700' },

    doneBtn: { backgroundColor: '#6366F1', paddingVertical: 14, width: '100%', borderRadius: 12, alignItems: 'center', marginTop: 16 },
    doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});

export default QuizScreen;
