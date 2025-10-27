# Components Directory

This directory is where you can add custom components specific to your application. The DN Starter Kit uses the **DN Components Library** for most UI components, so this directory is initially empty.

## Using Components in DN Starter Kit

### From DN Components Library

The starter kit comes with the **DN Components Library** pre-installed, which provides a comprehensive set of production-ready components:

```tsx
import { 
  Tile, 
  ActionButton, 
  Header, 
  Tabs, 
  ScreenBuilder,
  HiddenDevMenu,
  FlagManager,
  ThemeProvider,
  Icon 
} from '@dankupfer/dn-components';

// Use components directly
<ActionButton type="Primary">
  Get Started
</ActionButton>

<Tile 
  type="account"
  data={{
    id: 'my-account',
    title: 'Current Account',
    balance: 1234.56,
    variant: 'condensed'
  }}
/>
```

### Creating Custom Components

When you need components specific to your app that aren't available in the DN Components Library, create them in this directory:

```
src/components/
├── README.md                 # This file
├── CustomButton/             # Your custom component
│   ├── index.tsx
│   ├── CustomButton.tsx
│   ├── types.ts
│   └── styles.ts
└── SpecialCard/              # Another custom component
    ├── index.tsx
    ├── SpecialCard.tsx
    ├── types.ts
    └── styles.ts
```

### Component Structure

Follow this structure for consistency with the DN Components Library:

```tsx
// src/components/CustomButton/index.tsx
export { default } from './CustomButton';
export * from './types';

// src/components/CustomButton/CustomButton.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@dankupfer/dn-components';
import { createCustomButtonStyles } from './styles';
import { CustomButtonProps } from './types';

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, variant = 'primary' }) => {
  const { theme } = useTheme();
  const styles = createCustomButtonStyles(theme);
  
  return (
    <TouchableOpacity 
      style={[styles.button, styles[variant]]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

// src/components/CustomButton/types.ts
export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

// src/components/CustomButton/styles.ts
import { StyleSheet } from 'react-native';

export const createCustomButtonStyles = (theme: any) =>
  StyleSheet.create({
    button: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    primary: {
      backgroundColor: theme.colors.primary[500],
    },
    secondary: {
      backgroundColor: theme.colors.neutral[200],
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.fontSize.base,
      fontFamily: theme.fontFamily.primary,
    },
  });
```

## Best Practices

### 1. Use DN Components First

Before creating a custom component, check if the DN Components Library already provides what you need:

- **Buttons**: ActionButton, CompactButton, IconButton
- **Navigation**: Header, Tabs, BottomNav
- **Content**: Tile (account, service, promotional variants)
- **Helpers**: ScreenBuilder, HiddenDevMenu, FlagManager
- **Icons**: Icon with automatic name resolution

### 2. Theme Integration

Always use the theme system for consistent styling:

```tsx
import { useTheme } from '@dankupfer/dn-components';

const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Themed text
      </Text>
    </View>
  );
};
```

### 3. TypeScript Support

Use TypeScript for all custom components:

```tsx
interface MyComponentProps {
  title: string;
  optional?: boolean;
  onPress: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, optional = false, onPress }) => {
  // Component implementation
};
```

### 4. Icon Usage

Use the Icon component with simple names:

```tsx
import { Icon } from '@dankupfer/dn-components';

// Simple names (recommended)
<Icon name="settings" size={24} />
<Icon name="home" color={theme.colors.primary[500]} />

// Available categories: navigation, actions, arrows, finance, communication, security, sentiment, misc
```

### 5. JSON-Driven Screens

Consider using ScreenBuilder for complex layouts:

```tsx
import { ScreenBuilder } from '@dankupfer/dn-components';

const screenConfig = {
  scrollable: true,
  components: [
    {
      type: 'SectionHeader',
      props: { title: 'My Section' }
    },
    {
      type: 'AccountCard',
      props: {
        id: 'account-1',
        title: 'Savings',
        balance: 1500.00,
        variant: 'condensed'
      }
    }
  ]
};

<ScreenBuilder config={screenConfig} screenWidth={screenWidth} />
```

## When to Create Custom Components

Create custom components in this directory when:

- The functionality doesn't exist in DN Components Library
- You need app-specific business logic
- You need to combine multiple DN components into a reusable pattern
- You need specialized styling that can't be achieved with theme tokens

## Integration with Modules

Custom components can be used in your modules:

```tsx
// src/modules/feature/my-module/index.tsx
import CustomButton from '../../components/CustomButton';
import { Tile } from '@dankupfer/dn-components';

const MyModule = () => {
  return (
    <View>
      <Tile type="service" data={serviceData} />
      <CustomButton title="Custom Action" onPress={handlePress} />
    </View>
  );
};
```

## Resources

- **DN Components Library**: [Documentation and Storybook examples](https://github.com/dankupfer/dn-components)
- **DN Tokens**: [Design tokens and theming system](https://github.com/dankupfer/dn-tokens)
- **Starter Kit Modules**: `src/modules/` for feature-specific implementations
- **Theme System**: Use `useTheme()` hook for consistent styling

## Examples

Check existing modules for examples of component usage:

- `src/modules/feature/summary/` - Uses Tile components
- `src/modules/feature/everyday/` - JSON-driven with ScreenBuilder
- `src/modules/core/settings/` - FlagManager integration
- `App.full.tsx` - HiddenDevMenu integration

Remember: The goal is to leverage the DN Components Library for consistent UI patterns while adding your app-specific functionality through custom components when needed.