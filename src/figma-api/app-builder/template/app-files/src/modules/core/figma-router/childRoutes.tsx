// template/src/modules/core/figma-router/childRoutes.tsx
import React from 'react';
import GeneratedAccountDetail from '../../feature/generatedscreen';
import GeneratedTransaction from '../../feature/generatedscreen';

export interface ChildRoute {
    id: string;
    name: string;
    type: 'slide' | 'modal' | 'full';
    title?: string;
    component: React.ComponentType<{ screenWidth: number }>;
}

export const childRoutes: ChildRoute[] = [
    { id: 'account-detail', name: 'Account Detail', type: 'slide', component: GeneratedAccountDetail },
    { id: 'transaction-detail', name: 'Transaction Detail', type: 'modal', component: GeneratedTransaction },
    // App builder will generate routes here
];