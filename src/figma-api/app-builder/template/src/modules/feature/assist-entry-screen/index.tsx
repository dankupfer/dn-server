// template/modules/feature/assist/index.tsx
import { AssistTile } from '@dankupfer/dn-components';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAssist } from '../../core/assist-router';

interface AssistProps {
    screenWidth: number;
}

const AssistEntryScreen: React.FC<AssistProps> = ({ screenWidth }) => {
    const { openAssist } = useAssist();

    return (
        <View style={styles.container}>
            <AssistTile onPress={openAssist} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
});

export default AssistEntryScreen;