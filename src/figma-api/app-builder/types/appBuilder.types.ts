// figma-api/app-builder/types/appBuilder.types.ts

/**
 * APP BUILDER TYPE DEFINITIONS
 * 
 * Complete TypeScript definitions for the app builder system.
 * Covers config parsing, component categorisation, module generation, and API responses.
 */

// ============================================================================
// INPUT TYPES (from Figma plugin)
// ============================================================================

/**
 * Full app configuration from Figma plugin
 */
export interface FullAppConfig {
  appName: string;
  appFrame: AppFrame;
  components: FigmaComponent[];
  exportedAt: string;
  version: string;
}

/**
 * App-level configuration
 */
export interface AppFrame {
  appName: string;
  brand: string;          // BrandA, BrandB, reimaginedLloyds, etc.
  mode: 'light' | 'dark';
  apiBase: string;        // API base URL
}

/**
 * Component from Figma (ScreenBuilder or Journey)
 */
export interface FigmaComponent {
  componentName: 'ScreenBuilder_frame' | 'Journey';
  nodeId: string;
  properties: ComponentProperties;
}

/**
 * Component properties (generic props mapped server-side)
 */
export interface ComponentProperties {
  // Common properties
  id?: string;
  name?: string;              // Short label for navigation
  title?: string;             // Full title for headers (optional, defaults to name)
  section_type?: SectionType;
  sectionHome?: boolean;
  sectionHomeOption?: string;
  
  // Journey-specific
  journeyOption?: JourneyType;
  prop0?: string;
  prop1?: string;
  prop2?: boolean | string;
  prop3?: string | boolean;
  prop4?: string | boolean;
  prop5?: string | boolean;
  
  // Legacy/unmapped properties (with # suffix)
  [key: string]: any;
}

/**
 * Valid section types
 */
export type SectionType = 
  | 'main-carousel'   // Horizontal carousel
  | 'slide-panel'     // Bottom nav tab
  | 'modal'           // Modal overlay
  | 'slide'           // Child screen (slide in)
  | 'full';           // Child screen (full takeover)

/**
 * Journey types
 */
export type JourneyType = 
  | 'CoreJourney' 
  | 'AssistJourney';

// ============================================================================
// NORMALIZED TYPES (after parsing)
// ============================================================================

/**
 * Normalised component after parsing and validation
 */
export interface NormalisedComponent {
  id: string;
  name: string;               // Short label for navigation
  title?: string;             // Full title for headers (optional)
  componentType: 'ScreenBuilder_frame' | 'Journey';
  nodeId: string;
  sectionType: SectionType;
  isHome: boolean;
  homeSection?: string;           // Normalised lowercase (summary, everyday, etc.)
  properties: ComponentProperties;
  
  // Journey-specific
  journeyType?: JourneyType;
  journeyConfig?: JourneyConfig;
}

/**
 * Journey configuration
 */
export interface JourneyConfig {
  journeyType: JourneyType;
  customerId?: string;
  enableTTS?: boolean;
  enableGemini?: boolean;
  serverUrl?: string;
  debug?: boolean;
  useMockMode?: boolean;
}

// ============================================================================
// CATEGORIZED TYPES (after categorisation)
// ============================================================================

/**
 * Components categorised by routing type
 */
export interface CategorisedComponents {
  carouselRoutes: RouteComponent[];
  bottomNavTabs: RouteComponent[];
  bottomNavModals: RouteComponent[];
  childRoutes: RouteComponent[];
}

/**
 * Component ready for routing
 */
export interface RouteComponent {
  id: string;
  routeId: string;              // Used in router files (normalised)
  name: string;                 // Display name / nav label
  title?: string;               // Full title for headers (optional)
  component: NormalisedComponent;
  type?: 'tab' | 'modal' | 'slide' | 'full';  // For bottomNav and child routes
}

// ============================================================================
// GENERATION TYPES (module and file generation)
// ============================================================================

/**
 * Module generation configuration
 */
export interface ModuleConfig {
  appId: string;
  component: RouteComponent;
  outputPath: string;           // Full path to module folder
  componentName: string;        // React component name (PascalCase)
  fileName: string;             // File name (kebab-case)
}

/**
 * Generated module result
 */
export interface GeneratedModule {
  moduleConfig: ModuleConfig;
  files: GeneratedFile[];
  success: boolean;
  error?: string;
}

/**
 * Generated file details
 */
export interface GeneratedFile {
  path: string;
  type: 'index' | 'config' | 'screenData';
  content: string;
  written: boolean;
}

/**
 * Router file generation config
 */
export interface RouterConfig {
  type: 'carousel' | 'bottomNav' | 'child';
  routes: RouteComponent[];
  outputPath: string;
  imports: RouterImport[];
}

/**
 * Import statement for router files
 */
export interface RouterImport {
  componentName: string;        // GeneratedSummary
  importPath: string;           // '../../feature/generated-myapp3/summary-screen'
}

/**
 * Generated router result
 */
export interface GeneratedRouter {
  routerConfig: RouterConfig;
  filePath: string;
  content: string;
  written: boolean;
  success: boolean;
  error?: string;
}

// ============================================================================
// SERVICE RETURN TYPES
// ============================================================================

/**
 * Parser service result
 */
export interface ParseResult {
  success: boolean;
  config?: FullAppConfig;
  normalised?: NormalisedComponent[];
  errors: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  type: 'error' | 'warning';
  field?: string;
  message: string;
  component?: string;           // Component ID if applicable
}

/**
 * Categoriser service result
 */
export interface CategorisationResult {
  success: boolean;
  categorised?: CategorisedComponents;
  summary: CategorisationSummary;
  warnings: string[];
}

/**
 * Categorisation summary
 */
export interface CategorisationSummary {
  totalComponents: number;
  carouselRoutes: number;
  bottomNavTabs: number;
  bottomNavModals: number;
  childRoutes: number;
  duplicatesHandled: number;
}

/**
 * Module generator service result
 */
export interface ModuleGenerationResult {
  success: boolean;
  modules: GeneratedModule[];
  totalFiles: number;
  errors: string[];
}

/**
 * Router generator service result
 */
export interface RouterGenerationResult {
  success: boolean;
  routers: GeneratedRouter[];
  errors: string[];
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * API request body
 */
export interface AppBuilderRequest {
  config: FullAppConfig;
  targetPath?: string;          // Optional override for output path
  options?: BuildOptions;
}

/**
 * Build options
 */
export interface BuildOptions {
  skipValidation?: boolean;
  overwriteExisting?: boolean;
  dryRun?: boolean;             // Generate but don't write files
  verbose?: boolean;
}

/**
 * API response - Success
 */
export interface AppBuilderSuccessResponse {
  success: true;
  buildId: string;
  appPath: string;
  summary: BuildSummary;
  timestamp: string;
}

/**
 * Build summary details
 */
export interface BuildSummary {
  appName: string;
  totalComponents: number;
  carouselRoutes: number;
  bottomNavRoutes: number;
  childRoutes: number;
  generatedFiles: number;
  warnings: string[];
}

/**
 * API response - Error
 */
export interface AppBuilderErrorResponse {
  success: false;
  error: string;
  details?: string;
  validationErrors?: ValidationError[];
  timestamp: string;
}

/**
 * Combined API response type
 */
export type AppBuilderResponse = AppBuilderSuccessResponse | AppBuilderErrorResponse;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Section options for main carousel
 */
export type CarouselSection = 
  | 'summary' 
  | 'everyday' 
  | 'invest' 
  | 'borrow' 
  | 'homes' 
  | 'insurance';

/**
 * Section options for bottom nav tabs
 */
export type BottomNavTab = 
  | 'home' 
  | 'apply' 
  | 'cards';

/**
 * Section options for modals
 */
export type ModalSection = 
  | 'payments' 
  | 'search';

/**
 * Valid home section options (combined)
 */
export type HomeSectionOption = CarouselSection | BottomNavTab | ModalSection;

/**
 * Component name mapping for imports
 */
export interface ComponentNameMapping {
  original: string;             // 'summary-screen'
  pascalCase: string;           // 'SummaryScreen'
  kebabCase: string;            // 'summary-screen'
  importPath: string;           // '../../feature/generated-myapp3/summary-screen'
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * ScreenBuilder template data
 */
export interface ScreenBuilderTemplate {
  componentName: string;
  importPath: string;
  testID: string;
}

/**
 * Journey template data
 */
export interface JourneyTemplate {
  componentName: string;
  journeyType: JourneyType;
  configPath: string;
}

/**
 * Router template data
 */
export interface RouterTemplate {
  imports: RouterImport[];
  routes: RouterRouteData[];
}

/**
 * Router route data for templates
 */
export interface RouterRouteData {
  id: string;
  name: string;
  componentName: string;
  type?: 'tab' | 'modal' | 'slide' | 'full';
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard for Journey components
 */
export function isJourneyComponent(component: NormalisedComponent): boolean {
  return component.componentType === 'Journey';
}

/**
 * Type guard for ScreenBuilder components
 */
export function isScreenBuilderComponent(component: NormalisedComponent): boolean {
  return component.componentType === 'ScreenBuilder_frame';
}

/**
 * Type guard for home components
 */
export function isHomeComponent(component: NormalisedComponent): boolean {
  return component.isHome === true;
}

/**
 * Type guard for success response
 */
export function isSuccessResponse(
  response: AppBuilderResponse
): response is AppBuilderSuccessResponse {
  return response.success === true;
}

/**
 * Type guard for error response
 */
export function isErrorResponse(
  response: AppBuilderResponse
): response is AppBuilderErrorResponse {
  return response.success === false;
}