// src/config/modules.ts - Corrected hybrid approach
export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'feature';
  enabled: boolean;
  dependencies?: string[];
  importFn?: () => Promise<any>;
  version?: string;
  priority?: number;
}

// Additional metadata that modules can provide themselves
export interface ModuleMetadata {
  name?: string;
  version?: string;
  features?: string[];
  api?: any;
}

// Runtime state for loaded modules
export enum ModuleState {
  PENDING = 'pending',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  UNLOADED = 'unloaded'
}

export interface LoadedModule {
  config: ModuleConfig;
  state: ModuleState;
  component?: any;
  metadata?: ModuleMetadata;
  error?: Error;
  loadTime?: number;
}

export const availableModules: ModuleConfig[] = [
  {
    id: 'splash',
    name: 'Splash Screen',
    description: 'Splash screen and app loading state',
    category: 'core',
    enabled: true,
    priority: 0,
    version: '1.0.0',
    importFn: () => import('../modules/core/splash'),
  },
  {
    id: 'authentication',
    name: 'Authentication',
    description: 'User authentication and authorization system',
    category: 'core',
    enabled: true,
    priority: 2,
    version: '1.0.0',
    importFn: () => import('../modules/core/authentication'),
  },
  {
    id: 'main-navigator',
    name: 'Main Navigator',
    description: 'App navigation structure using React Navigation',
    category: 'core',
    enabled: true,
    dependencies: ['authentication'],
    priority: 3,
    version: '1.0.0',
    importFn: () => import('../modules/core/main-navigator'),
  },
  {
    id: 'account-overview',
    name: 'Account Overview',
    description: 'Dashboard and overview components',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication', 'main-navigator'],
    priority: 5,
    importFn: () => import('../modules/feature/account-overview'),
  },
  {
    id: 'statements',
    name: 'Statements',
    description: 'Data history and timeline display',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication', 'main-navigator'],
    priority: 6,
    importFn: () => import('../modules/feature/statements'),
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Form submission and processing',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication', 'main-navigator'],
    priority: 7,
    importFn: () => import('../modules/feature/payments'),
  },
  {
    id: 'combined-auth',
    name: 'Combined Auth',
    description: 'Complete app template',
    category: 'core',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/core/combined-auth'),
  },
  {
    id: 'summary',
    name: 'Summary',
    description: 'Account summary and overview',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication'],
    priority: 5,
    importFn: () => import('../modules/feature/summary'),
  },
  {
    id: 'everyday',
    name: 'Everyday Banking',
    description: 'Daily banking operations',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication'],
    priority: 6,
    importFn: () => import('../modules/feature/everyday'),
  },
  {
    id: 'cards',
    name: 'Cards Management',
    description: 'Credit and debit card management',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication'],
    priority: 7,
    importFn: () => import('../modules/feature/cards'),
  },
  {
    id: 'apply',
    name: 'Applications',
    description: 'Apply for banking products',
    category: 'feature',
    enabled: true,
    dependencies: ['authentication'],
    priority: 8,
    importFn: () => import('../modules/feature/apply'),
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Prototype settings control screen',
    category: 'core',
    enabled: true,
    dependencies: [],
    priority: 8,
    importFn: () => import('../modules/core/settings'),
  },
  {
    id: 'summary-router',
    name: 'Summary Router',
    description: 'Router for Summary Experiment',
    category: 'core',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/core/summary-router'),
  },
  {
    id: 'generatedeveryday',
    name: 'Generated Everyday',
    description: 'Genererated screen for Every Day screen',
    category: 'feature',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/feature/generatedeveryday'),
  },
  {
    id: 'generatedsummary',
    name: 'Generated Summary',
    description: 'Genererated screen for Summary screen',
    category: 'feature',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/feature/generatedsummary'),
  },
  {
    id: 'generatedeveryday',
    name: 'Generated Everyday',
    description: 'Genererated screen for Everyday screen',
    category: 'feature',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/feature/generatedeveryday'),
  },
  {
    id: 'summary-wallet',
    name: 'Summary Wallet',
    description: 'Special Summary screen with card wallet component',
    category: 'feature',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/feature/summary-wallet'),
  },
  {
    id: 'assist-router',
    name: 'Assits Router',
    description: 'Special Lloyds Assist Experimental prototype',
    category: 'core',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/core/assist-router'),
  },
  {
    id: 'assist-entry-screen',
    name: 'Assits Router',
    description: 'Special Lloyds Assist Experimental prototype',
    category: 'feature',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/feature/assist-entry-screen'),
  },
  {
    id: 'figma-router',
    name: 'Figma Router',
    description: 'Special Figma plugin connected template',
    category: 'core',
    enabled: true,
    dependencies: [],
    priority: 1,
    importFn: () => import('../modules/core/figma-router'),
  },
];

// Helper functions
export const getModuleById = (id: string): ModuleConfig | undefined => {
  return availableModules.find(m => m.id === id);
};

export const getEnabledModules = (): ModuleConfig[] => {
  return availableModules.filter(m => m.enabled);
};

export const getModulesByCategory = (category: 'core' | 'feature'): ModuleConfig[] => {
  return availableModules.filter(m => m.category === category);
};

export const getModuleImportFn = (id: string): (() => Promise<any>) | undefined => {
  const module = availableModules.find(m => m.id === id);
  return module?.importFn;
};

export const hasModuleImportFn = (id: string): boolean => {
  const module = availableModules.find(m => m.id === id);
  return !!module?.importFn;
};

// Dependency resolution with circular dependency protection
export const resolveDependencies = (moduleId: string, visited = new Set<string>()): string[] => {
  if (visited.has(moduleId)) {
    return []; // Circular dependency protection
  }

  visited.add(moduleId);
  const module = getModuleById(moduleId);

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  let deps: string[] = [];

  if (module.dependencies) {
    for (const dep of module.dependencies) {
      const resolvedDeps = resolveDependencies(dep, visited);
      deps = deps.concat(resolvedDeps);
      if (!deps.includes(dep)) {
        deps.push(dep);
      }
    }
  }

  return deps;
};

// Get optimized load order for modules
export const getLoadOrder = (moduleIds: string[]): string[] => {
  const allDeps = new Set<string>();

  // Collect all dependencies for all modules
  for (const moduleId of moduleIds) {
    try {
      const deps = resolveDependencies(moduleId);
      deps.forEach(dep => allDeps.add(dep));
      allDeps.add(moduleId);
    } catch (error) {
      console.error(`Error resolving dependencies for ${moduleId}:`, error);
    }
  }

  // Sort by priority and dependencies
  const sorted = Array.from(allDeps).sort((a, b) => {
    const moduleA = getModuleById(a);
    const moduleB = getModuleById(b);

    if (!moduleA || !moduleB) return 0;

    // Core modules first
    if (moduleA.category === 'core' && moduleB.category !== 'core') return -1;
    if (moduleA.category !== 'core' && moduleB.category === 'core') return 1;

    // Then by explicit priority
    const priorityA = moduleA.priority ?? 999;
    const priorityB = moduleB.priority ?? 999;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // Finally, dependencies before dependents
    const aDeps = moduleA.dependencies || [];
    const bDeps = moduleB.dependencies || [];

    if (aDeps.includes(b)) return 1;  // A depends on B, so B loads first
    if (bDeps.includes(a)) return -1; // B depends on A, so A loads first

    return a.localeCompare(b);
  });

  return sorted;
};