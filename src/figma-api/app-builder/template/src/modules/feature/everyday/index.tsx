// template/modules/feature/everyday/index.tsx
import React from 'react';
// import { ScreenBuilder, type ScreenConfig } from '@dankupfer/dn-components';

// Import the screen configuration
import screenData from './screenData.json';
import { View } from 'react-native';
import { Text } from 'react-native-svg';

interface EverydayProps {
  screenWidth: number;
}

const Everyday: React.FC<EverydayProps> = ({ screenWidth }) => {
  // Cast the imported JSON to our ScreenConfig type
  // const config = screenData as ScreenConfig;

  return (
    <View><Text>Everyday Test</Text></View>
  );

  // return (
  //   <ScreenBuilder 
  //     config={config} 
  //     screenWidth={screenWidth} 
  //   />
  // );
};

export default Everyday;