# Main Navigator Module

**Category:** Core  
**Dependencies:** ThemeProvider, ModuleLoader  
**Platform:** iOS, Android, Web

## Overview
Central navigation controller that manages app flow between splash, authentication, and main screens using dynamic module loading.

TO BE HONEST, this is just a placeholder module for now. I'd like to re-write this one from scratch.

## Quick Start
```typescript
import MainNavigator from './src/modules/core/main-navigator';

// Basic usage - handles entire app navigation
<MainNavigator />
```

## Key Features

- **Dynamic Module Loading**: Loads and renders modules based on app state
- **Navigation Flow**: Manages splash → auth → main app progression  
- **Theme Integration**: Fully themed loading and error states
- **Module Validation**: Ensures required modules are loaded before navigation
- **Error Handling**: Graceful fallbacks for missing modules

## Navigation Flow

1. **Module Loading**: Waits for required modules (splash, authentication, account-overview)
2. **Splash Screen**: Shows for 3 seconds
3. **Authentication**: Displays auth module for 2 seconds (mock timing)
4. **Main App**: Transitions to account overview

## Current Status

### ✅ Completed
- Dynamic module loading and validation
- Basic navigation state management
- Theme-aware styling and loading states
- Error handling for missing modules

### 📋 TODO
- **Real Authentication**: Replace mock timing with actual auth state
- **React Navigation**: Integrate proper navigation library
- **Deep Linking**: Support for URL-based navigation
- **Navigation API**: Expose navigation functions to other modules
- **Persistence**: Remember navigation state across app restarts

## Known Limitations

- Uses mock timers instead of real authentication state
- No back navigation or navigation stack
- Limited to linear flow (splash → auth → main)
- No deep linking or URL routing support

## Dependencies
- ModuleLoader system
- ThemeProvider for styling
- Required modules: splash, authentication, account-overview