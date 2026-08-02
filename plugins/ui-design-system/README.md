# UI Design System (Qoder Plugin)

Qoder-native packaging of the **ui-design-system** skill: a toolkit for creating
and maintaining scalable design systems (design tokens, responsive rules,
accessibility, and developer handoff).

## What it does
- Generates a complete palette, type scale, spacing grid, shadow/animation
  tokens, and responsive breakpoints from a single brand color.
- Guides exporting tokens as CSS variables (light + dark) and mirroring them
  into a framework theme layer.
- Encourages WCAG AA contrast verification before handoff.

## Included
- `skills/ui-design-system/SKILL.md` — converted skill workflow.
- `assets/avatar.svg` — generated logo (provenance: created for this package).

## Source / provenance
- Source: https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/skills/creative-design/ui-design-system/SKILL.md
- Author: davila7 (claude-code-templates).

## Omitted files
- `scripts/design_token_generator.py` — referenced by the source SKILL.md but
  **not copied** (script body not retrieved from source). The SKILL.md still
  documents its usage and features; fetch the script from the source repo if the
  automated generator is required. The token workflow can also be performed
  manually per the "Applying Tokens" section.

## Setup notes
- No credentials required.
- The `design_token_generator.py` script requires Python 3 if added later.

## Validation
```bash
python3 scripts/validate_qoder_plugin.py plugins/ui-design-system
```
