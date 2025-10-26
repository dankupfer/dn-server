// template/modules/core/summary-router/screenRoutes2.tsx
import React from 'react';
import GeneratedSummary from '../../feature/summary';
import EverydayScreen from '../../feature/generatedeveryday';
import AssistScreen from '../../feature/assist';

export interface ScreenRoute {
  id: string;
  name: string;
  // component: React.ComponentType<any>;
  component: React.ComponentType<{ screenWidth: number; [key: string]: any }>;
}

export const screenRoutes2: ScreenRoute[] = [
  { id: 'summary', name: 'Summary', component: GeneratedSummary },
  { id: 'everyday', name: 'Everyday', component: EverydayScreen },
  { id: 'save-invest', name: 'Save & Invest', component: AssistScreen },
  // Plugin will add new routes here
];
