// figma-api/app-builder/services/categoriser.service.ts

/**
 * CATEGORIZER SERVICE
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
    const bottomNavMap = new Map<string, RouteComponent>(); // Single map for all bottom nav
    const childRoutes: RouteComponent[] = [];

    let duplicatesHandled = 0;

    // Process each component
    for (const component of components) {
        if (component.isHome && component.homeSection) {
            // Home component - route to appropriate collection
            const result = categoriseHomeComponent(
                component,
                carouselMap,
                bottomNavMap,
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

    // Convert maps to arrays (maintains insertion order)
    const categorised: CategorisedComponents = {
        carouselRoutes: Array.from(carouselMap.values()),
        bottomNavRoutes: Array.from(bottomNavMap.values()),
        childRoutes
    };

    // Generate summary
    const summary: CategorisationSummary = {
        totalComponents: components.length,
        carouselRoutes: categorised.carouselRoutes.length,
        bottomNavRoutes: categorised.bottomNavRoutes.length,
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
    bottomNavMap: Map<string, RouteComponent>,
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
            if (bottomNavMap.has(homeSection)) {
                warnings.push(
                    `Duplicate bottom nav tab '${homeSection}': Component '${component.id}' overriding previous component`
                );
                isDuplicate = true;
            }
            bottomNavMap.set(homeSection, createBottomNavRoute(component, homeSection, 'tab'));
            break;

        case 'modal':
            // Bottom nav modal
            if (bottomNavMap.has(homeSection)) {
                warnings.push(
                    `Duplicate modal '${homeSection}': Component '${component.id}' overriding previous component`
                );
                isDuplicate = true;
            }
            bottomNavMap.set(homeSection, createBottomNavRoute(component, homeSection, 'modal'));
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
        name: component.name,
        title: component.title,
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
        name: component.name,
        title: component.title,
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
        name: component.name,
        title: component.title,
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

    // Validate bottom nav routes (tabs and modals combined)
    const validBottomNavSections = ['home', 'apply', 'cards', 'payments', 'search'];
    for (const route of categorised.bottomNavRoutes) {
        if (!validBottomNavSections.includes(route.routeId)) {
            errors.push(
                `Invalid bottom nav section '${route.routeId}' in component '${route.id}'. Valid options: ${validBottomNavSections.join(', ')}`
            );
        }
    }

    // Warn if no carousel routes
    if (categorised.carouselRoutes.length === 0) {
        errors.push('Warning: No carousel routes defined. App may not have main content.');
    }

    // Warn if no bottom nav routes
    if (categorised.bottomNavRoutes.length === 0) {
        errors.push('Warning: No bottom nav routes defined. App may not have bottom navigation.');
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
        // Bottom nav: preserve Figma order (don't sort)
        // The order comes from the Figma layers panel
        return routes;
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

    let report = `\n=== CATEGORIZATION REPORT ===\n`;
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

    // Bottom nav routes (combined)
    report += `Bottom Nav Routes (${summary.bottomNavRoutes}):\n`;
    if (categorised.bottomNavRoutes.length > 0) {
        categorised.bottomNavRoutes.forEach(route => {
            const typeLabel = route.type === 'modal' ? 'modal' : 'tab';
            report += `  - ${route.routeId} (${typeLabel}): ${route.component.componentType} (${route.id})\n`;
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

    // Check bottom nav routes (combined tabs and modals)
    const bottomNavRoute = categorised.bottomNavRoutes.find(r => r.id === id);
    if (bottomNavRoute) return bottomNavRoute;

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
        ...categorised.bottomNavRoutes,
        ...categorised.childRoutes
    ];
}