// src/modules/core/summary-router/components/AppRouter.tsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTheme, useFlags, HeaderProvider, HeaderManager } from '@dankupfer/dn-components';
import { createSummaryRouterStyles } from '../styles';
import Splash from '../../splash';
import Authentication, { User } from '../../authentication';
import DashboardContent from './DashboardContent';
import flagsConfig from '../flags.json';

type AppState = 'splash' | 'login' | 'register' | 'dashboard';

const AppRouter: React.FC = () => {
    const TRANSITION_SPEED = 500;

    const { theme } = useTheme();
    const { loadFlags } = useFlags();
    const styles = createSummaryRouterStyles(theme);

    // Dev flag - set to true to skip splash/auth and go straight to dashboard
    const DEV_SKIP_AUTH = true;

    // State management
    const [currentState, setCurrentState] = useState<AppState>(
        DEV_SKIP_AUTH ? 'dashboard' : 'splash'
    );
    const [user, setUser] = useState<User | null>(
        DEV_SKIP_AUTH ? { id: 'dev', name: 'Alex', email: 'dev@example.com' } : null
    );
    const [authState, setAuthState] = useState<'login' | 'register'>('login');

    // Load flags on component mount
    useEffect(() => {
        loadFlags(flagsConfig);
    }, [loadFlags]);

    // Event handlers
    const handleSplashComplete = () => {
        setCurrentState('login');
    };

    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setCurrentState('dashboard');
    };

    const handleLogout = () => {
        setUser(null);
        setCurrentState('login');
        setAuthState('login');
    };

    const handleAuthStateChange = (newAuthState: 'login' | 'register') => {
        setAuthState(newAuthState);
        setCurrentState(newAuthState);
    };

    // Render current screen
    const renderCurrentScreen = () => {
        // Force dashboard for testing - bypass all auth
        const mockUser = { id: 'test', name: 'Test User', email: 'test@test.com' };

        return (
            <DashboardContent
                user={mockUser}
                onLogout={() => console.log('logout')}
                transitionSpeed={TRANSITION_SPEED}
            />
        );
    };

    return (
        <HeaderProvider
            defaultTransition="crossFade"
            defaultHeader={{
                title: 'Loading...',
                showStatusBar: true,

            }}
        >
            <View style={styles.container}>
                <HeaderManager
                    animationDuration={TRANSITION_SPEED}
                    debug={false} />
                {renderCurrentScreen()}
            </View>
        </HeaderProvider>
    );
};

export default AppRouter;