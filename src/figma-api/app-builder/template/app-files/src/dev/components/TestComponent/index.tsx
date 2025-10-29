import React from 'react';
import { View, Text } from 'react-native';
// import { IconDev, tokens } from '../../../utils/imports';
import { tokens } from '../../../utils/imports';
import IconDev from '../IconDev';

const TestComponent = () => {
  // Access the local dev tokens
  const localColors = tokens.colors?.experimental;
  
  return (
    <View style={{ 
      padding: 16, 
      backgroundColor: localColors?.['vibrant-purple'] || '#f0f0f0', 
      margin: 8,
      borderRadius: 8,
      alignItems: 'center'
    }}>
      <Text style={{ 
        color: 'white', 
        fontWeight: 'bold',
        marginBottom: 8 
      }}>
        Local Dev Component with Local Tokens!
      </Text>
      
      <IconDev 
        name="test-refresh" 
        size={30} 
        color={localColors?.['bright-orange'] || 'white'} 
      />
      
      <Text style={{ 
        color: localColors?.['lime-green'] || 'white', 
        fontSize: 12,
        marginTop: 8 
      }}>
        Using local icon + colors from dev tokens
      </Text>
    </View>
  );
};

export default TestComponent;