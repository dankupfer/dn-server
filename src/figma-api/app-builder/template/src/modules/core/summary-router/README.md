# Combined Auth Module

**Category:** Core  
**Dependencies:** ThemeProvider, Summary Module, Everyday Module  
**Platform:** iOS, Android, Web

## Overview
The Combined Auth Module is the main authentication and dashboard component that handles user login, registration, and the primary app interface with a horizontal carousel navigation system.

## Quick Start
```typescript
import CombinedAuthModule from './src/modules/core/combined-auth';

// Basic usage - just drop it in
<CombinedAuthModule />
```

## File Structure
```
modules/core/combined-auth/
├── index.tsx                          # Main component with auth flow and dashboard
├── styles.ts                          # Main component styles
├── components/
│   ├── BottomTabs/
│   │   └── index.tsx                  # Bottom navigation component (needs work)
│   └── PillCarousel/
│       ├── index.tsx                  # Horizontal pill navigation with masking
│       └── styles.ts                  # Pill carousel styles
└── data/
    ├── carouselSections.ts            # Section definitions for horizontal carousel
    └── mockData.ts                    # Mock data for cards and components
```

## Key Features

### 1. Authentication Flow
- **Splash Screen**: 2-second loading screen
- **Login/Register**: Form-based authentication with validation
- **Dev Mode**: `DEV_SKIP_AUTH = true` bypasses auth for development

### 2. Horizontal Carousel Navigation
- **Sections**: Summary, Everyday, Save & Invest, Borrow
- **Pill Navigation**: Advanced masking system with green background reveal effect
- **Cross-Platform**: Works on mobile (with momentum) and web (with timer-based snap)

### 3. PillCarousel Component (Advanced Masking System)
The most complex part - implements a 4-layer masking system:
1. **Grey text layer**: Static background text
2. **Pill-shaped masks**: Individual containers that clip content
3. **Moving green background**: Slides horizontally behind pills
4. **White text layer**: Offset to appear static while being revealed by green background

#### Key Implementation Details:
- **Nested masking**: Green background is clipped by pill shapes, then reveals white text
- **Platform differences**: 
  - Mobile: Uses `onMomentumScrollEnd` for scroll detection
  - Web: Uses timer-based approach (150ms debounce) due to event limitations
- **Animation**: Click = instant snap, Drag = smooth follow

### 4. Section Management
- **Feature Components**: Separate modules in `modules/feature/`
- **Dynamic Loading**: Sections can load different feature components
- **Responsive**: Each section takes full screen width

## State Management

### Main States
- `currentState`: 'splash' | 'login' | 'register' | 'dashboard'
- `activeSection`: Current carousel section index (0-3)
- `scrollProgress`: Progress between sections (0-1)
- `isDragging`: Whether user is actively scrolling

### Navigation Flow
1. **User drags** → `handleScroll` updates `scrollProgress` → Green background follows
2. **Drag ends** → Timer detects stop → `handleScrollStop` snaps to nearest section
3. **User clicks pill** → `handlePillPress` → Instant section change + pill auto-scroll

## Quick Configuration
```typescript
// Skip auth for development
const DEV_SKIP_AUTH = true;

// Add new carousel section
// 1. Edit carouselSections.ts
// 2. Add case in renderSectionContent()
```

## Platform Considerations

### Mobile (Simulator)
- Uses `pagingEnabled={true}` for proper section snapping
- Relies on `onMomentumScrollEnd` for scroll completion
- Smooth momentum scrolling works natively

### Web
- `pagingEnabled` doesn't work reliably
- Uses timer-based scroll detection (150ms debounce)
- CSS limitations require `as any` casting for web-specific styles
- Vertical scrolling needs explicit `maxHeight: '100vh'` and `overflowY: 'scroll'`

## Known Issues & Limitations

1. **Web Scrolling**: React Native Web has limited scroll control
2. **Masking Complexity**: The 4-layer pill masking is intricate and hard to debug
3. **Platform Differences**: Different behavior between mobile and web for scroll events
4. **Performance**: Multiple animated values and interpolations may impact performance

## Current Status

### ✅ Completed
- Authentication flow (login/register/splash)
- Horizontal carousel with section navigation
- Advanced pill carousel with masking effects
- Cross-platform compatibility (mobile + web)
- Feature component integration (Summary, Everyday)

### 🚧 In Progress
- Bottom navigation component (needs implementation)
- Vertical scrolling fixes for web

### 📋 TODO
- Remaining carousel sections (Save & Invest, Borrow)
- Bottom navigation functionality
- Error handling and validation
- Loading states
- Accessibility improvements

## Development Notes

### Working with PillCarousel
- The masking system is fragile - changes to z-index or positioning can break it
- Always test on both mobile and web when making changes
- The green background position calculation: `index * 108` (100px width + 8px spacing)

### Adding New Sections
1. Add section to `carouselSections.ts`
2. Create feature component in `modules/feature/`
3. Add case to `renderSectionContent()` switch statement

### Debugging Tips
- Use `console.log` in scroll handlers to track state changes
- Browser inspector helpful for CSS debugging on web
- Check z-index layering if masking breaks

## Dependencies
- React Native core components
- No external libraries (by design)
- Uses Animated API for smooth transitions