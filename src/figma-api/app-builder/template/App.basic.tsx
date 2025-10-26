// App.basic.tsx
/**
 * BASIC STARTER TEMPLATE
 * 
 * A minimal React Native app with simple navigation and no authentication.
 * Perfect for prototyping or building from scratch.
 * 
 * INCLUDED MODULES:
 * - None (clean slate)
 * 
 * FEATURES:
 * - Basic 3-tab navigation (Home, About, Settings)
 * - Simple card components
 * - No authentication required
 * - No theming system
 * - TypeScript support
 * 
 * DEPENDENCIES:
 * - React Native core components only
 * 
 * USE CASE: Quick prototypes, simple apps, learning React Native
 */


import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import packageJson from './package.json';

// Basic Card component (simplified, no theming)
const BasicCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardContent}>{content}</Text>
    </View>
);

// Basic navigation state
type Screen = 'home' | 'about' | 'settings';

export default function App() {
    const appVersion = packageJson.version;
    const appName = packageJson.name;
    const [currentScreen, setCurrentScreen] = React.useState<Screen>('home');

    console.log(`\n\n\n\n==================================\n\n${appName} (Basic) started: version ${appVersion}\n\n==================================`);

    const renderScreen = () => {
        switch (currentScreen) {
            case 'home':
                return (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>Welcome to {appName}</Text>
                            <Text style={styles.welcomeSubtitle}>Basic Starter Template</Text>
                        </View>

                        <BasicCard
                            title="Getting Started"
                            content="This is a basic starter template with simple navigation and components."
                        />

                        <BasicCard
                            title="Features Included"
                            content="• Basic navigation\n• Simple components\n• Clean styling\n• TypeScript support"
                        />

                        <BasicCard
                            title="Next Steps"
                            content="Add your own components and screens to build your app."
                        />
                    </ScrollView>
                );

            case 'about':
                return (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>About</Text>
                            <Text style={styles.welcomeSubtitle}>Learn more about this template</Text>
                        </View>

                        <BasicCard
                            title="Template Info"
                            content={`App Name: ${appName}\nVersion: ${appVersion}\nTemplate: Basic Starter`}
                        />

                        <BasicCard
                            title="Built With"
                            content="• React Native\n• TypeScript\n• Simple navigation\n• No authentication\n• No theming system"
                        />
                    </ScrollView>
                );

            case 'settings':
                return (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>Settings</Text>
                            <Text style={styles.welcomeSubtitle}>App configuration</Text>
                        </View>

                        <BasicCard
                            title="App Settings"
                            content="This is where you would add app settings and configuration options."
                        />

                        <BasicCard
                            title="User Preferences"
                            content="Add user preference controls here."
                        />
                    </ScrollView>
                );

            default:
                return (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Unknown screen</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Basic App</Text>
            </View>

            {/* Main Content */}
            {renderScreen()}

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.navButton, currentScreen === 'home' && styles.navButtonActive]}
                    onPress={() => setCurrentScreen('home')}
                >
                    <Text style={[styles.navButtonText, currentScreen === 'home' && styles.navButtonTextActive]}>
                        Home
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, currentScreen === 'about' && styles.navButtonActive]}
                    onPress={() => setCurrentScreen('about')}
                >
                    <Text style={[styles.navButtonText, currentScreen === 'about' && styles.navButtonTextActive]}>
                        About
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, currentScreen === 'settings' && styles.navButtonActive]}
                    onPress={() => setCurrentScreen('settings')}
                >
                    <Text style={[styles.navButtonText, currentScreen === 'settings' && styles.navButtonTextActive]}>
                        Settings
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
    },
    cardContent: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingVertical: 8,
    },
    navButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    navButtonActive: {
        backgroundColor: '#007AFF',
        marginHorizontal: 4,
        borderRadius: 6,
    },
    navButtonText: {
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    navButtonTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#ff0000',
    },
});