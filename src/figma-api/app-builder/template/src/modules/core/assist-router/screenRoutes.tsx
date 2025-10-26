// template/modules/core/assist-router/screenRoutes.tsx
import React from 'react';
import GeneratedSummary from '../../feature/summary';
import EverydayScreen from '../../feature/generatedeveryday';
import AssistScreen from '../../feature/assist-entry-screen';
import GeneratedScreen from '../../feature/generatedscreen';
import GeneratedScreen2 from '../../feature/generatedscreen2';

export interface ScreenRoute {
  id: string;
  name: string;
  component: React.ComponentType<{ screenWidth: number }>;
}

export const screenRoutes: ScreenRoute[] = [
  { id: 'summary', name: 'Summary', component: GeneratedSummary },
  { id: 'everyday', name: 'Everyday', component: EverydayScreen },
  { id: 'save-invest', name: 'Save & Invest', component: AssistScreen },
  { id: 'borrow', name: 'Borrow', component: GeneratedScreen },
  { id: 'homes', name: 'Homes', component: GeneratedScreen },
  { id: 'generatedscreen', name: 'GeneratedScreen', component: GeneratedScreen },
  // Plugin will add new routes here
];
