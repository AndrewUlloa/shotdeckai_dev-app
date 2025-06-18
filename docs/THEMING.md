# Theming System Documentation

This project uses `next-themes` for theme management with support for light mode, dark mode, and system preferences.

## Current Setup

### 1. Theme Provider

The theme provider is already configured in `app/providers.tsx` and wraps the entire application in `app/layout.tsx`.

### 2. Available Themes

- **Light Mode**: Clean, bright theme
- **Dark Mode**: Dark theme for low-light environments
- **System**: Automatically follows the user's OS preference

### 3. Theme Toggle Components

Two theme toggle components are available in `components/ui/theme-toggle.tsx`:

- `ThemeToggle`: Three-button toggle for light/dark/system
- `ThemeToggleDropdown`: Single button that cycles through themes

## Usage Guide

### Adding the Theme Toggle to Your UI

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";
// or
import { ThemeToggleDropdown } from "@/components/ui/theme-toggle";

// In your component
<ThemeToggle />;
```

### Using Theme-Aware Styling

#### 1. With Tailwind Dark Mode Classes

```tsx
<div className="bg-white dark:bg-black text-black dark:text-white">
  Content that changes based on theme
</div>
```

#### 2. Using Custom CSS Variables

The following CSS variables are available:

- `--glass-bg`: Glass morphism background
- `--glass-border`: Glass morphism border
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--shadow-primary`: Primary shadow
- `--shadow-secondary`: Secondary shadow

Use them in Tailwind:

```tsx
<div className="bg-glass-bg border-glass-border text-text-primary">
  Theme-aware glass effect
</div>
```

#### 3. Using the Custom Hook

```tsx
import { useThemeAware } from "@/lib/hooks/use-theme-aware";

function MyComponent() {
  const { theme, getThemeClass, getGlassClass, getShadowClass } =
    useThemeAware();

  return (
    <div className={getGlassClass()}>
      <p className={getThemeClass("text-gray-900", "text-gray-100")}>
        Themed text
      </p>
    </div>
  );
}
```

## Next Steps

When you're ready to apply theming to your components:

1. Add the theme toggle to your header/navigation
2. Update component styles to use theme-aware classes
3. Replace hardcoded colors with CSS variables
4. Test all three theme modes

## CSS Variables Reference

### Light Mode

```css
--glass-bg: rgba(255, 255, 255, 0.1);
--glass-border: rgba(255, 255, 255, 0.5);
--text-primary: rgba(255, 255, 255, 1);
--text-secondary: rgba(255, 255, 255, 0.8);
--shadow-primary: rgba(0, 0, 0, 0.25);
--shadow-secondary: rgba(158, 158, 170, 0.25);
```

### Dark Mode

```css
--glass-bg: rgba(0, 0, 0, 0.3);
--glass-border: rgba(255, 255, 255, 0.2);
--text-primary: rgba(255, 255, 255, 1);
--text-secondary: rgba(255, 255, 255, 0.7);
--shadow-primary: rgba(0, 0, 0, 0.5);
--shadow-secondary: rgba(100, 100, 110, 0.25);
```
