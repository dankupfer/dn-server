# Local Development Resources & Component Organization

This directory contains local development resources that extend the published packages:

- `@dankupfer/dn-components` - Published component library
- `@dankupfer/dn-tokens` - Published design tokens

## Component Organization Principles

### **Published Components (`@dankupfer/dn-components`)**
**Criteria:** Reusable across projects, stable API, design system components

- ✅ **AmountDisplay** - Currency/number formatting
- ✅ **Icon** - SVG icon system
- ✅ **ThemedText** - Typography component
- ✅ **ThemeSwitcher** - Theme controls
- ✅ **BottomTabs** - Tab navigation component
- ✅ **Header** - App header component
- ✅ **PillCarousell** - Pill-style navigation
- ✅ **Tile** - Various tile components (already published)

### **Template-Specific Components (`src/components/`)**
**Criteria:** Template-specific logic, not reusable as design components

- ✅ **ScreenBuilder** - JSON-driven screen rendering (template-specific)
- ✅ **HiddenDevMenu** - Development tools for generated apps

### **Development Experiments (`src/dev/components/`)**
**Criteria:** Experimental, unstable, or testing variations

- 🧪 Components you're prototyping
- 🧪 Variations of existing components
- 🧪 Features being tested before publishing

## Decision Framework

When creating a new component, ask:

### **Should it go to `@dankupfer/dn-components`?**
- ✅ Would this be useful in other React Native projects?
- ✅ Is the API stable and well-defined?
- ✅ Is it a reusable UI/design component?
- ✅ Does it follow design system patterns?

### **Should it stay in `src/components/`?**
- ✅ Is this specific to the starter template?
- ✅ Does it contain template-specific logic?
- ✅ Is it a development tool for generated apps?
- ✅ Would users expect this in their generated project?

### **Should it go in `src/dev/components/`?**
- ✅ Is this experimental or unstable?
- ✅ Are you still iterating on the design/API?
- ✅ Should this be excluded from generated projects?
- ✅ Is this a temporary prototype?

## Local Development Structure

```
dev/
├── components/          # Local component experiments
│   ├── index.ts        # Export your components here
│   └── MyNewTile/      # Example component
├── tokens/             # Local token experiments  
│   ├── index.ts        # Export your tokens here
│   └── experimental.ts # Example tokens
└── README.md           # This file
```

## Usage

Components and tokens from this directory are automatically merged with published packages via `src/utils/imports.ts`.

```typescript
// Import from centralized location
import { Tile, ThemedText, MyNewComponent } from '@/utils/imports';
//       ^^^^  ^^^^^^^^^  ^^^^^^^^^^^^^^^
//    published published    local dev
```

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

## Migration Path

When components/tokens are ready for publication:

1. **Move to published package** (`@dankupfer/dn-components` or `@dankupfer/dn-tokens`)
2. **Test and publish** the package  
3. **Update template imports** to use published version
4. **Test CLI generation** to ensure it works
5. **Delete local version** from this directory

## CLI Generation Behavior

- ✅ **`src/components/`** - Included in generated projects
- ✅ **`@dankupfer/dn-components`** - Installed as npm dependency
- ❌ **`src/dev/`** - Excluded from generated projects (development only)

## Development Workflow

```bash
# 1. Develop locally with dev/ folder
npm start  # Uses local dev components + published components

# 2. When ready, migrate to published package
# Move component to @dankupfer/dn-components

# 3. Publish the component package
cd dn-components && npm publish

# 4. Test CLI generation (dev/ folder excluded)
npm run test:generator

# 5. Publish CLI with updated template
npm publish
```

## Current Migration Status

### **To be moved to `@dankupfer/dn-components`:**
- [ ] AmountDisplay (remove from src/components/)
- [ ] Icon (remove from src/components/)
- [ ] ThemedText (remove from src/components/)
- [ ] ThemeSwitcher (remove from src/components/)
- [ ] BottomTabs (move to dn-components)
- [ ] Header (move to dn-components)
- [ ] PillCarousell (move to dn-components)

### **Staying in `src/components/`:**
- [x] ScreenBuilder (template-specific JSON logic)
- [x] HiddenDevMenu (development tools)

## Development Only

Resources in `src/dev/` are only loaded in `NODE_ENV === 'development'` and are excluded from production builds and CLI generation.