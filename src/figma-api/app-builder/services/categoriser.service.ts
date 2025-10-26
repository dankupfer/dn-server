// figma-api/app-builder/services/categoriser.service.ts

/**
 * CATEGORISER SERVICE
 * 
 * Categorises normalised components into routing groups:
 * - Carousel routes (main-carousel home sections)
 * - Bottom nav tabs (slide-panel home sections)
 * - Bottom nav modals (modal home sections)
 * - Child routes (non-home screens)
 * 
 * Handles duplicate resolution (last one wins)
 */

import {
  NormalisedComponent,
  CategorisedComponents,
  RouteComponent,
  CategorisationResult,
  CategorisationSummary
} from '../types/appBuilder.types';

/**
 * Main categorisation function
 * Takes normalised components and groups them by routing type
 */
export function categoriseComponents(
  components: NormalisedComponent[]
): CategorisationResult {
  const warnings: string[] = [];
  
  // Initialize collections
  const carouselMap = new Map<string, RouteComponent>();
  const bottomNavTabMap = new Map<string, RouteComponent>();
  const bottomNavModalMap = new Map<string, RouteComponent>();
  const childRoutes: RouteComponent[] = [];
  
  let duplicatesHandled = 0;
  
  // Process each component
  for (const component of components) {
    if (component.isHome && component.homeSection) {
      // Home component - route to appropriate collection
      const result = categoriseHomeComponent(
        component,
        carouselMap,
        bottomNavTabMap,
        bottomNavModalMap,
        warnings
      );
      
      if (result.isDuplicate) {
        duplicatesHandled++;
      }
    } else {
      // Child component
      const childRoute = createChildRoute(component);
      childRoutes.push(childRoute);
    }
  }
  
  // Convert maps to arrays (maintains last-one-wins order)
  const categorised: CategorisedComponents = {
    carouselRoutes: Array.from(carouselMap.values()),
    bottomNavTabs: Array.from(bottomNavTabMap.values()),
    bottomNavModals: Array.from(bottomNavModalMap.values()),
    childRoutes
  };
  
  // Generate summary
  const summary: CategorisationSummary = {
    totalComponents: components.length,
    carouselRoutes: categorised.carouselRoutes.length,
    bottomNavTabs: categorised.bottomNavTabs.length,
    bottomNavModals: categorised.bottomNavModals.length,
    childRoutes: categorised.childRoutes.length,
    duplicatesHandled
  };
  
  return {
    success: true,
    categorised,
    summary,
    warnings
  };
}

/**
 * Categorise a home component into the appropriate collection
 */
function categoriseHomeComponent(
  component: NormalisedComponent,
  carouselMap: Map<string, RouteComponent>,
  bottomNavTabMap: Map<string, RouteComponent>,
  bottomNavModalMap: Map<string, RouteComponent>,
  warnings: string[]
): { isDuplicate: boolean } {
  const homeSection = component.homeSection!; // Already validated in parser
  let isDuplicate = false;
  
  switch (component.sectionType) {
    case 'main-carousel':
      // Carousel route
      if (carouselMap.has(homeSection)) {
        warnings.push(
          `Duplicate carousel route '${homeSection}': Component '${component.id}' overriding previous component`
        );
        isDuplicate = true;
      }
      carouselMap.set(homeSection, createCarouselRoute(component, homeSection));
      break;
      
    case 'slide-panel':
      // Bottom nav tab
      if (bottomNavTabMap.has(homeSection)) {
        warnings.push(
          `Duplicate bottom nav tab '${homeSection}': Component '${component.id}' overriding previous component`
        );
        isDuplicate = true;
      }
      bottomNavTabMap.set(homeSection, createBottomNavRoute(component, homeSection, 'tab'));
      break;
      
    case 'modal':
      // Bottom nav modal
      if (bottomNavModalMap.has(homeSection)) {
        warnings.push(
          `Duplicate modal '${homeSection}': Component '${component.id}' overriding previous component`
        );
        isDuplicate = true;
      }
      bottomNavModalMap.set(homeSection, createBottomNavRoute(component, homeSection, 'modal'));
      break;
      
    default:
      warnings.push(
        `Invalid section_type '${component.sectionType}' for home component '${component.id}'. Expected: main-carousel, slide-panel, or modal.`
      );
  }
  
  return { isDuplicate };
}

/**
 * Create a carousel route component
 */
function createCarouselRoute(
  component: NormalisedComponent,
  homeSection: string
): RouteComponent {
  return {
    id: component.id,
    routeId: homeSection,
    name: capitalize(homeSection),
    component
  };
}

/**
 * Create a bottom nav route component (tab or modal)
 */
function createBottomNavRoute(
  component: NormalisedComponent,
  homeSection: string,
  type: 'tab' | 'modal'
): RouteComponent {
  return {
    id: component.id,
    routeId: homeSection,
    name: capitalize(homeSection),
    component,
    type
  };
}

/**
 * Create a child route component
 */
function createChildRoute(component: NormalisedComponent): RouteComponent {
  // Determine type based on section_type
  let type: 'slide' | 'modal' | 'full' = 'slide'; // default
  
  if (component.sectionType === 'modal') {
    type = 'modal';
  } else if (component.sectionType === 'full') {
    type = 'full';
  } else if (component.sectionType === 'slide') {
    type = 'slide';
  }
  
  return {
    id: component.id,
    routeId: component.id, // Child routes use their ID as routeId
    name: generateDisplayName(component.id),
    component,
    type
  };
}

/**
 * Generate display name from ID
 * Examples:
 * - 'summary-screen' → 'Summary Screen'
 * - 'account-detail' → 'Account Detail'
 * - 'everyday' → 'Everyday'
 */
function generateDisplayName(id: string): string {
  return id
    .split('-')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate categorised components
 * Additional business logic validation after categorisation
 */
export function validateCategorisation(
  categorised: CategorisedComponents
): string[] {
  const errors: string[] = [];
  
  // Validate carousel routes have valid section names
  const validCarouselSections = ['summary', 'everyday', 'invest', 'borrow', 'homes', 'insurance'];
  for (const route of categorised.carouselRoutes) {
    if (!validCarouselSections.includes(route.routeId)) {
      errors.push(
        `Invalid carousel section '${route.routeId}' in component '${route.id}'. Valid options: ${validCarouselSections.join(', ')}`
      );
    }
  }
  
  // Validate bottom nav tabs have valid section names
  const validBottomNavTabs = ['home', 'apply', 'cards'];
  for (const route of categorised.bottomNavTabs) {
    if (!validBottomNavTabs.includes(route.routeId)) {
      errors.push(
        `Invalid bottom nav tab '${route.routeId}' in component '${route.id}'. Valid options: ${validBottomNavTabs.join(', ')}`
      );
    }
  }
  
  // Validate modals have valid section names
  const validModalSections = ['payments', 'search'];
  for (const route of categorised.bottomNavModals) {
    if (!validModalSections.includes(route.routeId)) {
      errors.push(
        `Invalid modal section '${route.routeId}' in component '${route.id}'. Valid options: ${validModalSections.join(', ')}`
      );
    }
  }
  
  // Warn if no carousel routes
  if (categorised.carouselRoutes.length === 0) {
    errors.push('Warning: No carousel routes defined. App may not have main content.');
  }
  
  // Warn if no bottom nav tabs
  if (categorised.bottomNavTabs.length === 0) {
    errors.push('Warning: No bottom nav tabs defined. App may not have bottom navigation.');
  }
  
  return errors;
}

/**
 * Sort routes by their natural order
 * Maintains consistent ordering in generated router files
 */
export function sortRoutes(routes: RouteComponent[], type: 'carousel' | 'bottomNav' | 'child'): RouteComponent[] {
  if (type === 'carousel') {
    // Carousel order: summary, everyday, invest, borrow, homes, insurance
    const order = ['summary', 'everyday', 'invest', 'borrow', 'homes', 'insurance'];
    return routes.sort((a, b) => {
      const indexA = order.indexOf(a.routeId);
      const indexB = order.indexOf(b.routeId);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } else if (type === 'bottomNav') {
    // Bottom nav order: home, apply, cards, then modals (payments, search)
    const tabOrder = ['home', 'apply', 'cards'];
    const modalOrder = ['payments', 'search'];
    const allOrder = [...tabOrder, ...modalOrder];
    
    return routes.sort((a, b) => {
      const indexA = allOrder.indexOf(a.routeId);
      const indexB = allOrder.indexOf(b.routeId);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  } else {
    // Child routes: alphabetical by ID
    return routes.sort((a, b) => a.id.localeCompare(b.id));
  }
}

/**
 * Generate categorisation report for logging/debugging
 */
export function generateCategorisationReport(result: CategorisationResult): string {
  if (!result.categorised) {
    return 'Categorisation failed';
  }
  
  const { categorised, summary, warnings } = result;
  
  let report = `\n=== CategorisATION REPORT ===\n`;
  report += `Total components: ${summary.totalComponents}\n\n`;
  
  // Carousel routes
  report += `Carousel Routes (${summary.carouselRoutes}):\n`;
  if (categorised.carouselRoutes.length > 0) {
    categorised.carouselRoutes.forEach(route => {
      report += `  - ${route.routeId}: ${route.component.componentType} (${route.id})\n`;
    });
  } else {
    report += `  (none)\n`;
  }
  report += `\n`;
  
  // Bottom nav tabs
  report += `Bottom Nav Tabs (${summary.bottomNavTabs}):\n`;
  if (categorised.bottomNavTabs.length > 0) {
    categorised.bottomNavTabs.forEach(route => {
      report += `  - ${route.routeId}: ${route.component.componentType} (${route.id})\n`;
    });
  } else {
    report += `  (none)\n`;
  }
  report += `\n`;
  
  // Bottom nav modals
  report += `Bottom Nav Modals (${summary.bottomNavModals}):\n`;
  if (categorised.bottomNavModals.length > 0) {
    categorised.bottomNavModals.forEach(route => {
      report += `  - ${route.routeId}: ${route.component.componentType} (${route.id})\n`;
    });
  } else {
    report += `  (none)\n`;
  }
  report += `\n`;
  
  // Child routes
  report += `Child Routes (${summary.childRoutes}):\n`;
  if (categorised.childRoutes.length > 0) {
    categorised.childRoutes.forEach(route => {
      report += `  - ${route.id} (${route.type}): ${route.component.componentType}\n`;
    });
  } else {
    report += `  (none)\n`;
  }
  report += `\n`;
  
  // Warnings
  if (warnings.length > 0) {
    report += `Warnings (${warnings.length}):\n`;
    warnings.forEach(warning => {
      report += `  ⚠️  ${warning}\n`;
    });
    report += `\n`;
  }
  
  if (summary.duplicatesHandled > 0) {
    report += `Duplicates handled: ${summary.duplicatesHandled} (last one wins)\n`;
  }
  
  report += `=== END REPORT ===\n`;
  
  return report;
}

/**
 * Get route by ID from categorised components
 */
export function findRouteById(
  categorised: CategorisedComponents,
  id: string
): RouteComponent | null {
  // Check carousel routes
  const carouselRoute = categorised.carouselRoutes.find(r => r.id === id);
  if (carouselRoute) return carouselRoute;
  
  // Check bottom nav tabs
  const tabRoute = categorised.bottomNavTabs.find(r => r.id === id);
  if (tabRoute) return tabRoute;
  
  // Check bottom nav modals
  const modalRoute = categorised.bottomNavModals.find(r => r.id === id);
  if (modalRoute) return modalRoute;
  
  // Check child routes
  const childRoute = categorised.childRoutes.find(r => r.id === id);
  if (childRoute) return childRoute;
  
  return null;
}

/**
 * Get all routes as flat array
 */
export function getAllRoutes(categorised: CategorisedComponents): RouteComponent[] {
  return [
    ...categorised.carouselRoutes,
    ...categorised.bottomNavTabs,
    ...categorised.bottomNavModals,
    ...categorised.childRoutes
  ];
}