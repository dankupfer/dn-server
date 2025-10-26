// template/src/modules/core/figma-router/carouselRoutes.tsx
import React from 'react';
import GeneratedSummary from '../../feature/generatedscreen';
import GeneratedEveryday from '../../feature/generatedscreen';

export interface CarouselRoute {
    id: string;
    name: string;
    title?: string;
    component: React.ComponentType<{ screenWidth: number }>;
}

export const carouselRoutes: CarouselRoute[] = [
    { id: 'summary', name: 'Summary', component: GeneratedSummary },
    { id: 'everyday', name: 'Everyday', component: GeneratedEveryday },
    { id: 'invest', name: 'Save & Invest', component: GeneratedEveryday },
    // App builder will generate routes here
];