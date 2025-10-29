// src/dev/components/IconDev/index.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { tokens } from '../../../utils/imports';

interface IconDevProps {
  name: string;
  size?: number;
  color?: string;
}

const IconDev: React.FC<IconDevProps> = ({ name, size = 24, color = 'black' }) => {
  // Access local dev tokens
  const localIcons = tokens.tokens?.icons?.shared;
  
  if (!localIcons || !localIcons[name]) {
    console.warn(`Local dev icon "${name}" not found`);
    return null;
  }
  
  const iconData = localIcons[name];
  
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
        <G clipPath="url(#clip0_201_4583)">
          {iconData.paths.map((path: any, index: number) => (
            <Path
              key={index}
              d={path.d}
              fill={color}
            />
          ))}
        </G>
        <Defs>
          <ClipPath id="clip0_201_4583">
            <Rect width="29.6609" height="29.6609" fill="white" transform="translate(0.060791 0.269775)" />
          </ClipPath>
        </Defs>
      </Svg>
    </View>
  );
};

export default IconDev;