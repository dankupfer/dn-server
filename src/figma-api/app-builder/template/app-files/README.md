# Create DN Starter CLI

A CLI tool for creating modular React Native applications with Expo. This tool generates customizable projects with a modular architecture using pre-configured templates for rapid prototyping, now featuring seamless Figma integration for design-to-code workflows.

## Dependencies

This starter kit uses published npm packages for components and design tokens:

- **[@dankupfer/dn-components](https://www.npmjs.com/package/@dankupfer/dn-components)** - React Native component library with comprehensive theming support
- **[@dankupfer/dn-tokens](https://www.npmjs.com/package/@dankupfer/dn-tokens)** - Centralized design tokens and assets

> ⚠️ **Experimental packages**: These are development packages not recommended for production use. APIs are subject to breaking changes without notice.

## Features

- 🏗️ **Template-Based Architecture**: Choose from basic, auth, or full-featured templates
- 📦 **Pre-built Modules**: Core and feature modules ready to use
- 🛠️ **Interactive CLI**: Easy project setup with template selection
- 📱 **Rapid Prototyping**: Get started quickly with pre-configured setups
- 🔧 **Expo Integration**: Built on Expo's reliable foundation
- 🎨 **JSON-Driven Screen Builder**: Create screens dynamically using JSON configuration
- 🔧 **Hidden Developer Menu**: Secret gesture-activated settings for development
- **🎯 NEW: Figma Integration**: Design screens in Figma and automatically generate React Native modules

## 🎨 Figma Integration

Transform your design-to-development workflow with seamless Figma integration:

### What's Included

- **🔗 Bridge Server**: Express server that connects Figma to your React Native project
- **📁 Automatic File Creation**: Generate modules directly from Figma designs
- **🎯 Target Section Override**: Replace existing carousel sections with new designs
- **🔄 Live Development**: See Figma designs in your app with hot reload
- **📝 Auto Routing**: Automatically update navigation and imports

### Quick Figma Setup

1. **Install the DN Figma plugin** from [github.com/dankupfer/dn-figma](https://github.com/dankupfer/dn-figma)
2. **Start the bridge server** in your project:
   ```bash
   cd figma-bridge
   npm install
   npm run dev
   ```
3. **Design in Figma** using the generated components
4. **Export to your app** with one click - files appear automatically!

### Complete Workflow

```
Figma Design → DN Figma Plugin → Bridge Server → React Native Files → Hot Reload
```

**Benefits:**
- ✅ **No manual file creation** - Everything happens automatically
- ✅ **Visual order preserved** - Components appear in the same order as Figma
- ✅ **Target existing sections** - Override "Save & Invest", "Everyday", etc.
- ✅ **Instant feedback** - See changes immediately in your simulator

## Getting Started / Installation

```bash
# Create a new project
npx @dankupfer/create-dn-starter my-app

# Navigate to the project directory
cd my-app

# Start the development server
npm start

# OPTIONAL: Start Figma bridge server (for design integration)
cd figma-bridge
npm install
npm run dev
```

## Usage

### Basic Usage

```bash
@dankupfer/create-dn-starter my-app
```

The CLI will prompt you to select which template you want to use for your project.

### Skip Prompts (Use Full Template)

```bash
@dankupfer/create-dn-starter my-app --yes
```

## Available Templates

### Basic Starter
- **Description**: Simple app with basic navigation and components
- **Best for**: Minimal setup, custom development from scratch
- **Modules**: None (clean slate)
- **Figma Integration**: ✅ Included

### Auth Starter
- **Description**: Includes authentication and user management
- **Best for**: Apps requiring user authentication
- **Modules**: Splash Screen, Main Navigator, Account Overview
- **Figma Integration**: ✅ Included

### Full Featured
- **Description**: Complete starter with theming, auth, and all modules
- **Best for**: Complex apps, rapid prototyping
- **Modules**: Splash, Authentication, Combined Auth, Summary, Everyday Banking, Cards, Applications
- **Figma Integration**: ✅ Included

## Generated Project Structure

```
my-app/
├── figma-bridge/                # NEW: Figma integration server
│   ├── server.ts               # Express server for Figma plugin communication
│   ├── types.ts                # TypeScript interfaces for API
│   ├── package.json            # Server dependencies
│   └── README.md              # Bridge server documentation
├── src/
│   ├── components/
│   │   ├── ScreenBuilder/       # Dynamic screen rendering system
│   │   ├── HiddenDevMenu/       # Developer settings menu
│   │   └── (other local components)
│   ├── config/
│   │   ├── modules.ts           # Module definitions
│   │   └── moduleLoader.ts      # Module loading utilities
│   ├── modules/
│   │   ├── core/                # Essential modules
│   │   │   ├── combined-auth/   # Main app with carousel navigation
│   │   │   │   └── screenRoutes.tsx  # Auto-updated by Figma bridge
│   │   │   └── settings/        # Developer settings module
│   │   └── feature/             # Optional feature modules
│   │       ├── everyday/        # Banking everyday module with screenData.json
│   │       └── (figma-generated modules appear here)
│   └── (local utilities)
├── assets/                      # Static assets
├── App.<template>.tsx           # Template-specific app entry point
├── App.tsx                      # Main app component
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript config
```

**Note**: Components like `Tile`, `ThemedText`, `Icon`, and theming system are now provided by `@dankupfer/dn-components` instead of local implementations.

## 🎨 Figma Design-to-Code Workflow

### Prerequisites

1. **Figma Desktop**: Plugin requires network access (not available in browser)
2. **DN Figma Plugin**: Install from [github.com/dankupfer/dn-figma](https://github.com/dankupfer/dn-figma)
3. **Bridge Server Running**: `npm run dev` in the `figma-bridge/` folder

### Step-by-Step Workflow

#### 1. Start the Bridge Server
```bash
cd your-dn-starter-project/figma-bridge
npm run dev
```
Server will run on `http://localhost:3001`

#### 2. Create Components in Figma
1. Open DN Figma plugin in Figma Desktop
2. Click "Create Components" to generate:
   - **AccountCard**: Bank account displays with balance
   - **CreditCard**: Credit card components
   - **SectionHeader**: Text headers for organizing content

#### 3. Design Your Screen
1. Drag component instances onto your canvas
2. Customize text content by double-clicking
3. Arrange components top-to-bottom (order is preserved)
4. Group in a frame for organization

#### 4. Export to Your App
1. **Select your frame** containing components
2. **Choose target section**:
   - "Create New Module" - Adds new route
   - "Override Summary" - Replaces Summary section
   - "Override Everyday" - Replaces Everyday section  
   - "Override Save & Invest" - Replaces Save & Invest section
   - "Override Borrow" - Replaces Borrow section
3. **Enter module name** (e.g., "SaveInvestRedesign")
4. **Click "Export to App"**
5. **Files created automatically** - Check your `src/modules/feature/` folder!

#### 5. See Results Immediately
- New module files appear in your project
- Navigation routing updated automatically  
- Hot reload shows changes in simulator
- Components appear in same order as Figma design

### Generated Figma Files

Each Figma export creates:

**`src/modules/feature/{module-id}/index.tsx`**
```typescript
// Generated by DN Figma Bridge
import React from 'react';
import { ScreenBuilder, type ScreenConfig } from '@dankupfer/dn-components';
import screenData from './screenData.json';

const SaveInvestRedesign: React.FC<Props> = ({ screenWidth }) => {
  const config = screenData as ScreenConfig;
  
  return (
    <ScreenBuilder 
      config={config} 
      screenWidth={screenWidth} 
    />
  );
};

export default SaveInvestRedesign;
```

**`src/modules/feature/{module-id}/screenData.json`**
```json
{
  "scrollable": true,
  "components": [
    {
      "type": "SectionHeader",
      "props": {
        "id": "header-1",
        "title": "Save & Invest"
      }
    },
    {
      "type": "AccountCard", 
      "props": {
        "id": "account-1",
        "title": "Investment Account",
        "balance": 2500.00,
        "variant": "condensed"
      }
    }
  ]
}
```

**Auto-updated `screenRoutes.tsx`**
```typescript
// Import added automatically
import SaveInvestRedesign from '../../feature/save-invest-redesign';

export const screenRoutes: ScreenRoute[] = [
  { id: 'save-invest', name: 'Save Invest', component: SaveInvestRedesign },
  // Plugin will add new routes here
];
```

### Figma Bridge Server API

The bridge server provides these endpoints:

- **GET** `/api/health` - Server status check
- **POST** `/api/create-module` - Create module from Figma data

For complete API documentation, see `figma-bridge/README.md`.

### Troubleshooting Figma Integration

**Plugin can't connect to server:**
1. Ensure bridge server is running: `npm run dev` in `figma-bridge/`
2. Check `http://localhost:3001/api/health` responds
3. Use Figma Desktop (not browser)

**Files not appearing:**
1. Check server console for errors
2. Verify folder permissions
3. Ensure `screenRoutes.tsx` has plugin comment

**Components wrong order:**
1. Arrange components top-to-bottom in Figma
2. Components within 5px Y-distance sorted left-to-right
3. Check browser console for position logs

## Component Import System

The starter kit provides a flexible component import system that allows you to use components from the published `@dankupfer/dn-components` package while also enabling local development and overrides.

## Import Options

### Option 1: Direct Import (Recommended for Production)
```typescript
import { BottomTabs, Header, Tile } from '@dankupfer/dn-components';
```

### Option 2: Flexible Import System (Recommended for Development)
```typescript
import { BottomTabs, Header, TestComponent } from '../../utils/imports';
```

## Benefits of the Flexible Import System

- **Development Flexibility**: Override published components with local versions for testing
- **Local Development Components**: Add experimental components in `src/dev/components/`
- **Single Import Source**: Get both published and local components from one import
- **Automatic Fallback**: Falls back to published components if local ones don't exist

## Adding Local Development Components

1. Create your component in `src/dev/components/YourComponent/index.tsx`
2. Export it in `src/dev/components/index.ts`:
   ```typescript
   export { default as YourComponent } from './YourComponent';
   ```
3. Import via the flexible system:
   ```typescript
   import { YourComponent } from '../../utils/imports';
   ```

## When to Use Which

- **Direct imports**: When you want exactly what's published and nothing else
- **Flexible imports**: When you want the ability to override with local components during development

## How It Works

The `src/utils/imports.ts` system:

1. **Loads Published Components**: Imports all components from `@dankupfer/dn-components`
2. **Loads Local Dev Components**: In development mode, loads components from `src/dev/components/`
3. **Merges with Priority**: Local components override published ones if they exist
4. **Provides Single Interface**: Exports everything through one convenient import

### Example: Testing Component Variations

```typescript
// src/dev/components/BottomTabs/index.tsx - Local override
const BottomTabs = () => {
  return <Text>Testing new BottomTabs design!</Text>;
};

// src/modules/core/combined-auth/index.tsx
import { BottomTabs } from '../../utils/imports'; // Uses local version in dev
```

This allows you to experiment with component changes without modifying the published package, perfect for prototyping and testing new features before they're ready for production.

## Important: Exporting Components for Utils/Imports

When creating local development components, you need to explicitly export them in `src/utils/imports.ts` to make them available through the flexible import system.

### Steps to Add a New Local Component:

1. **Create the component** in `src/dev/components/YourComponent/index.tsx`
2. **Export from dev components** in `src/dev/components/index.ts`:
   ```typescript
   export { default as YourComponent } from './YourComponent';
   ```
3. **Add to utils/imports exports** in `src/utils/imports.ts`:
   ```typescript
   // Export individual components with flexible typing
   export const YourComponent = Components.YourComponent;  // Add this line
   export const TestComponent = Components.TestComponent;
   export const IconDev = Components.IconDev;
   // ... other exports
   ```
4. **Import and use** via the flexible system:
   ```typescript
   import { YourComponent } from '../../utils/imports';
   ```

### Why This Step is Required

The `utils/imports.ts` system merges published and local components but requires explicit exports due to TypeScript's static typing. This ensures:
- **Type Safety**: Components are properly typed for IDE support
- **Clear Interface**: Explicit control over what's available through utils/imports
- **Better Error Messages**: Missing exports result in clear import errors

### Troubleshooting

If you get "has no exported member" errors when importing local components:
1. ✅ Check the component is exported from `src/dev/components/index.ts`
2. ✅ Verify the component is added to `src/utils/imports.ts` exports
3. ✅ Restart your development server after adding new exports

## Theming System

The starter kit uses the theming system from `@dankupfer/dn-components`:

### Using Themes

```typescript
// App.tsx
import { ThemeProvider } from '@dankupfer/dn-components';

export default function App() {
  return (
    <ThemeProvider initialTheme="light" initialBrand="lloyds">
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### Using Themes in Components

```typescript
import { useTheme } from '@dankupfer/dn-components';

const MyComponent = () => {
  const { theme, themeName, brandName, toggleTheme, setBrand } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Current theme: {themeName} ({brandName})
      </Text>
    </View>
  );
};
```

For detailed theming documentation, see the [@dankupfer/dn-components README](https://www.npmjs.com/package/@dankupfer/dn-components).

## Component Usage

### Using Tile Components

```tsx
import { Tile } from '@dankupfer/dn-components';

<Tile 
  type="account"
  data={{
    id: 'my-account',
    title: 'Club Lloyds',
    subtitle: '12-34-56 / 12345678',
    accountNumber: '12-34-56 / 12345678',
    balance: 935.68,
    variant: 'condensed',
    onPress: () => console.log('Account pressed'),
  }}
/>
```


For complete component documentation, see the [@dankupfer/dn-components README](https://www.npmjs.com/package/@dankupfer/dn-components).

## JSON-Driven Screen Builder System

The project includes a powerful ScreenBuilder component that creates screens dynamically from JSON configuration files. This allows for rapid prototyping and easy content management.

### How It Works

Each feature module can include a `screenData.json` file that defines the screen structure:

```json
{
  "scrollable": true,
  "style": {
    "backgroundColor": "#000000"
  },
  "components": [
    {
      "type": "AccountCard",
      "props": {
        "id": "club-lloyds",
        "title": "Club Lloyds",
        "balance": 836.50,
        "variant": "condensed"
      },
      "style": {
        "marginBottom": 16
      }
    }
  ]
}
```

### Available Component Types

The ScreenBuilder supports various component types through the existing Tile system:

- **AccountCard**: Bank account displays (condensed and detailed variants)
- **CreditCard**: Credit card information with balances and details
- **ServiceCard**: Service tiles with icons and descriptions
- **ServiceGrid**: 2x2 grids of service items
- **SectionHeader**: Text headers for organizing content
- **PromotionalCard**: Marketing and promotional content

### Creating Screen-Driven Modules

1. **Create your module folder**: `src/modules/feature/your-module/`
2. **Add the component**: `index.tsx` that uses ScreenBuilder
3. **Define the screen**: `screenData.json` with your component configuration

```tsx
// src/modules/feature/your-module/index.tsx
import React from 'react';
import ScreenBuilder, { ScreenConfig } from '../../../components/ScreenBuilder';
import screenData from './screenData.json';

interface YourModuleProps {
  screenWidth: number;
}

const YourModule: React.FC<YourModuleProps> = ({ screenWidth }) => {
  const config = screenData as ScreenConfig;
  
  return (
    <ScreenBuilder 
      config={config} 
      screenWidth={screenWidth} 
    />
  );
};

export default YourModule;
```

### Benefits of the ScreenBuilder System

- **Rapid Prototyping**: Build screens without writing component code
- **Non-Developer Friendly**: Content can be updated by editing JSON files
- **Figma Integration**: Automatically generated from Figma designs
- **Consistent Design**: Uses existing Tile components for uniform styling
- **Theme Integration**: Automatically respects your app's theming system
- **Flexible Layout**: Supports scrollable/non-scrollable screens with custom styling

## Hidden Developer Menu

The project includes a hidden developer menu accessible through a secret gesture sequence. This provides access to development tools without cluttering the main UI.

### Accessing the Developer Menu

1. **Activate gesture mode**: Long press the top-left or top-right corner for 0.8 seconds
2. **Complete the sequence**: 
   - Tap the left edge 3 times quickly
   - Then tap the right edge 3 times quickly
3. **Settings modal opens**: Access theme controls, debug options, and developer tools

### Developer Settings Include

- **Theme Controls**: Switch between light/dark themes and different brand configurations
- **Debug Options**: Toggle visual debugging for gesture zones and system info
- **App Data Management**: Clear all stored data with confirmation
- **Screen Builder Info**: Documentation about the JSON-driven screen system
- **Figma Bridge Status**: Show bridge server connection status
- **Gesture Instructions**: Help for accessing the hidden menu

### Debug Mode

Enable "Show Gesture Debug Info" to see:
- Yellow activation zones in the corners
- Red/green gesture zones when active
- Live tap counter during gesture sequence
- Console logging of gesture events

The hidden menu is designed to be completely invisible to end users while providing developers with essential debugging and testing tools.

## Module System

The project uses a template-based module system defined in `src/config/modules.ts`. Each template includes a pre-selected set of modules that work together seamlessly.

### Available Modules

#### Core Modules
- **Splash**: App startup and loading screens
- **Authentication**: User login and authorization
- **Combined Auth**: Complete authentication flow with ScreenBuilder integration
- **Main Navigator**: React Navigation integration
- **Settings**: Developer settings and configuration

#### Feature Modules
- **Account Overview**: Dashboard components
- **Summary**: Account summary and overview
- **Everyday Banking**: Daily banking operations (JSON-driven)
- **Cards**: Credit and debit card management
- **Applications**: Apply for banking products
- **Statements**: Transaction history and timelines
- **Payments**: Payment processing forms

### Adding Custom Modules

Want to add your own modules? Here's how:

#### 1. Create Module Structure

```bash
# For core modules
mkdir -p src/modules/core/your-module

# For feature modules
mkdir -p src/modules/feature/your-module
```

#### 2. Choose Your Approach

**Option A: Traditional React Component**
```typescript
// src/modules/feature/your-module/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const YourModule = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Custom Module</Text>
      {/* Add your module content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default YourModule;
```

**Option B: JSON-Driven ScreenBuilder**
```typescript
// src/modules/feature/your-module/index.tsx
import React from 'react';
import ScreenBuilder, { ScreenConfig } from '../../../components/ScreenBuilder';
import screenData from './screenData.json';

interface YourModuleProps {
  screenWidth: number;
}

const YourModule: React.FC<YourModuleProps> = ({ screenWidth }) => {
  const config = screenData as ScreenConfig;
  
  return (
    <ScreenBuilder 
      config={config} 
      screenWidth={screenWidth} 
    />
  );
};

export default YourModule;
```

**Option C: Generate from Figma** ⭐ **NEW**
1. Design your module in Figma using DN Figma plugin
2. Export directly to your project
3. Files created automatically with proper structure

#### 3. Add Module to Configuration

Add your module to `src/config/modules.ts`:

```typescript
{
  id: 'your-module',
  name: 'Your Module',
  description: 'Description of what this module does',
  category: 'feature', // or 'core'
  enabled: true,
  dependencies: [], // List any required modules
  priority: 10, // Loading priority (lower numbers load first)
  importFn: () => import('../modules/feature/your-module'),
}
```

#### 4. Import and Use Your Module

Import and use your module in your App component:

```typescript
// App.tsx (or your specific App.<template>.tsx)
import React from 'react';
import YourModule from './src/modules/feature/your-module';

const App = () => {
  return (
    <YourModule />
    // Or integrate it into your navigation/layout
  );
};

export default App;
```

#### 5. Test Your Module

Start the development server to test your changes:

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator  
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your device

### Module Communication

Modules communicate through standard React patterns:

- **Props**: Pass data down to child modules
- **Context**: Share state across multiple modules
- **Direct imports**: Import utilities or components from other modules
- **Navigation**: Use React Navigation to navigate between module screens

Example using React Context:

```typescript
// src/context/AppContext.tsx
import React, { createContext, useContext } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
```

Then use it in your modules:

```typescript
// In your module
import { useApp } from '../../context/AppContext';

const YourModule = () => {
  const { user } = useApp();
  
  return (
    <Text>Welcome, {user?.name}</Text>
  );
};
```

## Development Features

### Hidden Developer Menu
Access advanced development tools through a secret gesture:
1. Long press top corners (0.8 seconds) to activate gesture mode
2. Tap left edge 3 times, then right edge 3 times
3. Access theme switching, debug options, and developer tools

### JSON-Driven Screens
Build screens rapidly using the ScreenBuilder system:
- Define screen structure in `screenData.json` files
- Use existing Tile components through JSON configuration
- Perfect for rapid prototyping and non-developer content updates

### Figma Integration
- Design screens visually in Figma
- Export directly to React Native with one click
- Automatic file creation and routing updates
- Visual order preservation from design to code

### Component Architecture
- **Separation of Concerns**: Logic in `index.tsx`, styles in `styles.ts`
- **Theme Integration**: All components respect the global theming system
- **Module System**: Core and feature modules for organized development

## Related Projects

- **[DN Figma](https://github.com/dankupfer/dn-figma)** - Figma plugin for design-to-code workflow
- **[DN Components](https://github.com/dankupfer/dn-components)** - React Native component library  
- **[DN Tokens](https://github.com/dankupfer/dn-tokens)** - Design tokens and assets

## Support

For issues and questions:
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/dankupfer/dn-starter/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/dankupfer/dn-starter/discussions)
- 📚 **Documentation**: [DN Starter Kit Docs](https://github.com/dankupfer/dn-starter)

For detailed contribution guidelines, including CLI development, see [CONTRIBUTING.md](https://github.com/dankupfer/dn-starter/blob/main/CONTRIBUTING.md)