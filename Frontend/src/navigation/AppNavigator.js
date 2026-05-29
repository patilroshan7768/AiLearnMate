import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import CreateCourseScreen from '../screens/CreateCourseScreen';
import AIScreen from '../screens/AIScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import MyLearningScreen from '../screens/MyLearningScreen';
import CourseContentScreen from '../screens/CourseContentScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import QuizScreen from '../screens/QuizScreen';
import DiscussionScreen from '../screens/DiscussionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Courses') {
                        iconName = focused ? 'school' : 'school-outline';
                    } else if (route.name === 'My Learning') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'AI Tools') {
                        iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6366F1',
                tabBarInactiveTintColor: '#94A3B8',

                headerShown: false,

                tabBarStyle: {
                    backgroundColor: '#071120',
                    borderTopWidth: 0,
                    height: 72,
                    paddingBottom: 8,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },

                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '700',
                    marginBottom: 4,
                },

                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                },

                headerStyle: {
                    backgroundColor: '#071120',
                },

                headerTintColor: '#F1F5F9',

                headerTitleStyle: {
                    fontWeight: '800',
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen
                name="Courses"
                component={CoursesScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Courses',
                }}
            />
            <Tab.Screen
                name="My Learning"
                component={MyLearningScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'My Learning',
                }}
            />
            <Tab.Screen name="AI Tools" component={AIScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { userToken, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {userToken ? (
                    // Authenticated Stack
                    <>
                        {/* The Tab Navigator is the main screen */}
                        <Stack.Screen
                            name="MainTabs"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />

                        {/* Detailed pages are pushed on top of the tabs */}
                        <Stack.Screen
                            name="CourseDetail"
                            component={CourseDetailScreen}
                            options={{ title: 'Course Details' }}
                        />
                        <Stack.Screen
                            name="CreateCourse"
                            component={CreateCourseScreen}
                            options={{ title: 'Create New Course' }}
                        />
                        <Stack.Screen
                            name="CourseContent"
                            component={CourseContentScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="VideoPlayer"
                            component={VideoPlayerScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PDFViewer"
                            component={PDFViewerScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Assignments"
                            component={AssignmentsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Quiz"
                            component={QuizScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Discussion"
                            component={DiscussionScreen}
                            options={{ headerShown: false }}
                        />


                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ headerShown: false }} // Profile card usually has its own header
                        />
                        <Stack.Screen
                            name="AdminDashboard"
                            component={AdminDashboardScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ForgotPassword"
                            component={ForgotPasswordScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
