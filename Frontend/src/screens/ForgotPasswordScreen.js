import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

import authService from '../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify & Reset
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOtp = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await authService.sendOtp(email);
            Alert.alert('OTP Sent', `We sent a 4-digit code to ${email}`);
            setStep(2); // Move to next step
        } catch (error) {
            // Check if error message indicates user not found
            if (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('invalid')) {
                setInvalidEmail(true);
                Alert.alert('Invalid Email', 'This email is not registered. Please create an account.');
            } else {
                Alert.alert('Error', error.message || 'Failed to send OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async () => {
        if (otp.length !== 4) {
            Alert.alert('Validation Error', 'Please enter the 4-digit OTP');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Validation Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(email, otp, newPassword);
            Alert.alert(
                'Success',
                'Your password has been reset successfully!',
                [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            Alert.alert('Reset Failed', error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.formWrapper}>
                    <View style={styles.formContainer}>
                        <Text style={styles.logoText}>AI LearnMate</Text>

                        {step === 1 ? (
                            <>
                                <Text style={styles.title}>Reset Password</Text>
                                <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>

                                <TextInput
                                    style={[
                                        styles.input,
                                        invalidEmail ? { borderColor: 'red', borderWidth: 2 } : null
                                    ]}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); setInvalidEmail(false); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <View style={styles.actionContainer}>
                                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                        <Text style={styles.backText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                                        onPress={handleSendOtp}
                                        disabled={loading}
                                    >
                                        <Text style={styles.sendButtonText}>{loading ? "Sending..." : "Send Code"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>Set New Password</Text>
                                <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="4-Digit OTP"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />

                                <View style={styles.actionContainer}>
                                    <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                                        <Text style={styles.backText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                                        onPress={handleResetPassword}
                                        disabled={loading}
                                    >
                                        <Text style={styles.sendButtonText}>{loading ? "Resetting..." : "Reset Password"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e9ebee',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    formWrapper: {
        alignItems: 'center',
        width: '100%',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'white',
        paddingVertical: 30,
        paddingHorizontal: 25,
        borderRadius: 8,
        elevation: 4,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1877F2',
        textAlign: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        marginBottom: 25,
        borderRadius: 6,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        gap: 15
    },
    backButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#f5f6f7'
    },
    backText: {
        color: '#4b4f56',
        fontSize: 16,
        fontWeight: '600'
    },
    sendButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 6,
        backgroundColor: '#1877F2',
        alignItems: 'center',
        elevation: 1
    },
    sendButtonDisabled: {
        backgroundColor: '#9cb4d8'
    },
    sendButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600'
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1.5,
    }
});

export default ForgotPasswordScreen;
