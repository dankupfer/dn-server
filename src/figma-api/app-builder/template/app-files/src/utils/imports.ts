// template/src/utils/imports.ts
import * as PublishedComponents from '@dankupfer/dn-components';
import * as PublishedTokens from '@dankupfer/dn-tokens';

// Only import local dev components if they exist
let LocalDevComponents: any = {};
let LocalDevTokens: any = {};

try {
    if (process.env.NODE_ENV === 'development') {
        // Try to import local dev components
        LocalDevComponents = require('../dev/components');
        console.log('LocalDevComponents loaded:', Object.keys(LocalDevComponents));
    }
} catch (error) {
    // No local dev components found - that's fine
    console.debug('No local dev components found', error);
}

try {
    if (process.env.NODE_ENV === 'development') {
        // Try to import local dev tokens
        LocalDevTokens = require('../dev/tokens');
    }
} catch {
    // No local dev tokens found - that's fine
    console.debug('No local dev tokens found');
}

// Merge published + local, with local taking precedence
export const Components: any = {
    ...PublishedComponents,
    ...LocalDevComponents,
};

console.log('Final Components object keys:', Object.keys(Components));

export const Tokens = {
    ...PublishedTokens,
    ...LocalDevTokens,
};

// Add this after the token merging in utils/imports.ts
console.log('Published Tokens keys:', Object.keys(PublishedTokens));
console.log('Local Dev Tokens:', LocalDevTokens);
console.log('Final Tokens keys:', Object.keys(Tokens));
console.log('Final Tokens.icons keys:', Tokens.icons ? Object.keys(Tokens.icons) : 'No icons');

// Export individual components with flexible typing

// NAVIGATION COMPONENTS
export const BottomNav = Components.BottomNav;
export const Tabs = Components.Tabs;
export const Header = Components.Header;

// CORE COMPONENTS
export const Icon = Components.Icon;
export const ActionButton = Components.ActionButton;
export const CompactButton = Components.CompactButton;
export const IconButton = Components.IconButton;

// export const BottomTabs = Components.BottomTabs;
// export const PillCarousel = Components.PillCarousel;
// export const Header = Components.Header;
// export const TestComponent = Components.TestComponent;
// export const Tile = Components.Tile;
// export const ThemedText = Components.ThemedText;
// export const Icon = Components.Icon;
// export const useTheme = Components.useTheme;
// export const ThemeProvider = Components.ThemeProvider;
// export const AmountDisplay = Components.AmountDisplay;
// export const IconDev = Components.IconDev;
// export const ScreenBuilder = Components.ScreenBuilder;

// Re-export tokens
export const tokens = Tokens;

// Default export for when you want everything
export default {
    ...Components,
    tokens: Tokens,
};