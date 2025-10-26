// template/modules/feature/assist/index.tsx
import { AssistJourney } from '@dankupfer/dn-components';
import React from 'react';
import { View } from 'react-native';

interface AssistProps {
    screenWidth: number;
}

const Everyday: React.FC<AssistProps> = ({ screenWidth }) => {

    return (
        <View>
            <AssistJourney
                screenWidth={screenWidth}
                // onClose={handleCloseAssist}
                enableTTS={false} 
                assistantConfig={{
                    serverUrl: 'ws://dn-server-974885144591.us-central1.run.app/api/assist',
                    debug: true,
                    useMockMode: true
                }}
            />
        </View>
    );

};

export default Everyday;