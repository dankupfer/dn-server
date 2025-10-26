// template/src/modules/feature/summary/index.tsx
import React from 'react';
import { ScreenBuilder, type ScreenConfig } from '@dankupfer/dn-components';
import screenData from './screenData.json';

interface SummaryProps {
  screenWidth: number;
}

const Summary: React.FC<SummaryProps> = ({ screenWidth }) => {
  const config = screenData as ScreenConfig;
  
  return (
    <ScreenBuilder 
      config={config} 
      screenWidth={screenWidth} 
    />
  );
};

export default Summary;
