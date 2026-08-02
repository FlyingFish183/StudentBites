---
name: ui-design-system
description: UI design system toolkit for Senior UI Designer including design token generation, component documentation, responsive design calculations, and developer handoff tools. Use for creating design systems, maintaining visual consistency, and facilitating design-dev collaboration.
---

# UI Design System

Professional toolkit for creating and maintaining scalable design systems.

## Core Capabilities
- Design token generation (colors, typography, spacing)
- Component system architecture
- Responsive design calculations
- Accessibility compliance
- Developer handoff documentation

## Key Scripts

### design_token_generator.py
Generates complete design system tokens from brand colors.

**Usage**: `python scripts/design_token_generator.py [brand_color] [style] [format]`
- Styles: modern, classic, playful
- Formats: json, css, scss

**Features**:
- Complete color palette generation
- Modular typography scale
- 8pt spacing grid system
- Shadow and animation tokens
- Responsive breakpoints
- Multiple export formats

## Applying Tokens

1. Derive a full palette from one brand color: generate tints/shades (50-900),
   plus semantic roles (primary, secondary, accent/warning, success, neutral).
2. Build a modular type scale (e.g. 1.25 ratio) and an 8pt spacing grid.
3. Define breakpoints for mobile / tablet / desktop and map layout rules
   (bottom nav vs sidebar, single vs multi-column) to each.
4. Export tokens as CSS variables (light + dark themes) and mirror them into the
   framework theme layer (e.g. Tailwind `@theme`).
5. Verify WCAG AA contrast for text/background pairings before handoff.
