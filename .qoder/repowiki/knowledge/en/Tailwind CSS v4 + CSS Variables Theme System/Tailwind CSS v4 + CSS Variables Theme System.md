---
kind: frontend_style
name: Tailwind CSS v4 + CSS Variables Theme System
category: frontend_style
scope:
    - '**'
source_files:
    - Frontend/studentbite/app/globals.css
    - Frontend/studentbite/postcss.config.mjs
    - Frontend/studentbite/package.json
    - Frontend/studentbite/components/TabBar.tsx
    - Frontend/studentbite/components/ProgressBar.tsx
---

The StudentBites frontend uses a mobile-first styling approach built on Tailwind CSS v4 with CSS custom properties for theming. The system is centered around a single global stylesheet that defines design tokens and applies them through Tailwind's new `@theme inline` directive.

**Core Styling Stack:**
- Tailwind CSS v4 (`tailwindcss: ^4`, `@tailwindcss/postcss: ^4`) configured via PostCSS plugin in `postcss.config.mjs`
- Next.js App Router with client components marked by the `"use client"` directive
- No separate CSS framework or component library — all UI is composed from Tailwind utility classes directly in JSX

**Design Token Architecture:**
Global CSS variables are defined in `app/globals.css` under `:root` for background, foreground, primary colors, and their dark variants. These are exposed to Tailwind through the `@theme inline` block, mapping CSS variables to Tailwind color utilities (`--color-background`, `--color-foreground`, `--color-primary`). Typography tokens use Geist font families (`--font-sans`, `--font-mono`) imported as CSS variables.

**Mobile-First Conventions:**
The app targets mobile devices with specific patterns:
- Fixed bottom tab bar using `fixed inset-x-0 bottom-0 z-[1000]` positioning
- iOS safe area handling via `.pb-safe` class using `env(safe-area-inset-bottom, 0px)`
- Touch optimizations like `-webkit-tap-highlight-color: transparent`
- Maximum width constraints (`max-w-[480px]`) for tablet/desktop views
- Custom scrollbar hiding utilities (`.no-scrollbar`) for horizontal scroll containers

**Component Styling Patterns:**
Components use inline Tailwind classes rather than external stylesheets. The TabBar component demonstrates the pattern of conditional class composition based on active state, while ProgressBar accepts a `color` prop that takes Tailwind class strings (e.g., `bg-green-500`) for flexible theming. All interactive elements use Tailwind's transition utilities for smooth state changes.

**Build Integration:**
Tailwind is integrated through the standard Next.js + PostCSS pipeline. The `next.config.ts` handles API rewrites but has no additional CSS configuration, relying on Tailwind v4's automatic detection of utility usage.