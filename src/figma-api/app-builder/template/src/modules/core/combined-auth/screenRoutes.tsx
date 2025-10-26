// template/modules/core/combined-auth/screenRoutes.tsx
import React from 'react';
import GeneratedSummary from '../../feature/generatedsummary';
import GeneratedScreen from '../../feature/generatedscreen';

export interface ScreenRoute {
  id: string;
  name: string;
  component: React.ComponentType<{ screenWidth: number }>;
}

export const screenRoutes: ScreenRoute[] = [
  { id: 'summary', name: 'Summary', component: GeneratedScreen },
  { id: 'borrow', name: 'Borrow', component: GeneratedScreen },
  // Plugin will add new routes here
];
