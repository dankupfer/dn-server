// template/modules/core/summary-router/screenRoutes.tsx
import React from 'react';
import GeneratedSummary from '../../feature/summary-wallet';
import SummaryFromBuilder from '../../feature/summary-from-builder';
import EverydayScreen from '../../feature/generatedeveryday';
import CoreJourney from '../../feature/core-journey';

export interface ScreenRoute {
  id: string;
  name: string;
  // component: React.ComponentType<any>;
  component: React.ComponentType<{ screenWidth: number; [key: string]: any }>;
}

export const screenRoutes: ScreenRoute[] = [
  { id: 'summary', name: 'Summary', component: GeneratedSummary },
  // { id: 'summary', name: 'Summary From Builder', component: SummaryFromBuilder },
  { id: 'everyday', name: 'Everyday', component: EverydayScreen },
  { id: 'homes', name: 'Homes', component: CoreJourney },
  // Plugin will add new routes here
];
