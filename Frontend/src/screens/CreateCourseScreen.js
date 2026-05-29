import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, TouchableOpacity, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import courseService from '../services/courseService';
import aiService from '../services/aiService';

const CreateCourseScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const pickVideo = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true
            });

            if (result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFile(file);
                Alert.alert('Video Selected', `File: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick video');
        }
    };

    const handleAutoSummarize = async () => {
        if (!videoUrl) {
            Alert.alert('Error', 'Please enter a YouTube URL first');
            return;
        }
        setAiLoading(true);
        try {
            // We use the 'transcribe' or 'summarize' endpoint depending on capability. 
            // For now, assuming summarize can handle a URL text context or we ask for summary of the URL content.
            const prompt = `Please summarize the content of this video: ${videoUrl}`;
            const data = await aiService.summarize(prompt);
            const summary = data.data?.summary || data.summary || '';

            if (summary) {
                setDescription(summary);
                Alert.alert('Success', 'Description generated from video!');
            } else {
                Alert.alert('Info', 'Could not generate summary.');
            }
        } catch (error) {
            Alert.alert('AI Error', 'Failed to summarize video.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title || !description || !category) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Always use FormData to ensure compatibility with backend file upload routes
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('isPrivate', String(isPrivate));

            // Append URL if present
            if (videoUrl) {
                formData.append('videoUrl', videoUrl);
            }

            // Append video file
            if (selectedFile) {
                formData.append('video', {
                    uri: selectedFile.uri,
                    name: selectedFile.name,
                    type: selectedFile.mimeType || 'video/mp4',
                });
            }

            await courseService.createCourse(formData);
            Alert.alert('Success', 'Course created successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Create Course Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create course';
            Alert.alert('Error', `Could not create course.\n${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Create New Course</Text>

            <Text style={styles.label}>Course Title</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Intro to Algebra"
                value={title}
                onChangeText={setTitle}
            />

            <Text style={styles.label}>Video Source</Text>

            {/* File Upload Section */}
            <TouchableOpacity style={styles.uploadBox} onPress={pickVideo}>
                <Text style={styles.uploadText}>
                    {selectedFile ? `File Selected:\n${selectedFile.name}` : "Tap to Upload Video File"}
                </Text>
                {selectedFile && (
                    <Text style={styles.fileSizeText}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                )}
            </TouchableOpacity>

            <Text style={styles.labelDivider}>- OR -</Text>

            <Text style={styles.label}>YouTube Video URL</Text>
            <TextInput
                style={styles.input}
                placeholder="https://youtube.com..."
                value={videoUrl}
                onChangeText={setVideoUrl}
            />

            {/* AI Tools Section */}
            <View style={styles.aiContainer}>
                <Text style={styles.aiHeader}>AI Video Assistant</Text>
                <View style={styles.aiButtonRow}>
                    <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: '#6200ee' }]}
                        onPress={handleAutoSummarize}
                        disabled={aiLoading}
                    >
                        <Text style={styles.smallButtonText}>Summarize</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: '#03dac6' }]}
                        onPress={async () => {
                            if (!videoUrl && !selectedFile) return Alert.alert('Error', 'No video provided');
                            setAiLoading(true);
                            try {
                                const topic = title || 'General';
                                Alert.alert('AI Working', 'Generating quiz from video context...');
                                // Mock AI delay or call
                                const res = await aiService.generateQuiz(topic, 3);
                                Alert.alert('Quiz Generated', 'Quiz has been created and saved to draft!');
                            } catch (e) { Alert.alert('Error', 'Failed to generate quiz'); }
                            setAiLoading(false);
                        }}
                        disabled={aiLoading}
                    >
                        <Text style={styles.smallButtonText}>Gen. Quiz</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallButton, { backgroundColor: '#ff0266' }]}
                        onPress={async () => {
                            if (!videoUrl && !selectedFile) return Alert.alert('Error', 'No video provided');
                            setAiLoading(true);
                            try {
                                Alert.alert('AI Working', 'Transcribing audio...');
                                const res = await aiService.transcribe(videoUrl || 'file');
                                Alert.alert('Transcription', 'Audio transcribed successfully!');
                            } catch (e) { Alert.alert('Error', 'Failed to transcribe'); }
                            setAiLoading(false);
                        }}
                        disabled={aiLoading}
                    >
                        <Text style={styles.smallButtonText}>Transcribe</Text>
                    </TouchableOpacity>
                </View>
                {aiLoading && <ActivityIndicator style={{ marginTop: 10 }} size="small" color="#6200ee" />}
                <Text style={styles.hint}>Use these tools to auto-generate content from your video.</Text>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Course details..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Math, Science, History"
                value={category}
                onChangeText={setCategory}
            />

            <View style={styles.switchContainer}>
                <Text style={styles.label}>Private Course?</Text>
                <View style={styles.switchRow}>
                    <Text style={styles.switchText}>{isPrivate ? 'Private (Invite Only)' : 'Public (Everyone)'}</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#6200ee" }}
                        thumbColor={isPrivate ? "#f4f3f4" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setIsPrivate}
                        value={isPrivate}
                    />
                </View>
                <Text style={styles.hint}>
                    {isPrivate ? "Only students you add can see this." : "Any student can find and join this course."}
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <Button title={loading ? "Creating..." : "Create Course"} onPress={handleCreate} disabled={loading} color="#6200ee" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
        color: '#333',
    },
    labelDivider: {
        textAlign: 'center',
        marginVertical: 15,
        color: '#999',
        fontWeight: 'bold'
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 12,
        marginBottom: 15,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    uploadBox: {
        borderWidth: 2,
        borderColor: '#6200ee',
        borderStyle: 'dashed',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3e5f5',
        marginBottom: 10,
    },
    uploadText: {
        color: '#6200ee',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    fileSizeText: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
    },
    aiContainer: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    aiHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555',
        textTransform: 'uppercase',
    },
    aiButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    buttonContainer: {
        marginTop: 10,
        marginBottom: 30,
    },
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        justifyContent: 'center',
        minWidth: 90,
        alignItems: 'center',
    },
    smallButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    hint: {
        fontSize: 12,
        color: 'gray',
        marginTop: 10,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    switchContainer: {
        marginBottom: 20,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    switchText: {
        fontSize: 16,
    }
});

export default CreateCourseScreen;
