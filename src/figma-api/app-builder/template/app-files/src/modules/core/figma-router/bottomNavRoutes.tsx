// template/src/modules/core/figma-router/bottomNavRoutes.tsx
import React from 'react';
import GeneratedHome from '../../feature/generatedscreen';
import GeneratedApply from '../../feature/generatedscreen';
import GeneratedCards from '../../feature/generatedscreen';
import GeneratedPayments from '../../feature/generatedscreen';

export interface BottomNavRoute {
    id: string;
    name: string;
    type: 'tab' | 'modal';
    title?: string;
    component: React.ComponentType<{ screenWidth: number }>;
}

export const bottomNavRoutes: BottomNavRoute[] = [
    // Bottom navigation tabs
    { id: 'home', name: 'Home', type: 'tab', component: GeneratedHome },
    { id: 'apply', name: 'Apply', type: 'tab', component: GeneratedApply },
    { id: 'payments', name: 'Payments', title: 'Pay & Transfer', type: 'modal', component: GeneratedPayments },
    { id: 'cards', name: 'Cards', type: 'tab', component: GeneratedCards },
    // App builder will generate routes here
];