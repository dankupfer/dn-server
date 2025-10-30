# Figma API System

## Overview

The Figma API system provides a server-side infrastructure for managing Figma plugin definitions, property mappings, and dynamic UI generation. This system handles the complexity of component configuration, allowing the Figma plugin to remain lightweight and focused on rendering.

## Architecture Philosophy

### Server-Side Heavy Lifting
- **Definitions as Source of Truth**: All component, frame, and journey definitions live on the server
- **Dynamic UI Generation**: Server provides configuration data for building forms dynamically
- **Property Mapping**: Server handles translation between generic Figma properties and semantic meanings
- **Validation & Business Logic**: Complex rules managed server-side, not in plugin code

### Figma Plugin Simplicity
- **Fetch & Render**: Plugin fetches definitions and renders UI
- **Minimal Logic**: No hardcoded forms or component-specific code
- **Generic Property System**: Uses prop0-prop9 that get mapped server-side

## Navigation & Rendering System

### Conceptual Model

The system supports three main component types that can be configured for different rendering contexts:

#### 1. **Journey Components**
Self-contained, engineer-built components with complex functionality (AI, customer data, etc.)

#### 2. **ScreenBuilder Frames**
Designer-friendly containers where components can be dragged and composed in Figma

#### 3. **App Frame**
Root application container with global settings (theme, brand, API config)

### Section Home Navigation System

Both Journey and ScreenBuilder components support a **sectionHome** property that determines where the component renders within the app's navigation structure.

When **sectionHome is checked**, the component becomes a home tab and you select from these section types:

#### **main-carousel** (Horizontal carousel sections)
- `summary` - Account summary view
- `everyday` - Daily banking operations  
- `invest` - Investment and savings
- `borrow` - Loans and credit
- `homes` - Home and property services
- `insurance` - Insurance products

#### **slide-panel** (Bottom navigation)
- `home` - Main home screen
- `apply` - Application flows
- `cards` - Card management

#### **full-screen** (Full screen takeover)
- All options except `home` (disabled for full-screen)

#### **modal** (Overlay presentation)
- `payments` - Payment processing
- `search` - Search functionality

When **sectionHome is unchecked**, the component renders as a standalone screen (child screen).

### Property Structure

#### Journey Component Properties

```
Journey
├── journeyOption                       - CoreJourney | AssistJourney | etc.
├── id (prop0)                          - Unique identifier
├── section_type (prop1)                - main-carousel | slide-panel | full-screen | modal
├── sectionHome (prop2)                 - Boolean: Is this a home tab?
├── sectionHomeOption (conditional)     - Shown when sectionHome is checked
│   ├── If main-carousel: summary, everyday, invest, borrow, homes, insurance
│   ├── If slide-panel: home, apply, cards
│   ├── If full-screen: home is disabled
│   └── If modal: payments, search
│
└── Journey-specific props (prop3-prop9) - Varies by journeyOption
    ├── CoreJourney
    │   └── customer-id (prop3)
    └── AssistJourney
        ├── tts (prop3)                 - Boolean: Enable text-to-speech
        └── gemini (prop4)              - Boolean: Use Gemini AI
```

#### ScreenBuilder Frame Properties

```
ScreenBuilder_frame
├── id (prop0)                          - Unique identifier
├── section_type (prop1)                - main-carousel | slide-panel | full-screen | modal
├── sectionHome (prop2)                 - Boolean: Is this a home tab?
└── sectionHomeOption (conditional)     - Shown when sectionHome is checked
    ├── If main-carousel: summary, everyday, invest, borrow, homes, insurance
    ├── If slide-panel: home, apply, cards
    ├── If full-screen: home is disabled
    └── If modal: payments, search
```

#### App Frame Properties

```
App_frame
├── brand                               - BrandA | BrandB
├── mode                                - light | dark
└── apiBase                             - http://localhost:3001
```

## Generic Property Mapping System

### Problem
Figma components have a fixed set of properties. As journeys evolve and need different configurations, we can't add/remove properties dynamically to existing instances.

### Solution
Use generic property names (`prop0`, `prop1`, etc.) on Figma components, then map them to semantic meanings based on context.

### Example

**Figma Component (Journey):**
```javascript
{
  journeyOption: "CoreJourney",
  prop0: "journey-login-1",
  prop1: "main-carousel", 
  prop2: true,
  sectionHomeOption: "summary",
  prop3: "customer-123"
}
```

**Server Mapping (CoreJourney):**
```javascript
{
  journeyOption: "CoreJourney",
  id: "journey-login-1",           // mapped from prop0
  section_type: "main-carousel",    // mapped from prop1
  sectionHome: true,                // mapped from prop2
  sectionHomeOption: "summary",     // conditional property
  customer_id: "customer-123"       // mapped from prop3
}
```

**Figma Component (ScreenBuilder):**
```javascript
{
  prop0: "screen-everyday-1",
  prop1: "main-carousel",
  prop2: true,
  sectionHomeOption: "everyday"
}
```

**Server Mapping (ScreenBuilder):**
```javascript
{
  id: "screen-everyday-1",          // mapped from prop0
  section_type: "main-carousel",    // mapped from prop1
  sectionHome: true,                // mapped from prop2
  sectionHomeOption: "everyday"     // conditional property
}
```

## API Endpoints

### Get Component Definitions
```
GET /api/figma/plugin/definitions/components
GET /api/figma/plugin/definitions/frames  
GET /api/figma/plugin/definitions/journeys
```

Returns JSON definitions with:
- Generic properties (what Figma needs)
- Type configurations (how to map and display them)
- UI metadata (labels, descriptions, validation rules)

### Get Form Configuration
```
POST /api/figma/plugin/form-config
Body: {
  componentType: "Journey",
  currentProperties: { Type: "CoreJourney", prop0: "...", ... }
}
```

Returns:
- Dynamic form fields to render
- Current values populated
- Conditional fields based on current state

### Create Module
```
POST /api/figma/create-module
Body: {
  moduleName: string,
  moduleId: string,
  screenData: object,
  frameType: string,
  mappedProperties: object  // Already mapped from generic props
}
```

Creates React Native module files based on Figma design.

## File Structure

```
figma-api/
├── README.md                          # This file
├── definitions/                       # Component definitions (JSON)
│   ├── components.json                # ScreenBuilder items (AccountCard, etc)
│   ├── frames.json                    # Container frames (App_frame, ScreenBuilder_frame)
│   └── journeys.json                  # Journey component definitions
├── routes/
│   └── index.ts                       # Route aggregator (Figma API routes)
├── controllers/
│   └── figmaController.ts             # Main Figma API controller
├── views/                             # Figma plugin UI
│   ├── index.html                     # Plugin UI HTML
│   └── scripts/                       # UI scripts
│       ├── configure.ts               # Main orchestrator
│       ├── configure.conditional.ts   # Conditional field logic (sectionHome)
│       ├── configure.builders.ts      # Form building functions
│       ├── configure.autosave.ts      # Save and data handling
│       ├── api.ts                     # API communication
│       └── utils.ts                   # Utility functions
├── services/                          # (Future)
│   ├── propertyMapper.service.js      # Map generic props to semantic
│   ├── formBuilder.service.js         # Build form configurations
│   ├── validator.service.js           # Validate configurations
│   └── codeGenerator.service.js       # Generate React Native code
└── types/                             # (Future)
    ├── definitions.types.ts           # TypeScript definitions
    └── properties.types.ts            # Property mapping types
```

## Implementation Plan

### Phase 1: Server Structure ✅
- [x] Create figma-api folder structure
- [x] Document system architecture
- [x] Move existing Figma routes into new structure
- [x] Create base endpoint controllers
- [x] Refactor configure.ts into modular files

### Phase 2: Definition System ✅
- [x] Create JSON definition files (components, frames, journeys)
- [x] Implement GET /api/figma/plugin/definitions endpoints
- [x] Add property mapping service
- [x] Add validation service

### Phase 3: Dynamic Forms ✅
- [x] Implement POST /api/figma/plugin/form-config endpoint
- [x] Build form configuration logic based on component state
- [x] Handle conditional field rendering
- [x] Support nested dependencies (section_type → sectionHome → sectionHomeOption)

### Phase 4: Figma Plugin Updates ✅
- [x] Replace hardcoded forms with API calls
- [x] Fetch definitions on plugin load
- [x] Fetch form config when component selected
- [x] Update property mapping before save
- [x] Implement sectionHome conditional logic

### Phase 5: Code Generation (In Progress)
- [ ] Move module generation logic to server
- [ ] Implement property mapping in code gen
- [ ] Add validation before file creation
- [ ] Support all section types in generated code

## Benefits

### Maintainability
- ✅ Single source of truth for definitions
- ✅ No plugin updates needed for new journey types
- ✅ Easier to test server-side logic
- ✅ Clear separation of concerns

### Scalability
- ✅ Add new journey types without plugin changes
- ✅ Support unlimited property combinations
- ✅ Easy to add new navigation types
- ✅ Generic property system scales to 10+ props

### Developer Experience
- ✅ Clear documentation of system
- ✅ Predictable API contracts
- ✅ TypeScript types for safety
- ✅ Validation catches errors early

## Future Enhancements

### Multi-Journey Support
Support multiple journey types beyond Core/Assist:
- OnboardingJourney
- PaymentJourney  
- VerificationJourney
- CustomJourney (user-defined)

### Advanced Property Types
- Conditional validation rules
- Property dependencies (A requires B)
- Default value computation
- Property groups/sections

### Version Management
- API versioning for breaking changes
- Migration system for old definitions
- Backwards compatibility layer

### UI Improvements
- Preview mode in Figma
- Live validation feedback
- Property suggestion/autocomplete
- Visual navigation flow builder

## Questions & Decisions

### Q: Why generic properties instead of dynamic properties?
**A**: Figma doesn't support adding properties to component instances after creation. Generic properties with server-side mapping gives us flexibility without this limitation.

### Q: Why separate Journey from ScreenBuilder if structure is similar?
**A**: Journey components are self-contained with complex logic (AI, data fetching). ScreenBuilder frames are designer-friendly containers. Different use cases, same configuration system.

### Q: Can we add more than 10 generic props?
**A**: Yes, but 10 covers current needs. We can extend if needed, but should evaluate if complexity is warranted.

### Q: How does the sectionHome system work?
**A**: sectionHome is a boolean that determines if the component is a home tab. When checked, you select a section_type (main-carousel, slide-panel, full-screen, modal) and then choose the specific section from available options for that type. When unchecked, it's a standalone child screen.

### Q: Why four section types instead of the old three render types?
**A**: The new system better reflects actual navigation patterns: main-carousel for horizontal tabs, slide-panel for bottom nav, full-screen for takeovers, and modal for overlays. It's more intuitive and maps directly to UI behavior.

---

**Last Updated**: January 2025
**Status**: Phase 4 Complete - Working on Phase 5 (Code Generation)