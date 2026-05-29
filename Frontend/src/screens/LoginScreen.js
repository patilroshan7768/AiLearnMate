import React, { useContext, useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Modal, Animated, Easing, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { BASE_URL } from '../services/api';

const LoginScreen = ({ navigation }) => {
    const { login, register, sendOtp } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('student');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [nameError, setNameError] = useState(false);

    // Custom Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalButtonText, setModalButtonText] = useState('Try Again');
    const [modalAction, setModalAction] = useState(null);

    // Animation Values
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;

    const showModal = (title, message, btnText = 'Try Again', action = null) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalButtonText(btnText);
        setModalAction(() => action);
        setModalVisible(true);
    };

    useEffect(() => {
        // Explicitly clear fields on component mount
        setEmail('');
        setPassword('');

        // Start Background Animation
        const createLoop = (anim, duration) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        };

        createLoop(blob1Anim, 4000); // 4 seconds loop
        createLoop(blob2Anim, 6000); // 6 seconds loop

    }, []);

    // Interpolate values for movement
    const blob1TranslateY = blob1Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -50]
    });
    const blob2TranslateY = blob2Anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 60]
    });


    const handleLogin = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        setEmailError(false);
        setPasswordError(false);

        // Validation for Empty Fields
        let hasError = false;
        if (!email.trim()) {
            setEmailError(true);
            hasError = true;
        }
        if (!password) {
            setPasswordError(true);
            hasError = true;
        }

        if (hasError) {
            return showModal('Required Fields', 'Please enter your email and password.');
        }

        setIsLoggingIn(true);
        try {
            await login(email, password);
        } catch (e) {
            const message = (e.message || 'Login Failed').toLowerCase();
            setErrorMsg(e.message || 'Login Failed');
            console.log('Login Error:', message);

            // Backend specific checks (Case Insensitive)
            if (message.includes('email') || message.includes('user') || message.includes('registered')) {
                setEmailError(true);
                showModal(
                    'Incorrect Email',
                    'The email you entered doesn\'t appear to belong to an account. Please check your email and try again.',
                    'Try Again'
                );
            } else if (message.includes('password') || message.includes('credential')) {
                setPasswordError(true);
                setPassword(''); // Clear password field on error
                showModal(
                    'Incorrect Password',
                    'The password you entered is incorrect. Please try again.',
                    'Try Again'
                );
            } else {
                // FALLBACK
                setEmailError(true);
                setPasswordError(true);
                showModal('Login Failed', 'Sorry, your login request could not be processed. Please try again.\n\nError: ' + message);
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const [verificationCode, setVerificationCode] = useState('');
    // const [generatedOtp, setGeneratedOtp] = useState(null); // No longer needed
    const [isVerifying, setIsVerifying] = useState(false);

    const [isSendingOtp, setIsSendingOtp] = useState(false);

    // Step 1: Validate & Send OTP (Do NOT Register yet)
    const handleRegister = async () => {
        setErrorMsg('');
        setNameError(false);
        setEmailError(false);
        setPasswordError(false);

        // Validation
        if (!name.trim()) {
            setNameError(true);
            return showModal('Validation Error', 'Please enter your Full Name.');
        }
        if (!email.trim()) {
            setEmailError(true);
            return showModal('Validation Error', 'Please enter your Email Address.');
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setEmailError(true);
            return showModal('Invalid Email', 'Please enter a valid email address.');
        }
        if (!password || password.length < 6) {
            setPasswordError(true);
            return showModal('Weak Password', 'Password must be at least 6 characters long.');
        }

        setIsSendingOtp(true);
        try {
            console.log('Initiating OTP send for:', email);
            const response = await sendOtp(email);
            console.log('OTP Response:', response);

            // Show Verify Screen IMMEDIATELY
            setIsVerifying(true);

            // If backend sends OTP back (for testing), show it in the modal
            let msg = `A 4-digit code has been sent to ${email}.\n\n(Expires in 5 minutes)`;
            if (response.otp) {
                msg += `\n\nDEV CODE: ${response.otp}`;
            }

            // USE MODAL INSTEAD OF ALERT
            showModal('Verification Code Sent', msg, 'OK, Got it');

        } catch (e) {
            console.log('Send OTP Error:', e);

            // Turn the Email Box RED if sending fails
            setEmailError(true);

            let failMsg = e.message || 'Failed to connect to server.';
            if (failMsg.includes('Failed to send OTP')) {
                failMsg = 'The server could not send the email. Please ensure the email address is real and valid.';
            }
            showModal('Email Sending Failed', failMsg);
        } finally {
            setIsSendingOtp(false);
        }
    }

    const [isVerifyingApi, setIsVerifyingApi] = useState(false);

    // Step 2: Verify OTP & ACTUALLY Create Account
    const handleVerify = async () => {
        if (verificationCode.length !== 4) {
            return showModal('Invalid Code', 'Please enter the 4-digit code.');
        }

        setIsVerifyingApi(true);
        // We can reuse a local loading state if we want to show a spinner on the button
        // But for now, let's just rely on the async flow and maybe add a distinct 'verifying in progress' state if needed.
        // Or better, let's rely on Alert to show blocking status or just be patient.

        console.log('Verifying code:', verificationCode);

        try {
            // NOW we call the backend to register AND verify OTP
            console.log('Sending register request...');
            const result = await register({ email, password, name, role, otp: verificationCode });
            console.log('Register success:', result);

            // Force Login to ensure Dashboard opens (In case register doesn't return token)
            await login(email, password);

            setSuccessMsg('Registered Successfully!');
            Alert.alert('Success', 'Registered Successfully! Logging you in...');

            // Allow state updates to settle
            setTimeout(() => {
                setIsRegistering(false);
                setIsVerifying(false);
                setVerificationCode('');
            }, 500);

        } catch (e) {
            console.log('Registration Error:', e);
            const message = e.message || 'Unknown error occurred.';
            showModal('Registration Failed', message);
        } finally {
            setIsVerifyingApi(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Image Background */}
            <View style={StyleSheet.absoluteFill}>
                <Animated.Image
                    source={require('../../assets/cyberpunk_bg.png')}
                    style={[
                        styles.backgroundImage,
                        {
                            transform: [
                                { scale: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                            ]
                        }
                    ]}
                    resizeMode="cover"
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, zIndex: 10 }} // Ensure content is above blobs
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.formWrapper}>
                        <View style={styles.formContainer}>
                            <Text style={styles.logoText}>AI LearnMate</Text>

                            {isVerifying ? (
                                <>
                                    <Text style={styles.title}>Verify Email</Text>
                                    <Text style={styles.subtitle}>Enter the 4-digit code sent to {email}</Text>

                                    {/* Custom 4-Box OTP Input */}
                                    <View style={styles.otpWrapper}>
                                        <TextInput
                                            style={styles.hiddenInput}
                                            value={verificationCode}
                                            onChangeText={setVerificationCode}
                                            keyboardType="numeric"
                                            maxLength={4}
                                            autoFocus={true}
                                            placeholderTextColor="#666"
                                        />
                                        <View style={styles.otpContainer}>
                                            {[0, 1, 2, 3].map((index) => (
                                                <View key={index} style={[styles.otpBox, verificationCode.length === index && styles.otpBoxActive]}>
                                                    <Text style={styles.otpText}>
                                                        {verificationCode[index] || ''}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.buttonContainer}>
                                        <Button
                                            title={isVerifyingApi ? "Verifying..." : "Verify & Register"}
                                            onPress={handleVerify}
                                            color="#10B981"
                                            disabled={isVerifyingApi}
                                        />
                                    </View>
                                    <TouchableOpacity onPress={() => setIsVerifying(false)} style={styles.switchButton}>
                                        <Text style={styles.switchText}>Cancel / Change Email</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Log In'}</Text>



                                    {/* ... Rest of form elements ... */}
                                    {/* HACK: Hidden inputs to trap browser autofill so the real fields stay blank */}
                                    <View style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}>
                                        <TextInput placeholderTextColor="#666" autoComplete="username" style={{ height: 0, width: 0 }} />
                                        <TextInput placeholderTextColor="#666" autoComplete="current-password" style={{ height: 0, width: 0 }} />
                                    </View>

                                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                                    {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

                                    {/* TEMP DEBUG: Show connection status */}
                                    {/* <Text style={{textAlign:'center', color:'gray', fontSize:10}}>Status: {isLoggingIn ? 'Logging In...' : 'Idle'}</Text> */}

                                    {isRegistering && (
                                        <>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    nameError ? { borderColor: 'red', borderWidth: 2, backgroundColor: '#ffe6e6' } : null
                                                ]}
                                                placeholder="Full Name"
                                                placeholderTextColor="#666"
                                                value={name}
                                                onChangeText={(text) => { setName(text); setNameError(false); }}
                                            />
                                            <Text style={styles.label}>Select Role:</Text>
                                            <View style={styles.roleContainer}>
                                                <TouchableOpacity
                                                    style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
                                                    onPress={() => setRole('student')}
                                                >
                                                    <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
                                                </TouchableOpacity>
                                                <View style={{ width: 10 }} />
                                                <TouchableOpacity
                                                    style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                                                    onPress={() => setRole('teacher')}
                                                >
                                                    <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>Teacher</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    )}
                                    <TextInput
                                        style={[
                                            styles.input,
                                            emailError ? { borderColor: 'red', borderWidth: 2, backgroundColor: '#ffe6e6' } : null
                                        ]}
                                        placeholder="Email Address"
                                        placeholderTextColor="#666"
                                        value={email}
                                        onChangeText={(text) => { setEmail(text); setEmailError(false); setErrorMsg(''); }}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="off"
                                        importantForAutofill="no"
                                    />
                                    {/* Password Input with Show/Hide Toggle */}
                                    <View style={[
                                        styles.passwordContainer,
                                        passwordError ? { borderColor: 'red', borderWidth: 2, backgroundColor: '#ffe6e6' } : null
                                    ]}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Password"
                                            placeholderTextColor="#666"
                                            value={password}
                                            onChangeText={(text) => { setPassword(text); setPasswordError(false); setErrorMsg(''); }}
                                            secureTextEntry={!showPassword}
                                            autoComplete="new-password"
                                            importantForAutofill="no"
                                            underlineColorAndroid="transparent"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <Text style={{ color: '#666', fontWeight: '600' }}>{showPassword ? "Hide" : "Show"}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.buttonContainer}>
                                        <Button
                                            title={
                                                isSendingOtp ? "Sending Code..." :
                                                    isLoggingIn ? "Logging In..." :
                                                        (isRegistering ? "Register" : "Log In")
                                            }
                                            onPress={isRegistering ? handleRegister : handleLogin}
                                            color="#1877F2"
                                            disabled={isSendingOtp || isLoggingIn}
                                        />
                                    </View>

                                    {!isRegistering && (
                                        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                                            <Text style={styles.forgotText}>Forgot Password?</Text>
                                        </TouchableOpacity>
                                    )}



                                    <View style={styles.divider} />

                                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchButton}>
                                        <Text style={styles.switchText}>
                                            {isRegistering ? "Already have an account?" : "Create new account"}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Custom Instagram-like Popup Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{modalTitle}</Text>
                            <Text style={styles.modalMessage}>{modalMessage}</Text>

                            <View style={styles.modalDivider} />

                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => {
                                    setModalVisible(false);
                                    if (modalAction) modalAction(); // Optional action (e.g. nav to forgot password)
                                }}
                            >
                                <Text style={styles.modalButtonText}>{modalButtonText || 'Try Again'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Dark background base
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9, // Make bg prominent
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formWrapper: {
        alignItems: 'center',
        width: '100%',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(23, 23, 35, 0.6)', // Dark Semi-Transparent "Glass"
        borderRadius: 20,
        padding: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle white border
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.5)",
        // BACKDROP FILTER FOR WEB (Glass blur)
        backdropFilter: 'blur(20px)',
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff', // White
        textAlign: 'center',
        marginBottom: 5,
        textShadow: "0px 0px 10px rgba(139, 92, 246, 0.5)",
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1aa', // Light gray 
        textAlign: 'center',
        marginBottom: 30,
    },
    // ... (keep existing input/text styles or minor tweaks)
    debugText: {
        fontSize: 10,
        color: 'gray',
        textAlign: 'center',
        marginBottom: 15
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10
    },
    successText: {
        color: '#10B981', // Green
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 16
    },
    input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#000',
},
    label: {
        marginBottom: 5,
        color: '#666',
    },
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20
    },
    roleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: 'transparent'
    },
    roleBtnActive: {
        backgroundColor: '#007AFF'
    },
    roleText: {
        color: '#007AFF',
        fontWeight: '600'
    },
    roleTextActive: {
        color: 'white'
    },
    buttonContainer: {
        marginTop: 10,
    },
    forgotBtn: {
        marginTop: 15,
        alignItems: 'center',
    },
    forgotText: {
        color: '#ff0000',
        fontSize: 14,
        textDecorationLine: 'underline'
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchText: {
        color: '#007AFF',
    },
    otpWrapper: {
        width: '100%',
        height: 60,
        marginBottom: 20,
        justifyContent: 'center',
    },
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0, // Hide input but keep it touchable
        zIndex: 2,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
    },
    otpBox: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    otpBoxActive: {
        borderColor: '#10B981', // Green border when active
        borderWidth: 2,
    },
    otpText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1.5,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 15,
        paddingHorizontal: 12,
        height: 53, // Match the height of the standard input
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
        borderWidth: 0,
        color: '#000',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        padding: 0,
        outlineStyle: 'none', // Critical for removing Web focus border
    },
    eyeIcon: {
        padding: 5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 15,
        alignItems: 'center',
        paddingTop: 20,
        elevation: 5,
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        lineHeight: 20,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#eee',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default LoginScreen;
