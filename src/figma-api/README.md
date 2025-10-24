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

### Rendering Types

All Journey and ScreenBuilder components support three rendering approaches:

#### **Standard** (Default screen flow)
Content slides in from right-to-left. Bottom navigation stays fixed.

**Screen Types for Standard:**
- **Tabs-home**: Keeps top tabs + bottom nav, replaces middle content
  - Sections: `summary`, `everyday`, `save-invest`, `borrow`, `homes`, `insurance`
- **Bottom-home**: Keeps bottom nav only, replaces everything else
  - Sections: `home`, `apply`, `payments`, `search`, `card`
- **Child**: Standalone screen, no section needed (slides in as child of current)

#### **Modal**
Content slides up from bottom as an overlay.

**Screen Types for Modal:**
- **Tabs-home**: Modal with tabs context
- **Bottom-home**: Modal from bottom nav (e.g., payments, search)
- **Child**: Modal without specific navigation context

#### **Full**
Complete screen takeover, slides in from right-to-left, replaces everything including navigation.

**Screen Types for Full:**
- Same options as Standard/Modal

### Property Structure

#### Journey Component Properties

```
Journey
├── id (prop0)                          - Unique identifier
├── render_type (prop1)                 - Standard | Modal | Full
├── screen_type (prop2)                 - Tabs-home | Bottom-home | Child
├── section (prop3)                     - Conditional based on screen_type
│   ├── If Tabs-home: summary, everyday, save-invest, borrow, homes, insurance
│   ├── If Bottom-home: home, apply, payments, search, card
│   └── If Child: (not shown)
│
├── Type (prop4)                        - CoreJourney | AssistJourney
│   ├── CoreJourney
│   │   └── customer-id (prop5)
│   └── AssistJourney
│       ├── tts (prop6)                 - Boolean: Enable text-to-speech
│       └── gemini (prop7)              - Boolean: Use Gemini AI
│
└── prop8-prop9                         - Reserved for future use
```

#### ScreenBuilder Frame Properties

```
ScreenBuilder_frame
├── id (prop0)                          - Unique identifier
├── render_type (prop1)                 - Standard | Modal | Full
├── screen_type (prop2)                 - Tabs-home | Bottom-home | Child
└── section (prop3)                     - Conditional based on screen_type
    ├── If Tabs-home: summary, everyday, save-invest, borrow, homes, insurance
    ├── If Bottom-home: home, apply, payments, search, card
    └── If Child: (not shown)
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

**Figma Component:**
```javascript
{
  Type: "CoreJourney",
  prop0: "journey-login-1",
  prop1: "Standard", 
  prop2: "Tabs-home",
  prop3: "summary",
  prop5: "customer-123"
}
```

**Server Mapping (CoreJourney):**
```javascript
{
  Type: "CoreJourney",
  id: "journey-login-1",           // mapped from prop0
  render_type: "Standard",          // mapped from prop1
  screen_type: "Tabs-home",         // mapped from prop2
  section: "summary",               // mapped from prop3
  customer_id: "customer-123"       // mapped from prop5
}
```

**Server Mapping (AssistJourney):**
```javascript
{
  Type: "AssistJourney",
  id: "journey-chat-1",             // mapped from prop0
  render_type: "Modal",             // mapped from prop1
  screen_type: "Bottom-home",       // mapped from prop2
  section: "search",                // mapped from prop3
  tts: true,                        // mapped from prop6
  gemini: false                     // mapped from prop7
}
```

## API Endpoints

### Get Component Definitions
```
GET /api/figma/definitions/components
GET /api/figma/definitions/frames  
GET /api/figma/definitions/journeys
```

Returns JSON definitions with:
- Generic properties (what Figma needs)
- Type configurations (how to map and display them)
- UI metadata (labels, descriptions, validation rules)

### Get Form Configuration
```
POST /api/figma/form-config
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
│   ├── frames.json                    # Container frames
│   └── journeys.json                  # Journey component definitions
├── routes/
│   ├── definitions.routes.js          # GET definition endpoints
│   ├── formConfig.routes.js           # POST form config endpoint
│   ├── module.routes.js               # POST create module endpoint
│   └── index.js                       # Route aggregator
├── controllers/
│   ├── definitions.controller.js      # Serve definitions
│   ├── formConfig.controller.js       # Build dynamic forms
│   └── module.controller.js           # Generate React Native files
├── services/
│   ├── propertyMapper.service.js      # Map generic props to semantic
│   ├── formBuilder.service.js         # Build form configurations
│   ├── validator.service.js           # Validate configurations
│   └── codeGenerator.service.js       # Generate React Native code
└── types/
    ├── definitions.types.ts           # TypeScript definitions
    └── properties.types.ts            # Property mapping types
```

## Implementation Plan

### Phase 1: Server Structure ✅
- [x] Create figma-api folder structure
- [x] Document system architecture
- [ ] Move existing Figma routes into new structure
- [ ] Create base endpoint controllers

### Phase 2: Definition System
- [ ] Create JSON definition files (components, frames, journeys)
- [ ] Implement GET /api/figma/definitions endpoints
- [ ] Add property mapping service
- [ ] Add validation service

### Phase 3: Dynamic Forms
- [ ] Implement POST /api/figma/form-config endpoint
- [ ] Build form configuration logic based on component state
- [ ] Handle conditional field rendering
- [ ] Support nested dependencies (render_type → screen_type → section)

### Phase 4: Figma Plugin Updates
- [ ] Replace hardcoded forms with API calls
- [ ] Fetch definitions on plugin load
- [ ] Fetch form config when component selected
- [ ] Update property mapping before save

### Phase 5: Code Generation
- [ ] Move module generation logic to server
- [ ] Implement property mapping in code gen
- [ ] Add validation before file creation
- [ ] Support all render types in generated code

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

### Q: How do modals differ from standard renders?
**A**: Modals slide up from bottom and overlay content. Standard renders slide left-to-right. Both support same screen_type options.

---

**Last Updated**: October 24, 2025
**Status**: Planning Phase - Ready for Implementation
```